import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Utensils, Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { Currency } from '../lib/Currency';

export default function Menu() {
  const queryClient = useQueryClient();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState('');

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
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await api.get('/menu/items');
      return res.data;
    },
  });

  // Create category
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => api.post('/menu/categories', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  // Update category
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: any) => api.put(`/menu/categories/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  // Toggle availability
const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const res = await api.patch(`/menu/items/${id}/availability`, { isAvailable });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/menu/items/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const filteredItems = search
    ? menuItems.filter((item: any) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : menuItems;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-400 to-orange-500">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Menu Management</h1>
            <p className="text-slate-500 text-sm">Manage categories and items</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryModal(true)} className="btn-secondary">
            Add Category
          </button>
          <button onClick={() => setShowItemModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
          >
            {cat.name}
            <span className="ml-2 text-slate-400">({cat._count?.menuItems || 0})</span>
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item: any) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card ${!item.isAvailable ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-slate-900 font-semibold">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.category?.name}</p>
              </div>
              <button
                onClick={() =>
                  toggleAvailabilityMutation.mutate({
                    id: item.id,
                    isAvailable: !item.isAvailable,
                  })
                }
                className={`px-2 py-1 rounded text-xs font-medium ${
                  item.isAvailable
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">
              {item.description || 'No description'}
            </p>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <span className="text-xl font-bold text-indigo-600 font-mono">
                <Currency amount={item.price} />
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setShowItemModal(true);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${item.name}"?`)) {
                      deleteItemMutation.mutate(item.id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSubmit={(data) => {
            if (editingCategory) {
              updateCategoryMutation.mutate({ id: editingCategory.id, data });
            } else {
              createCategoryMutation.mutate(data);
            }
          }}
          editing={editingCategory}
          isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        />
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSubmit={async (data: any) => {
            if (editingItem) {
              await api.put(`/menu/items/${editingItem.id}`, data);
            } else {
              await api.post('/menu/items', data);
            }
            queryClient.invalidateQueries({ queryKey: ['menu-items'] });
          }}
          editing={editingItem}
          categories={categories}
          isLoading={false}
        />
      )}
    </div>
  );
}

function CategoryModal({ onClose, onSubmit, editing, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: editing?.name || '',
    description: editing?.description || '',
    sortOrder: editing?.sortOrder || 0,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass-card w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          {editing ? 'Edit Category' : 'Add Category'}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
            onClose();
          }}
          className="space-y-4"
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="Category name"
            required
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            placeholder="Description"
            rows={2}
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ItemModal({ onClose, onSubmit, editing, categories, isLoading }: any) {
  const [formData, setFormData] = useState({
    categoryId: editing?.categoryId || categories[0]?.id || '',
    name: editing?.name || '',
    description: editing?.description || '',
    price: editing?.price || 0,
    isAvailable: editing?.isAvailable ?? true,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass-card w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          {editing ? 'Edit Item' : 'Add Menu Item'}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
            onClose();
          }}
          className="space-y-4"
        >
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="input-field"
            required
          >
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="Item name"
            required
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            placeholder="Description"
            rows={2}
          />
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="input-field"
            placeholder="Price"
            min={0}
            required
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}