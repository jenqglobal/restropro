import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { usePOSStore } from '../lib/stores/posStore';
import { useSettingsStore } from '../lib/stores/settingsStore';
import { subscribeToEvent } from '../lib/socket';
import { Currency } from '../lib/Currency';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Receipt,
  CreditCard,
  DollarSign,
  Smartphone,
  X,
  Percent,
  Users,
  UtensilsCrossed,
  ShoppingCart,
  Truck,
  Search,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category: { name: string };
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function POS() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash');
const [orderNotes, setOrderNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  const {
    currentTable,
    setCurrentTable,
    orderType,
    setOrderType,
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = usePOSStore();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return res.data;
    },
  });

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory
        ? `/menu/items/${selectedCategory}`
        : '/menu/items';
      const res = await api.get(url);
      return res.data as MenuItem[];
    },
  });

  // Fetch tables
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await api.get('/tables');
      return res.data;
    },
  });

  // Currency formatter from settings
  const { formatCurrency } = useSettingsStore();

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubOrder = subscribeToEvent('order-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    });

    return () => {
      unsubOrder();
    };
  }, [queryClient]);

  // Create order mutation (for non-payment checkout)
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const { subtotal, tax, total } = getCartTotal();
      let finalTotal = total;

      // Apply discount if any
      if (discountValue > 0) {
        let discount = 0;
        if (discountType === 'percentage') {
          discount = subtotal * (discountValue / 100);
        } else {
          discount = discountValue;
        }
        finalTotal = total - discount;
      }

      return api.post('/orders', {
        tableId: currentTable || null,
        orderType,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
        notes: orderNotes,
      });
    },
    onSuccess: async (res) => {
      // Process payment if selected
      if (showPayment && paymentMode) {
        await api.post(`/orders/${res.data.id}/payment`, {
          mode: paymentMode,
          amount: getCartTotal().total,
        });
      }

      clearCart();
      setShowPayment(false);
      setDiscountValue(0);
      setOrderNotes('');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Handle checkout with payment
  const handleCheckout = async () => {
    try {
      const orderData = {
        tableId: currentTable || null,
        orderType,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
        notes: orderNotes || null,
      };
      console.log('Creating order with data:', orderData);
      
      const orderRes = await api.post('/orders', orderData);

      const orderId = orderRes.data.id;

      // Then process payment
      if (showPayment && paymentMode) {
        const { total } = getCartTotal();
        await api.post(`/orders/${orderId}/payment`, {
          mode: paymentMode,
          amount: total,
        });
      }

      // Clear cart and reset
      clearCart();
      setShowPayment(false);
      setDiscountValue(0);
      setOrderNotes('');
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      alert('Order placed successfully!');
    } catch (error: any) {
      console.error('Order failed:', error);
      console.log('Error response:', error.response);
      console.log('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to place order';
      alert('Error: ' + errorMsg);
    }
  };

  const { subtotal, tax, total } = getCartTotal();
  const finalTotal =
    discountValue > 0
      ? discountType === 'percentage'
        ? total - subtotal * (discountValue / 100)
        : total - discountValue
      : total;

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.categoryId === selectedCategory)
    : menuItems;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left panel - Menu */}
      <div className="flex-1 flex flex-col gap-4">
{/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </button>
        {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

{/* Order Type Buttons */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">Order Type:</span>
          <div className="flex gap-2">
            {[
              { type: 'dine-in', label: 'Dine In', icon: UtensilsCrossed },
              { type: 'takeaway', label: 'Takeaway', icon: ShoppingCart },
              { type: 'delivery', label: 'Delivery', icon: Truck },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setOrderType(type as any)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border-2
                  ${orderType === type
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-md'
                }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          
          {/* Visual Table Selection */}
          <div className="flex-1">
            <div className="glass p-3 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-black/70">Select Table</span>
                {currentTable && (
                  <button 
                    onClick={() => setCurrentTable(null)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-3">
                {tables.slice(0, 10).map((table: any) => {
                  const isSelected = currentTable === table.id;
                  const isOccupied = table.status === 'occupied';
                  
                  return (
                    <button
                      key={table.id}
                      onClick={() => !isOccupied && setCurrentTable(table.id)}
                      disabled={isOccupied}
                      className={`
                        relative p-3 text-center text-sm font-semibold rounded-xl border-2 transition-all
                        ${isSelected 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' 
                          : isOccupied 
                            ? 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed opacity-80'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="font-semibold">{table.number}</div>
                      <div className={`text-xs ${isSelected ? 'text-white/80' : isOccupied ? 'text-red-600' : 'text-slate-500'}`}>{table.capacity}p</div>
                      {isOccupied && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredItems
                .filter((item: MenuItem) => item.isAvailable)
                .map((item: MenuItem) => (
                  <motion.button
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() =>
                      addToCart({
                        menuItemId: item.id,
                        name: item.name,
                        price: item.price,
                      })
                    }
                    className="menu-item-card group"
                  >
                    <div className="text-center">
                      <p className="text-black font-medium text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-indigo-600 font-bold font-mono mt-2">
                        £{item.price}
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-black" />
                    </div>
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right panel - Cart */}
      <div className="w-96 flex flex-col">
        <div className="glass-card flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Current Order
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-400 text-sm hover:text-red-300"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-black/70">No items in order</p>
                <p className="text-black/60 text-sm">Add items from the menu</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.menuItemId}
                  layout
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-black font-medium text-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-black/60 text-sm font-mono">
                      £{item.price} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity - 1)
                      }
                      className="p-1 rounded-lg hover:bg-white/10"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-black font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity + 1)
                      }
                      className="p-1 rounded-lg hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-black font-mono font-medium">
                      £{(item.price * item.quantity).toFixed(0)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Order notes */}
          {cart.length > 0 && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Order notes (optional)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-black placeholder-slate-400"
              />
            </div>
          )}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="glass-card mt-4 space-y-3">
            <div className="flex justify-between text-black/70">
              <span>Subtotal</span>
              <span className="text-black font-mono"><Currency amount={subtotal} /></span>
            </div>
            <div className="flex justify-between text-black/70">
              <span>Tax (18%)</span>
              <span className="text-white font-mono"><Currency amount={tax} /></span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span className="font-mono">
                  -
                  {discountType === 'percentage'
                    ? `${discountValue}%`
                    : <Currency amount={discountValue} />}
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-3 flex justify-between">
              <span className="text-lg font-semibold text-black">Total</span>
              <span className="text-2xl font-bold text-indigo-600 font-mono">
                <Currency amount={finalTotal} />
              </span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setShowDiscount(true)}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Percent className="w-4 h-4" />
                Discount
              </button>
              <button
                onClick={() => setShowPayment(true)}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                Pay Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Discount Modal */}
      <AnimatePresence>
        {showDiscount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDiscount(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-black">Apply Discount</h3>
                <button
                  onClick={() => setShowDiscount(false)}
                  className="text-black/50 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      discountType === 'percentage'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-black'
                    }`}
                  >
                    Percentage
                  </button>
                  <button
                    onClick={() => setDiscountType('flat')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      discountType === 'flat'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-black'
                    }`}
                  >
                    Flat Amount
                  </button>
                </div>
                <div>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="input-field"
                    placeholder={discountType === 'percentage' ? '10' : '100'}
                  />
                </div>
                <button
                  onClick={() => setShowDiscount(false)}
                  className="btn-primary w-full"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card w-[480px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-black">Payment</h3>
                <button
                  onClick={() => setShowPayment(false)}
                  className="text-black/50 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-black/70 text-sm">Amount to Pay</p>
                <p className="text-4xl font-bold text-indigo-600 font-mono mt-2">
                  <Currency amount={finalTotal} />
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { mode: 'cash', icon: DollarSign, label: 'Cash' },
                  { mode: 'upi', icon: Smartphone, label: 'UPI' },
                  { mode: 'card', icon: CreditCard, label: 'Card' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode as any)}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      paymentMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-black hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cart.length === 0 ? 'Add items first' : `Pay £${finalTotal.toFixed(2)}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}