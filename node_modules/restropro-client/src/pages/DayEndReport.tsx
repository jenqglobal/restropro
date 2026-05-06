import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { FileText, Download, Calendar, DollarSign, Receipt, Users, ShoppingCart } from 'lucide-react';

export default function DayEndReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get sales data
  const { data: salesData } = useQuery({
    queryKey: ['sales', 'today'],
    queryFn: async () => {
      const res = await api.get(`/reports/sales?period=custom&startDate=${selectedDate}&endDate=${selectedDate}`);
      return res.data;
    },
  });

  // Get orders for the day
  const { data: ordersData } = useQuery({
    queryKey: ['orders', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/orders?date=${selectedDate}&limit=1000`);
      return res.data;
    },
  });

  // Get hourly data
  const { data: hourlyData } = useQuery({
    queryKey: ['hourly-sales', selectedDate],
    queryFn: async () => {
      const res = await api.get('/reports/hours');
      return res.data;
    },
  });

  const orders = ordersData?.orders || [];
  const completedOrders = orders.filter((o: any) => o.status === 'completed');
  
  // Calculate totals
  const totalSales = completedOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  const totalTax = completedOrders.reduce((sum: number, o: any) => sum + o.tax, 0);
  const totalDiscount = completedOrders.reduce((sum: number, o: any) => sum + (o.discount || 0), 0);
  const totalItems = completedOrders.reduce((sum: number, o: any) => 
    sum + o.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0, 0);

  // Payment mode breakdown
  const paymentBreakdown = completedOrders.reduce((acc: any, o: any) => {
    const mode = o.paymentMode || 'cash';
    acc[mode] = (acc[mode] || 0) + o.total;
    return acc;
  }, {});

  // Hourly breakdown
  const peakHour = hourlyData?.reduce((max: number, val: number, idx: number) => 
    val > hourlyData[max] ? idx : max, 0) || 0;

  const formatCurrency = (amount: number) => `£${amount.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Day End Report (Z-Report)</h1>
            <p className="text-slate-500 text-sm">Daily settlement and summary</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white border-none outline-none"
            />
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
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
              <p className="text-2xl font-bold text-white font-mono">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{completedOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Items Sold</p>
              <p className="text-2xl font-bold text-white">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg. Order Value</p>
              <p className="text-2xl font-bold text-white font-mono">
                {completedOrders.length > 0 ? formatCurrency(totalSales / completedOrders.length) : '£0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Breakdown */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Sales Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Gross Sales</span>
              <span className="text-white font-mono">{formatCurrency(totalSales + totalDiscount)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Discount Given</span>
              <span className="text-red-400 font-mono">-{formatCurrency(totalDiscount)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">GST/Tax Collected</span>
              <span className="text-white font-mono">{formatCurrency(totalTax)}</span>
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
              <span className="text-white font-semibold">Net Sales</span>
              <span className="text-primary-400 text-xl font-bold font-mono">{formatCurrency(totalSales)}</span>
            </div>
          </div>
        </div>

        {/* Payment Mode Breakdown */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Mode</h3>
          <div className="space-y-3">
            {Object.entries(paymentBreakdown).map(([mode, amount]) => (
              <div key={mode} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-slate-400 capitalize">{mode}</span>
                <span className="text-white font-mono">{formatCurrency(amount as number)}</span>
              </div>
            ))}
            {Object.keys(paymentBreakdown).length === 0 && (
              <p className="text-slate-400 text-center py-4">No payments recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Order Status Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          {['completed', 'ready', 'preparing', 'pending', 'cancelled'].map((status) => {
            const count = orders.filter((o: any) => o.status === status).length;
            const statusColors: Record<string, string> = {
              completed: 'bg-emerald-500/20 text-emerald-400',
              ready: 'bg-blue-500/20 text-blue-400',
              preparing: 'bg-amber-500/20 text-amber-400',
              pending: 'bg-red-500/20 text-red-400',
              cancelled: 'bg-slate-500/20 text-slate-400',
            };
            return (
              <div key={status} className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className={`text-sm capitalize ${statusColors[status]}`}>{status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Peak Hour */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Peak Hour Analysis</h3>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary-500/20 rounded-xl">
            <Clock className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Busiest Hour</p>
            <p className="text-white text-xl font-semibold">{peakHour}:00 - {peakHour + 1}:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Clock(props: any) {
  return <FileText {...props} />;
}