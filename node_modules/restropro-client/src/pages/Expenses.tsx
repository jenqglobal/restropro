import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { DollarSign, Plus, TrendingUp, TrendingDown, X } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function Expenses() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('today');

  // Get expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', filter],
    queryFn: async () => {
      const res = await api.get('/expenses');
      return res.data;
    },
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => api.post('/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowAddModal(false);
    },
  });

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

  const expenseByCategory = expenses.reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const categories = ['Ingredients', 'Supplies', 'Rent', 'Utilities', 'Salary', 'Marketing', 'Maintenance', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-400 to-pink-500">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
            <p className="text-slate-500 text-sm">Track daily expenses</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/20">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-white font-mono">£{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-white">{expenses.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg. Expense</p>
              <p className="text-2xl font-bold text-white font-mono">
                £{expenses.length > 0 ? Math.round(totalExpenses / expenses.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">By Category</h3>
          <div className="space-y-3">
            {Object.entries(expenseByCategory).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-slate-300">{cat}</span>
                <span className="text-white font-mono">£{(amount as number).toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(expenseByCategory).length === 0 && (
              <p className="text-slate-400 text-center py-4">No expenses recorded</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Expenses</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {expenses.map((expense: any) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{expense.category}</p>
                  <p className="text-slate-400 text-sm">{expense.description || 'No description'}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-mono">£{expense.amount.toLocaleString()}</p>
                  <p className="text-slate-500 text-xs">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Add Expense</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createExpenseMutation.mutate({
                category: formData.get('category'),
                amount: parseFloat(formData.get('amount') as string),
                description: formData.get('description'),
                date: new Date().toISOString(),
              });
            }} className="space-y-4">
              <div>
                <label className="input-label">Category</label>
                <select name="category" className="input-field" required>
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Amount (£)</label>
                <input name="amount" type="number" step="0.01" className="input-field" required />
              </div>
              <div>
                <label className="input-label">Description</label>
                <input name="description" type="text" className="input-field" placeholder="Optional" />
              </div>
              <button type="submit" className="btn-primary w-full">
                Add Expense
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}