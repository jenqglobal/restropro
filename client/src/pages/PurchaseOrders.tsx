import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { ShoppingCart, Plus, CheckCircle, Clock, X, AlertTriangle } from 'lucide-react';

export default function PurchaseOrders() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return res.data;
    },
  });

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/inventory/purchase-orders');
      return res.data;
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: any) => api.post('/inventory/purchase-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowCreateModal(false);
      setSelectedItems({});
    },
  });

  const updatePOStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => 
      api.patch(`/inventory/purchase-orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const handleItemToggle = (itemId: string, qty: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: qty
    }));
  };

  const createPurchaseOrder = () => {
    const items = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ inventoryItemId: itemId, quantity }));
    
    if (items.length === 0) return;
    
    createPOMutation.mutate({ items });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
            <p className="text-slate-500 text-sm">Manage inventory purchases</p>
          </div>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      {/* Low Stock Alert */}
      <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <span className="text-amber-400 font-medium">
          {inventory.filter((i: any) => i.currentStock <= i.minStock).length} items are low on stock!
        </span>
      </div>

      {/* Purchase Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : purchaseOrders.length === 0 ? (
        <div className="glass-card text-center py-12">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No purchase orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchaseOrders.map((po: any) => (
            <motion.div
              key={po.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">PO-{po.orderNumber}</h3>
                  <p className="text-slate-400 text-sm">
                    {po.items?.length || 0} items • {new Date(po.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    po.status === 'completed' ? 'badge-success' :
                    po.status === 'ordered' ? 'badge-info' : 'badge-warning'
                  }`}>
                    {po.status}
                  </span>
                  {po.status === 'pending' && (
                    <button
                      onClick={() => updatePOStatusMutation.mutate({ id: po.id, status: 'ordered' })}
                      className="btn-secondary text-sm py-1"
                    >
                      Mark Ordered
                    </button>
                  )}
                  {po.status === 'ordered' && (
                    <button
                      onClick={() => updatePOStatusMutation.mutate({ id: po.id, status: 'completed' })}
                      className="btn-primary text-sm py-1"
                    >
                      Receive
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card w-[600px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create Purchase Order</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-400 text-sm mb-4">Select items to order:</p>
              {inventory.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-slate-400 text-sm">
                      Current: {item.currentStock} {item.unit} • Min: {item.minStock}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={selectedItems[item.id] || ''}
                      onChange={(e) => handleItemToggle(item.id, parseInt(e.target.value) || 0)}
                      className="w-20 bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-white"
                      placeholder="Qty"
                    />
                    <span className="text-slate-400 text-sm">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={createPurchaseOrder}
              disabled={Object.values(selectedItems).every(q => q === 0)}
              className="btn-primary w-full mt-6"
            >
              Create Purchase Order
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}