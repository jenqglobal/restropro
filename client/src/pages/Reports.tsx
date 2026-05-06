import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Utensils, Download, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [period, setPeriod] = useState('week');

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', period],
    queryFn: async () => {
      const res = await api.get(`/reports/sales?period=${period}`);
      return res.data;
    },
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', period],
    queryFn: async () => {
      const res = await api.get(`/reports/items?period=${period}`);
      return res.data;
    },
  });

  const { data: categoryData, isLoading: catLoading } = useQuery({
    queryKey: ['categories', period],
    queryFn: async () => {
      const res = await api.get(`/reports/categories?period=${period}`);
      return res.data;
    },
  });

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const generatePDF = () => {
    const content = `
      RESTROPRO - SALES REPORT
      Period: ${period}
      Generated: ${new Date().toLocaleDateString()}
      
      SUMMARY
      -------
      Total Sales: £${(salesData?.totalSales || 0).toLocaleString()}
      Total Orders: ${salesData?.totalOrders || 0}
      Avg Order Value: £${(salesData?.avgOrderValue || 0).toFixed(2)}
      
      TOP SELLING ITEMS
      -----------------
      ${itemsData?.slice(0, 10).map((item: any, i: number) => `${i+1}. ${item.name} - £${item.revenue.toLocaleString()} (${item.quantity} sold)`).join('\n') || 'No data'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const dailyData = salesData?.dailySales
    ? Object.entries(salesData.dailySales).map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        sales: value,
      }))
    : [];

  const categoryChartData = categoryData?.map((cat: any, index: number) => ({
    name: cat.name,
    value: cat.revenue,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-500 text-sm">Detailed insights and statistics</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => itemsData && downloadCSV(itemsData, 'top_items')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={generatePDF}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          {['today', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                period === p
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-white font-mono">
                £{(salesData?.totalSales || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{salesData?.totalOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg Order Value</p>
              <p className="text-2xl font-bold text-white font-mono">
                £{(salesData?.avgOrderValue || 0).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Utensils className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Items Sold</p>
              <p className="text-2xl font-bold text-white">
                {itemsData?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-6">Sales Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `£${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                formatter={(value: number) => [`£${value.toLocaleString()}`, 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Items & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-6">Top Selling Items</h3>
          <div className="space-y-4">
            {itemsData?.slice(0, 8).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-slate-400 text-sm">{item.quantity} sold</p>
                </div>
                <span className="text-primary-400 font-mono font-bold">£{item.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-6">Category Sales</h3>
          <div className="flex items-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {categoryChartData.map((cat: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 flex-1">{cat.name}</span>
                  <span className="text-slate-400 font-mono">£{cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}