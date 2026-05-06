import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import PrintModal from '../components/PrintModal';
import { Currency } from '../lib/Currency';
import {
  Grid3X3, Users, Clock, X, Plus, Printer, ShoppingCart, Trash2,
  Receipt, ChevronDown, Minus, Send, DollarSign
} from 'lucide-react';

export default function Tables() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [orderPanel, setOrderPanel] = useState<'hidden' | 'table' | 'order'>('hidden');
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [printType, setPrintType] = useState<'kot' | 'bill'>('bill');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [orderNotes, setOrderNotes] = useState('');

  // Fetch tables
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await api.get('/tables');
      return res.data;
    },
  });

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await api.get('/menu/items');
      return res.data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Fetch active orders
  const { data: activeOrder = [] } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: async () => {
      const res = await api.get('/orders/active');
      return res.data;
    },
  });

  // Update table status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: string; status: string }) => {
      return api.patch(`/tables/${tableId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  // Create table
  const createTableMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/tables', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowAddModal(false);
    },
  });

  // Create order
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/orders', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setCart([]);
      setOrderNotes('');
      setPrintOrder(data.data);
      setPrintType('kot');
      setOrderPanel('hidden');
      setSelectedTable(null);
    },
  });

  const tableOrders = selectedTable
    ? activeOrder?.filter((o: any) => o.tableId === selectedTable.id)
    : [];

  const sections = [...new Set(tables.map((t: any) => t.section || 'Other'))];

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter((item: any) => item.categoryId === activeCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 border-emerald-500 text-emerald-700';
      case 'occupied':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'reserved':
        return 'bg-amber-100 border-amber-500 text-amber-700';
      default:
        return 'bg-slate-100 border-slate-500 text-slate-700';
    }
  };

  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        notes: ''
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(cart.map((c) => {
      if (c.menuItemId === menuItemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((c) => c.menuItemId !== menuItemId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = () => {
    if (!selectedTable || cart.length === 0) return;
    createOrderMutation.mutate({
      tableId: selectedTable.id,
      orderType,
      items: cart,
      notes: orderNotes,
    });
  };

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    if (table.status === 'available') {
      setOrderPanel('table');
      setOrderType('dine-in');
    } else {
      setOrderPanel('order');
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Grid3X3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Table Layout</h1>
            <p className="text-slate-500 text-sm">Click table to take order</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Available</p>
              <p className="text-2xl font-bold text-slate-900">
                {tables.filter((t: any) => t.status === 'available').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Occupied</p>
              <p className="text-2xl font-bold text-slate-900">
                {tables.filter((t: any) => t.status === 'occupied').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Total</p>
              <p className="text-2xl font-bold text-slate-900">{tables.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-500">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Active Orders</p>
              <p className="text-2xl font-bold text-slate-900">{activeOrder?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table: any) => (
            <motion.div
              key={table.id}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTableClick(table)}
              className={`
                relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all
                ${table.status === 'available' 
                  ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30' 
                  : 'bg-gradient-to-br from-rose-400 via-red-500 to-orange-600 shadow-lg shadow-red-500/30'
                }
              `}
            >
              {/* Decorative pattern */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <div className="w-full h-full bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-white drop-shadow-sm">T-{table.number}</span>
                <div className={`w-4 h-4 rounded-full border-2 border-white ${table.status === 'available' ? 'bg-white' : 'bg-white/50'}`}>
                  {table.status === 'occupied' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-white/90 font-medium">{table.capacity} Seats</p>
                {table.section && <p className="text-white/70 text-xs">{table.section}</p>}
              </div>

              {table.status === 'occupied' && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-white/70 text-xs">Bill Total</p>
                  <p className="text-xl font-bold text-white font-mono">
                    <Currency amount={tableOrders.filter((o: any) => o.tableId === table.id).reduce((sum: number, o: any) => sum + o.total, 0)} />
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Panel - Slide in from right */}
      <AnimatePresence>
        {orderPanel !== 'hidden' && selectedTable && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Table {selectedTable.number}
                </h2>
                <p className="text-sm text-slate-500 capitalize">
                  {selectedTable.status === 'available' ? 'New Order' : 'Active Orders'}
                </p>
              </div>
              <button
                onClick={() => { setOrderPanel('hidden'); setSelectedTable(null); setCart([]); }}
                className="p-2 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {orderPanel === 'table' ? (
                <>
                  {/* Order Type & Menu */}
                  <div className="flex items-center gap-2 p-3 border-b border-slate-200">
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="dine-in">Dine In</option>
                      <option value="takeaway">Takeaway</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>

                  {/* Categories */}
                  <div className="flex gap-2 p-3 border-b border-slate-200 overflow-x-auto">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeCategory === 'all' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      All
                    </button>
                    {categories.map((cat: any) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-2 gap-3">
                      {filteredItems.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="p-3 bg-slate-50 rounded-xl hover:bg-primary-50 border border-transparent hover:border-primary-500 transition-all text-left"
                        >
                          <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                          <p className="text-primary-600 font-mono mt-1"><Currency amount={item.price} /></p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cart & Order Summary */}
                  <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                    {/* Cart Items */}
                    {cart.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.menuItemId} className="flex items-center justify-between glass p-2 rounded-lg border border-white/30">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500"><Currency amount={item.price} /> each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-mono">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                                <Plus className="w-3 h-3" />
                              </button>
                              <button onClick={() => removeFromCart(item.menuItemId)} className="ml-2 text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    <input
                      type="text"
                      placeholder="Order notes (optional)"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="input-field text-sm"
                    />

                    {/* Totals & Place Order */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-mono text-slate-900"><Currency amount={cartSubtotal} /></span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-slate-900">Total</span>
                        <span className="font-mono text-primary-600"><Currency amount={cartSubtotal} /></span>
                      </div>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={cart.length === 0 || createOrderMutation.isPending}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order & Print KOT'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Order View - For occupied tables */
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {tableOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No active orders</p>
                    </div>
                  ) : (
                    tableOrders.map((order: any) => (
                      <div key={order.id} className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900"><Currency amount={order.total} /></p>
                            <p className="text-xs text-slate-500">{order.items?.length} items</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm py-1">
                              <span className="text-slate-600">{item.quantity}x {item.menuItem?.name}</span>
                              <span className="text-slate-900"><Currency amount={item.totalPrice} /></span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => { setPrintOrder(order); setPrintType('kot'); }}
                            className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <Printer className="w-4 h-4" /> KOT
                          </button>
                          <button
                            onClick={() => { setPrintOrder(order); setPrintType('bill'); }}
                            className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <Receipt className="w-4 h-4" /> Bill
                          </button>
                        </div>

                        {order.status === 'pending' && (
                          <button
                            onClick={() => {
                              api.patch(`/orders/${order.id}/status`, { status: 'preparing' }).then(() => queryClient.invalidateQueries({ queryKey: ['orders'] }));
                            }}
                            className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => {
                              api.patch(`/orders/${order.id}/status`, { status: 'ready' }).then(() => queryClient.invalidateQueries({ queryKey: ['orders'] }));
                            }}
                            className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                          >
                            Mark Ready
                          </button>
                        )}
                      </div>
                    ))
                  )}

                  {/* Clear Table */}
                  <button
                    onClick={() => {
                      updateStatusMutation.mutate({ tableId: selectedTable.id, status: 'available' });
                      setOrderPanel('hidden');
                      setSelectedTable(null);
                    }}
                    className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
                  >
                    Clear Table
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      {showAddModal && (
        <AddTableModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createTableMutation.mutate(data)}
          isLoading={createTableMutation.isPending}
        />
      )}

      {/* Print Modal */}
      <PrintModal
        isOpen={!!printOrder}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
        type={printType}
      />
    </div>
  );
}

function AddTableModal({ onClose, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({ number: '', capacity: 4, section: '' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass-card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Add Table</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="input-label">Table Number</label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="input-field"
              placeholder="e.g., 1, 2A, 101"
              required
            />
          </div>
          <div>
            <label className="input-label">Capacity (seats)</label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Section (optional)</label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="input-field"
              placeholder="e.g., Ground Floor, Terrace"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Adding...' : 'Add Table'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}