import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../lib/stores/authStore';
import { useUIStore } from '../lib/stores/posStore';
import { useSocketNotifs, NotifBell } from '../lib/notifications';
import { CurrencySwitcher } from '../lib/CurrencySwitcher';
import { connectSocket, disconnectSocket } from '../lib/socket';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Grid3X3,
  Receipt,
  Utensils,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  FileText,
  DollarSign,
  Scroll,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pos', icon: ShoppingCart, label: 'POS' },
  { path: '/kitchen', icon: ChefHat, label: 'Kitchen' },
  { path: '/tables', icon: Grid3X3, label: 'Tables' },
  { path: '/orders', icon: Receipt, label: 'Orders' },
  { path: '/menu', icon: Utensils, label: 'Menu' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/purchase-orders', icon: ShoppingBag, label: 'Purchase Orders' },
  { path: '/recipes', icon: Scroll, label: 'Recipes' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/expenses', icon: DollarSign, label: 'Expenses' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/day-end', icon: FileText, label: 'Day End' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, tenant, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  
  // Initialize notification listener
  useSocketNotifs();

  useEffect(() => {
    document.body.classList.remove('dark');
  }, []);

  useEffect(() => {
    if (tenant?.id) {
      const token = localStorage.getItem('restropro-auth');
      if (token) {
        const parsed = JSON.parse(token);
        connectSocket(parsed.state?.accessToken, tenant.id);
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [tenant?.id]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 260 : 80,
          }}
          className="glass-sidebar"
        >
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-slate-800">RestroPro</h1>
                    <p className="text-xs text-slate-400">{tenant?.name}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''} ${sidebarOpen ? '' : 'justify-center px-0'}`
                }
              >
                <item.icon size={20} />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-slate-100">
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} p-2 rounded-xl hover:bg-slate-50`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-medium shadow-sm">
                {user?.name?.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main content */}
      <div
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 260 : 80 }}
      >
        {/* Top bar */}
        <header className="glass-topbar">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-3">
              <NotifBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}