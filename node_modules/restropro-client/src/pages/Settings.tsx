import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import { useUIStore } from '../lib/stores/posStore';
import { Settings as SettingsIcon, Building, Users, Bell, Palette, Save, Moon, Sun, Zap, CreditCard } from 'lucide-react';
import PaymentSettingsContent from './PaymentSettingsContent';

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [activeTab, setActiveTab] = useState('general');
  const [darkMode, setDarkMode] = useState(theme === 'dark');
  const [animations, setAnimations] = useState(true);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const { data: tenantData } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get('/tenants/me');
      return res.data;
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (data: any) => api.put('/tenants/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Manage your restaurant configuration</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Restaurant Details</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    updateTenantMutation.mutate({
                      name: formData.get('name'),
                      phone: formData.get('phone'),
                      address: formData.get('address'),
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Restaurant Name</label>
                      <input
                        name="name"
                        type="text"
                        defaultValue={tenantData?.name}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">Phone</label>
                      <input
                        name="phone"
                        type="tel"
                        defaultValue={tenantData?.phone}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Address</label>
                    <textarea
                      name="address"
                      defaultValue={tenantData?.address}
                      className="input-field"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="input-label">Market / Region</label>
                      <select
                        name="market"
                        defaultValue={tenantData?.settings?.market || 'india'}
                        className="input-field cursor-pointer"
                        onChange={(e) => {
                          const market = e.target.value;
                          const currencyMap: Record<string, string> = {
                            india: '£',
                            us: '$',
                            uk: '£',
                            uae: 'د.إ',
                            europe: '€'
                          };
                          const currencyInput = document.querySelector('input[name="currency"]') as HTMLInputElement;
                          if (currencyInput) {
                            currencyInput.value = currencyMap[market] || '£';
                          }
                        }}
                      >
                        <option value="india">🇮🇳 India (£)</option>
                        <option value="us">🇺🇸 United States ($)</option>
                        <option value="uk">🇬🇧 United Kingdom (£)</option>
                        <option value="uae">🇦🇪 UAE (د.إ)</option>
                        <option value="europe">🇪🇺 Europe (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Currency Symbol</label>
                      <input
                        type="text"
                        name="currency"
                        defaultValue={tenantData?.settings?.currency || '£'}
                        className="input-field"
                        placeholder="£"
                      />
                    </div>
                    <div>
                      <label className="input-label">Tax Rate (%)</label>
                      <input
                        type="number"
                        name="taxRate"
                        defaultValue={tenantData?.settings?.taxRate || 18}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </form>
              </div>

              <div className="glass-card">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Subscription</h3>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-slate-900 font-medium capitalize">{tenantData?.subscription} Plan</p>
                    <p className="text-slate-400 text-sm">
                      {tenantData?.subscription === 'trial'
                        ? `Trial ends: ${new Date(tenantData?.trialEnds).toLocaleDateString()}`
                        : 'Active subscription'}
                    </p>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Staff Members</h3>
                  <button className="btn-primary text-sm">Add User</button>
                </div>
                <div className="space-y-3">
                  {users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-medium">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-slate-900 font-medium">{u.name}</p>
                          <p className="text-slate-400 text-sm">{u.email}</p>
                        </div>
                      </div>
                      <span className={`badge ${
                        u.role === 'owner' ? 'bg-purple-500/20 text-purple-400' :
                        u.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                        u.role === 'kitchen' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card">
<h3 className="text-lg font-semibold text-slate-900 mb-4">Role Permissions</h3>
              <div className="space-y-4">
                {['owner', 'manager', 'cashier', 'kitchen'].map((role) => (
                  <div key={role} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-slate-900 font-medium mb-3 capitalize">{role}</h4>
                      <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Full Access
                        </li>
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'New order notifications', desc: 'Get notified when a new order is placed' },
                  { label: 'Low stock alerts', desc: 'Alert when inventory items are low' },
                  { label: 'Daily summary', desc: 'Receive daily sales summary via email' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-slate-900 font-medium">{item.label}</p>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-primary-500 relative">
                      <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Theme Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                    <div>
                      <p className="text-slate-900 font-medium">Dark Mode</p>
                      <p className="text-slate-400 text-sm">Use dark theme for the interface</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setDarkMode(!darkMode);
                      setTheme(darkMode ? 'light' : 'dark');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-slate-600'}`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${animations ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-slate-900 font-medium">Animations</p>
                      <p className="text-slate-400 text-sm">Enable smooth animations and transitions</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAnimations(!animations)}
                    className={`w-12 h-6 rounded-full transition-colors ${animations ? 'bg-primary-500' : 'bg-slate-600'}`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${animations ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payment' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PaymentSettingsContent />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}