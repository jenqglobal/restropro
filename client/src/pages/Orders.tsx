import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import PrintModal from '../components/PrintModal';
import { subscribeToEvent } from '../lib/socket';
import { Currency } from '../lib/Currency';
import {
  Receipt, Search, Filter, Clock, CheckCircle, XCircle, DollarSign,
  Plus, X, ShoppingCart, Trash2, Printer, CreditCard, Tag, User
} from 'lucide-react';

export default function Orders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Real-time updates
  useEffect(() => {
    const unsubOrder = subscribeToEvent('new-order', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });
    const unsubUpdate = subscribeToEvent('order-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });
    const unsubStatus = subscribeToEvent('order-status-changed', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });
    
    return () => {
      unsubOrder();
      unsubUpdate();
      unsubStatus();
    };
  }, [queryClient]);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const res = await api.get(`/orders?status=${statusFilter}`);
      return res.data;
    },
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await api.get('/menu');
      return res.data;
    },
  });

  const orders = ordersData?.orders || [];

  const filteredOrders = orders.filter((order: any) =>
    search ? order.orderNumber.toLowerCase().includes(search.toLowerCase()) : true
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'preparing': return 'badge-info';
      case 'ready': return 'badge-success';
      case 'completed': return 'bg-slate-500/20 text-slate-400';
      case 'cancelled': return 'badge-error';
      default: return '';
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return api.patch(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
    },
  });

  const addItemsMutation = useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string; items: any[] }) => {
      return api.post(`/orders/${orderId}/items`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowAddItem(false);
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: async ({ orderId, discount, discountType, discountValue }: any) => {
      return api.post(`/orders/${orderId}/discount`, { discount, discountType, discountValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowDiscount(false);
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentMode }: { orderId: string; paymentMode: string }) => {
      return api.post(`/orders/${orderId}/payment`, { paymentMode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowPayment(false);
      setSelectedOrder(null);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({ orderId, itemId }: { orderId: string; itemId: string }) => {
      return api.delete(`/orders/${orderId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
            <p className="text-slate-500 text-sm">View and manage all orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 py-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-40 py-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order: any) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card hover:bg-white/15 transition-colors cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-semibold font-mono">{order.orderNumber}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      {order.table && <span>Table {order.table.number}</span>}
                      <span className="capitalize">{order.orderType}</span>
                      <span>by {order.user?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900 font-mono">
                      <Currency amount={order.total} />
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {order.items?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 5).map((item: any) => (
                      <span key={item.id} className="px-2 py-1 bg-white/5 rounded-lg text-sm text-slate-300">
                        {item.quantity}x {item.menuItem?.name}
                      </span>
                    ))}
                    {order.items.length > 5 && (
                      <span className="px-2 py-1 text-sm text-slate-400">
                        +{order.items.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: selectedOrder.id, status })}
            onAddItem={() => setShowAddItem(true)}
            onDiscount={() => setShowDiscount(true)}
            onPayment={() => setShowPayment(true)}
            onPrintKOT={() => { setPrintOrder(selectedOrder); }}
            onPrintBill={() => { setPrintOrder(selectedOrder); }}
            isUpdating={updateStatusMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItem && selectedOrder && (
          <AddItemModal
            menuItems={menuItems}
            onClose={() => setShowAddItem(false)}
            onSubmit={(items) => addItemsMutation.mutate({ orderId: selectedOrder.id, items })}
            isLoading={addItemsMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Discount Modal */}
      <AnimatePresence>
        {showDiscount && selectedOrder && (
          <DiscountModal
            currentDiscount={selectedOrder.discount || 0}
            onClose={() => setShowDiscount(false)}
            onSubmit={(discount, discountType, discountValue) => 
              applyDiscountMutation.mutate({ orderId: selectedOrder.id, discount, discountType, discountValue })
            }
            isLoading={applyDiscountMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && selectedOrder && (
          <PaymentModal
            total={selectedOrder.total}
            onClose={() => setShowPayment(false)}
            onSubmit={(paymentMode) => processPaymentMutation.mutate({ orderId: selectedOrder.id, paymentMode })}
            isLoading={processPaymentMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Print Modal */}
      <PrintModal
        isOpen={!!printOrder}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
        type="bill"
      />
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdateStatus, onAddItem, onDiscount, onPayment, onPrintKOT, onPrintBill, isUpdating }: any) {
  const canEdit = ['pending', 'preparing'].includes(order.status);
  const canPayment = order.paymentStatus !== 'paid' && order.status !== 'cancelled';
  const canCancel = order.status === 'pending' || order.status === 'preparing';

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
        exit={{ scale: 0.9 }}
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-mono">{order.orderNumber}</h2>
            <p className="text-slate-500 text-sm">
              {order.table ? `Table ${order.table.number} • ` : ''}
              {order.orderType} • by {order.user?.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Items</h3>
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <p className="text-slate-900 font-medium">{item.menuItem?.name}</p>
                {item.notes && <p className="text-xs text-slate-500">Note: {item.notes}</p>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-500">{item.quantity}x</span>
                <span className="text-slate-900 font-mono"><Currency amount={item.totalPrice} /></span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 pt-4 space-y-2 mb-6">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="text-slate-900 font-mono"><Currency amount={order.subtotal} /></span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span className="font-mono">-£{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span className="text-slate-900 font-mono">£{order.tax}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total</span>
            <span className="font-mono"><Currency amount={order.total} /></span>
          </div>
          {order.paymentStatus === 'paid' && (
            <div className="flex justify-between text-emerald-400">
              <span>Paid via</span>
              <span className="capitalize">{order.paymentMode}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <button onClick={onPrintKOT} className="btn-secondary flex items-center gap-2">
              <Printer className="w-4 h-4" /> KOT
            </button>
            <button onClick={onPrintBill} className="btn-secondary flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Bill
            </button>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <button onClick={onAddItem} className="btn-primary flex items-center gap-2 flex-1">
                <Plus className="w-4 h-4" /> Add Items
              </button>
              <button onClick={onDiscount} className="btn-secondary flex items-center gap-2">
                <Tag className="w-4 h-4" /> Discount
              </button>
            </div>
          )}

          {order.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus('preparing')}
              disabled={isUpdating}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Clock className="w-4 h-4" /> Start Preparing
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={() => onUpdateStatus('ready')}
              disabled={isUpdating}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-600"
            >
              <CheckCircle className="w-4 h-4" /> Mark Ready
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={() => onUpdateStatus('completed')}
              disabled={isUpdating}
              className="w-full py-3 rounded-xl bg-green-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4" /> Complete Order
            </button>
          )}

          {canPayment && (
            <button
              onClick={onPayment}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-600"
            >
              <CreditCard className="w-4 h-4" /> Process Payment
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onUpdateStatus('cancelled')}
              disabled={isUpdating}
              className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/30"
            >
              <XCircle className="w-4 h-4" /> Cancel Order
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddItemModal({ menuItems, onClose, onSubmit, isLoading }: any) {
  const [items, setItems] = useState<{ menuItemId: string; quantity: number; notes: string }[]>([]);

  const addItem = () => setItems([...items, { menuItemId: '', quantity: 1, notes: '' }]);
  
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(items.filter(i => i.menuItemId));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass-card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Add Items</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <select
                value={item.menuItemId}
                onChange={(e) => updateItem(index, 'menuItemId', e.target.value)}
                className="input-field flex-1"
              >
                <option value="">Select Item</option>
                {menuItems.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} - £{m.price}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                className="input-field w-16"
              />
              <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button type="button" onClick={addItem} className="text-primary-400 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Item
          </button>

          <button type="submit" disabled={isLoading || items.length === 0} className="btn-primary w-full">
            {isLoading ? 'Adding...' : 'Add Items'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DiscountModal({ currentDiscount, onClose, onSubmit, isLoading }: any) {
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(currentDiscount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(discountValue, discountType, discountValue);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass-card w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Apply Discount</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="input-field"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (£)</option>
            </select>
          </div>

          <div>
            <label className="input-label">Discount Value</label>
            <input
              type="number"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
              className="input-field"
              placeholder={discountType === 'percentage' ? 'e.g., 10' : 'e.g., 100'}
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Applying...' : 'Apply Discount'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function PaymentModal({ total, onClose, onSubmit, isLoading }: any) {
  const [paymentMode, setPaymentMode] = useState('cash');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass-card w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Process Payment</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm">Total Amount</p>
          <p className="text-3xl font-bold text-white font-mono"><Currency amount={total} /></p>
        </div>

        <div className="space-y-3 mb-6">
          {['cash', 'card', 'upi', 'wallet'].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              className={`w-full p-4 rounded-xl border text-left capitalize transition-all ${
                paymentMode === mode
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              {mode === 'cash' && <DollarSign className="w-5 h-5 inline mr-2" />}
              {mode === 'card' && <CreditCard className="w-5 h-5 inline mr-2" />}
              {mode === 'upi' && <span className="inline mr-2">📱</span>}
              {mode === 'wallet' && <span className="inline mr-2">👛</span>}
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => onSubmit(paymentMode)}
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Processing...' : <>Pay <Currency amount={total} /></>}
        </button>
      </motion.div>
    </motion.div>
  );
}