import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ChefHat,
  Table,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data;
    },
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', 'week'],
    queryFn: async () => {
      const res = await api.get('/reports/sales?period=week');
      return res.data;
    },
  });

  const { data: topItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['top-items', 'week'],
    queryFn: async () => {
      const res = await api.get('/reports/items?period=week');
      return res.data;
    },
  });

  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ['hourly-sales'],
    queryFn: async () => {
      const res = await api.get('/reports/hours');
      return res.data;
    },
  });

  const chartData = salesData?.dailySales
    ? Object.entries(salesData.dailySales).map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        sales: value,
      }))
    : [];

  const hourlyChartData = hourlyData
    ? hourlyData.map((value: number, hour: number) => ({
        hour: `${hour}:00`,
        sales: value,
      }))
    : [];

  const pieData = topItems?.slice(0, 5).map((item: any, index: number) => ({
    name: item.name,
    value: item.revenue,
    color: COLORS[index % COLORS.length],
  }));

  const stats = [
    {
      label: "Today's Revenue",
      value: dashboardData?.todayRevenue || 0,
      icon: DollarSign,
      change: 12.5,
      color: 'from-emerald-400 to-cyan-500',
    },
    {
      label: 'Active Orders',
      value: dashboardData?.activeOrders || 0,
      icon: ShoppingCart,
      change: -5.2,
      color: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Completed Today',
      value: dashboardData?.completedOrders || 0,
      icon: ChefHat,
      change: 8.7,
      color: 'from-blue-400 to-indigo-500',
    },
    {
      label: 'Low Stock Items',
      value: dashboardData?.lowStock || 0,
      icon: Package,
      change: -15.3,
      color: 'from-red-400 to-pink-500',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome section */}
      <motion.div variants={itemVariants} className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 mt-1">
              Here's what's happening with your restaurant today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm">Today's Date</p>
            <p className="text-slate-900 font-semibold">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="glass-card group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-2 font-mono">
{stat.label === "Today's Revenue" 
                      ? `£${stat.value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
                      : stat.value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {stat.change >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {Math.abs(stat.change)}%
              </span>
              <span className="text-slate-500 text-sm">vs last week</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Sales Overview</h3>
            <select className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `£${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [
                    `£${value.toLocaleString('en-IN')}`,
                    'Sales',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top items pie chart */}
        <motion.div variants={itemVariants} className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-6">Top Selling Items</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [
                    `£${value.toLocaleString('en-IN')}`,
                    'Revenue',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {pieData?.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-400 font-mono">
                  £{(item.value / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Hourly sales */}
      <motion.div variants={itemVariants} className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-6">Hourly Sales Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(value) => `£${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [`£${value}`, 'Sales']}
              />
              <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}