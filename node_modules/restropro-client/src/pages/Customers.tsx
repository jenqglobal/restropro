import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Users, Plus, Search, Star, Phone, Mail } from 'lucide-react';

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get(`/customers?search=${search}`);
      return res.data;
    },
  });

  const { data: customerDetails } = useQuery({
    queryKey: ['customer', selectedCustomer?.id],
    queryFn: async () => {
      const res = await api.get(`/customers/${selectedCustomer.id}`);
      return res.data;
    },
    enabled: !!selectedCustomer,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowAddModal(false);
    },
  });

  const addPointsMutation = useMutation({
    mutationFn: async ({ id, points }: any) =>
      api.post(`/customers/${id}/points`, { points }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (selectedCustomer) {
        queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomer.id] });
      }
    },
  });

  const customers = customersData?.customers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-500 text-sm">CRM & Loyalty Management</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card">
          <p className="text-slate-400 text-sm">Total Customers</p>
          <p className="text-2xl font-bold text-white">{customersData?.total || 0}</p>
        </div>
        <div className="glass-card">
          <p className="text-slate-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-white font-mono">
            £{customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0).toLocaleString()}
          </p>
        </div>
        <div className="glass-card">
          <p className="text-slate-400 text-sm">Avg. Order Value</p>
          <p className="text-2xl font-bold text-white font-mono">
            £{customers.length > 0
              ? Math.round(customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / customers.length)
              : 0}
          </p>
        </div>
      </div>

      {/* Customers List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer: any) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedCustomer(customer)}
              className="glass-card cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{customer.name}</h3>
                  <p className="text-sm text-slate-400">{customer.phone}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                <div>
                  <p className="text-xs text-slate-400">Loyalty Points</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-bold font-mono">{customer.loyaltyPoints}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total Spent</p>
                  <p className="text-primary-400 font-bold font-mono">£{customer.totalSpent}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && customerDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedCustomer(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card w-[600px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                  {customerDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{customerDetails.name}</h3>
                  <div className="flex items-center gap-3 text-slate-400 text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {customerDetails.phone}
                    </span>
                    {customerDetails.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {customerDetails.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-slate-400 text-sm">Loyalty Points</p>
                <p className="text-2xl font-bold text-amber-400">{customerDetails.loyaltyPoints}</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-slate-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-primary-400">£{customerDetails.totalSpent}</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-slate-400 text-sm">Visits</p>
                <p className="text-2xl font-bold text-white">{customerDetails.visitCount}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Recent Orders</h4>
                <button
                  onClick={() => {
                    const points = prompt('Enter points to add:');
                    if (points) {
                      addPointsMutation.mutate({ id: selectedCustomer.id, points: Number(points) });
                    }
                  }}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  + Add Points
                </button>
              </div>
              {customerDetails.orders?.length > 0 ? (
                <div className="space-y-2">
                  {customerDetails.orders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-white font-mono text-sm">{order.orderNumber}</span>
                        <span className="text-slate-400 text-xs ml-2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-primary-400 font-mono">£{order.total}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No orders yet</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add Customer Modal */}
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
            <h3 className="text-lg font-semibold text-white mb-4">Add Customer</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createCustomerMutation.mutate({
                  name: formData.get('name'),
                  phone: formData.get('phone'),
                  email: formData.get('email'),
                });
              }}
              className="space-y-4"
            >
              <input name="name" type="text" className="input-field" placeholder="Name" required />
              <input name="phone" type="tel" className="input-field" placeholder="Phone" required />
              <input name="email" type="email" className="input-field" placeholder="Email (optional)" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}