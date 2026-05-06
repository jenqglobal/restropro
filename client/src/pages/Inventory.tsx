import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Package, Plus, AlertTriangle, TrendingDown, TrendingUp, ShoppingCart, FileText } from 'lucide-react';

export default function Inventory() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddStock, setShowAddStock] = useState<string | null>(null);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return res.data;
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const res = await api.get('/inventory/alerts');
      return res.data;
    },
  });

  const addStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: any) =>
      api.post(`/inventory/${id}/stock`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowAddStock(null);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => api.post('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowAddModal(false);
    },
  });

  const lowStockItems = inventory.filter((item: any) => item.currentStock <= item.minStock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
            <p className="text-slate-500 text-sm">Manage raw materials and stock</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">
            {alerts.length} item(s) are running low on stock!
          </span>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-white">{inventory.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/20">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-white">{lowStockItems.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-white font-mono">
                £{inventory.reduce((sum: number, i: any) => sum + i.currentStock * i.costPerUnit, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-slate-400 font-medium">Item</th>
                <th className="text-left p-4 text-slate-400 font-medium">Unit</th>
                <th className="text-right p-4 text-slate-400 font-medium">Current Stock</th>
                <th className="text-right p-4 text-slate-400 font-medium">Min Stock</th>
                <th className="text-right p-4 text-slate-400 font-medium">Cost/Unit</th>
                <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item: any) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <span className="text-white font-medium">{item.name}</span>
                    {item.category && (
                      <span className="ml-2 text-slate-500 text-sm">({item.category})</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">{item.unit}</td>
                  <td className="p-4 text-right">
                    <span
                      className={`font-mono font-medium ${
                        item.currentStock <= item.minStock ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-400 font-mono">{item.minStock}</td>
                  <td className="p-4 text-right text-slate-400 font-mono">£{item.costPerUnit}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setShowAddStock(item.id)}
                      className="text-primary-400 hover:text-primary-300 text-sm"
                    >
                      + Add Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddStock(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add Stock</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addStockMutation.mutate({
                  id: showAddStock,
                  quantity: Number(formData.get('quantity')),
                });
              }}
              className="space-y-4"
            >
              <input
                name="quantity"
                type="number"
                className="input-field"
                placeholder="Quantity to add"
                min={1}
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddStock(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add Stock
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add Inventory Item</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addItemMutation.mutate({
                  name: formData.get('name'),
                  unit: formData.get('unit'),
                  currentStock: Number(formData.get('currentStock')) || 0,
                  minStock: Number(formData.get('minStock')) || 10,
                  costPerUnit: Number(formData.get('costPerUnit')) || 0,
                  category: formData.get('category'),
                });
              }}
              className="space-y-4"
            >
              <input name="name" type="text" className="input-field" placeholder="Item Name" required />
              <input name="unit" type="text" className="input-field" placeholder="Unit (kg, L, pcs)" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="currentStock" type="number" className="input-field" placeholder="Current Stock" defaultValue={0} />
                <input name="minStock" type="number" className="input-field" placeholder="Min Stock" defaultValue={10} />
              </div>
              <input name="costPerUnit" type="number" className="input-field" placeholder="Cost per Unit (£)" defaultValue={0} />
              <input name="category" type="text" className="input-field" placeholder="Category (optional)" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add Item
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}