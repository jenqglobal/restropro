import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { subscribeToEvent } from '../lib/socket';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  Coffee,
  AlertCircle,
  Printer,
} from 'lucide-react';
import PrintModal from '../components/PrintModal';

interface OrderItem {
  id: string;
  quantity: number;
  notes?: string;
  status: string;
  menuItem: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  notes?: string;
  createdAt: string;
  table?: { number: string };
  user: { name: string };
  items: OrderItem[];
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);

  if (diffMins === 0) {
    return `${diffSecs}s ago`;
  }
  return `${diffMins}m ago`;
}

export default function Kitchen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing'>('all');
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [printType, setPrintType] = useState<'kot' | 'bill'>('kot');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch active orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: async () => {
      const res = await api.get('/orders/active');
      return res.data as Order[];
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return api.patch(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubNewOrder = subscribeToEvent('new-order', () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    });

    const unsubOrderUpdated = subscribeToEvent('order-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
    });

    const unsubOrderStatusChanged = subscribeToEvent('order-status-changed', () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
    });

    const unsubOrderCompleted = subscribeToEvent('order-completed', () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
    });

    return () => {
      unsubNewOrder();
      unsubOrderUpdated();
      unsubOrderStatusChanged();
      unsubOrderCompleted();
    };
  }, [queryClient]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'preparing') return order.status === 'preparing';
    return true;
  });

  // Group orders by time
  const urgentOrders = filteredOrders.filter((o) => {
    const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
    return mins > 10;
  });

  const normalOrders = filteredOrders.filter((o) => {
    const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
    return mins <= 10;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500';
      case 'preparing':
        return 'bg-blue-500';
      case 'ready':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Hidden audio for notifications */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRcAhs3dvmwhBx2Wy+XKch0AH6ni5b12HQAfqeXmvXwgACGl5eW3fSEAIqbl5b99IgAjo+Xlvn4iACSk5eW+fSMAJKPl5b59IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW=fSMAI6Ll5b5+IgAjo+Xlvn4iACOi5eW+fSMAI6Ll5b5+IgAjo=" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kitchen Display</h1>
            <p className="text-slate-500 text-sm">Real-time order feed</p>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'pending', label: 'Pending', count: orders.filter((o) => o.status === 'pending').length },
            { key: 'preparing', label: 'Preparing', count: orders.filter((o) => o.status === 'preparing').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Urgent orders warning */}
      {urgentOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">
            {urgentOrders.length} order(s) waiting more than 10 minutes!
          </span>
        </motion.div>
      )}

      {/* Orders grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Coffee className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-500 text-lg">No orders in queue</p>
          <p className="text-slate-500 text-sm">New orders will appear here automatically</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => {
                const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                const isUrgent = mins > 10;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`bg-white rounded-xl border-2 shadow-lg p-5 ${
                      isUrgent
                        ? 'border-red-400'
                        : order.status === 'pending'
                        ? 'border-amber-300'
                        : 'border-blue-300'
                    }`}
                  >
                    {/* Order header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 font-mono">
                          {order.orderNumber}
                        </h3>
                        <p className="text-slate-500 text-sm">
                          {order.table ? `Table ${order.table.number}` : order.orderType}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-slate-500 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className={`font-bold text-sm ${isUrgent ? 'text-red-600' : 'text-slate-600'}`}>
                            {mins} min
                          </span>
                        </div>
                        <span className={`badge ${order.status === 'pending' ? 'badge-warning' : order.status === 'preparing' ? 'badge-info' : 'badge-success'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <span className="text-slate-800 font-medium">{item.menuItem.name}</span>
                          </div>
                          {item.notes && (
                            <span className="text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded">Note</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Order notes */}
                    {order.notes && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                        <strong>Note:</strong> {order.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setPrintType('kot');
                          setPrintOrder(order);
                        }}
                        className="py-2 px-3 rounded-lg bg-amber-500 text-white text-sm font-medium flex items-center gap-1 hover:bg-amber-600 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        KOT
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: 'preparing',
                            })
                          }
                          className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Start
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: 'ready',
                            })
                          }
                          className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Ready
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
      <PrintModal
        isOpen={!!printOrder}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
        type={printType}
      />
    </div>
  );
}