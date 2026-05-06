import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Utensils, Plus, Search, X, Package } from 'lucide-react';

interface RecipeItem {
  id?: string;
  inventoryItemId: string;
  inventoryItem?: { name: string; unit: string };
  quantity: number;
}

export default function RecipeManagement() {
  const queryClient = useQueryClient();
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  // Get all menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await api.get('/menu/items');
      return res.data;
    },
  });

  // Get inventory items
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return res.data;
    },
  });

  // Get recipes for selected menu item
  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes', selectedMenuItem?.id],
    queryFn: async () => {
      if (!selectedMenuItem?.id) return [];
      const res = await api.get(`/inventory/recipes/${selectedMenuItem.id}`);
      return res.data;
    },
    enabled: !!selectedMenuItem?.id,
  });

  // Save recipe mutation
  const saveRecipeMutation = useMutation({
    mutationFn: async (data: any) => api.post('/inventory/recipes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setShowRecipeModal(false);
    },
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/inventory/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const openRecipeModal = (item: any) => {
    setSelectedMenuItem(item);
    setRecipeItems(recipes.map((r: any) => ({
      id: r.id,
      inventoryItemId: r.inventoryItemId,
      inventoryItem: r.inventoryItem,
      quantity: r.quantity,
    })));
    setShowRecipeModal(true);
  };

  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { inventoryItemId: '', quantity: 0 }]);
  };

  const updateRecipeItem = (index: number, field: string, value: any) => {
    const newItems = [...recipeItems];
    (newItems[index] as any)[field] = value;
    setRecipeItems(newItems);
  };

  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const saveRecipe = () => {
    const validItems = recipeItems.filter(item => item.inventoryItemId && item.quantity > 0);
    if (!selectedMenuItem?.id || validItems.length === 0) return;
    
    // Delete existing recipes first
    recipes.forEach((r: any) => deleteRecipeMutation.mutate(r.id));
    
    // Create new recipes
    validItems.forEach(item => {
      saveRecipeMutation.mutate({
        menuItemId: selectedMenuItem.id,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Recipe Management</h1>
            <p className="text-slate-500 text-sm">Map ingredients to menu items</p>
          </div>
        </div>
      </div>

      {/* Menu Items with Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item: any) => {
          const hasRecipe = recipes.some((r: any) => r.inventoryItemId);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{item.name}</h3>
                  <p className="text-slate-400 text-sm">{item.category?.name}</p>
                  <p className="text-primary-400 font-mono mt-2">£{item.price}</p>
                </div>
                <div className={`p-2 rounded-lg ${hasRecipe ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                  {hasRecipe ? (
                    <Package className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Utensils className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              </div>
              
              {hasRecipe && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-400 mb-2">Ingredients:</p>
                  <div className="flex flex-wrap gap-1">
                    {recipes.map((r: any) => (
                      <span key={r.id} className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300">
                        {r.inventoryItem?.name}: {r.quantity} {r.inventoryItem?.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
<button
                onClick={() => openRecipeModal(item)}
                className="mt-4 w-full py-2 rounded-lg bg-slate-800 text-sm text-white hover:bg-slate-700 transition-colors font-medium border border-slate-600"
              >
                {hasRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Recipe Modal */}
      {showRecipeModal && selectedMenuItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowRecipeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card w-[500px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Recipe: {selectedMenuItem.name}</h3>
                <p className="text-slate-400 text-sm">Set ingredients and quantities</p>
              </div>
              <button onClick={() => setShowRecipeModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              {recipeItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <select
                    value={item.inventoryItemId}
                    onChange={(e) => updateRecipeItem(index, 'inventoryItemId', e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Select Ingredient</option>
                    {inventory.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateRecipeItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => removeRecipeItem(index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRecipeItem}
              className="mt-4 w-full py-2 rounded-lg border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40"
            >
              + Add Ingredient
            </button>

            <button
              onClick={saveRecipe}
              className="btn-primary w-full mt-6"
            >
              Save Recipe
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}