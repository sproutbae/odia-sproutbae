// src/pages/DashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api, { formatINR, formatDate } from '../utils/api';
import {
  TrendingUp, Users, Package, AlertTriangle,
  ArrowUpRight, Clock, CheckCircle, FileText
} from 'lucide-react';

const statusBadge = (status) => {
  const map = {
    PAID: 'badge-paid', PENDING: 'badge-pending', OVERDUE: 'badge-overdue',
    DRAFT: 'badge-draft', PARTIAL: 'badge-partial', CANCELLED: 'badge-cancelled',
    SENT: 'badge-pending',
  };
  return <span className={map[status] || 'badge-draft'}>{status}</span>;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-white rounded-xl3 animate-pulse border border-warm-200" />
      ))}
    </div>
  );

  const stats = [
    {
      label: 'This Month Revenue',
      value: formatINR(data?.revenue?.thisMonth),
      sub: `↑ vs ₹${Math.round((data?.revenue?.lastMonth || 0) / 1000)}K last month`,
      icon: TrendingUp, iconBg: 'bg-brand-50', iconColor: 'text-brand-600',
    },
    {
      label: 'Total Receivables',
      value: formatINR(data?.receivables),
      sub: `${data?.overdueCount || 0} overdue invoices`,
      icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
    },
    {
      label: 'Active Customers',
      value: data?.customers || 0,
      sub: 'Total parties',
      icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
    },
    {
      label: 'Low Stock Items',
      value: data?.lowStockCount || 0,
      sub: `of ${data?.products || 0} total products`,
      icon: Package, iconBg: 'bg-red-50', iconColor: 'text-red-500',
    },
  ];

  const chartData = (data?.monthlyChart || []).map(m => ({
    name: m.month,
    Revenue: Math.round(Number(m.revenue) / 1000),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's your business at a glance.</p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="btn-primary">
          <FileText size={15} /> New Invoice
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.iconBg}`}>
              <s.icon size={20} className={s.iconColor} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-semibold truncate">{s.label}</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5 truncate">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5 truncate">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue chart */}
        <div className="card lg:col-span-3">
          <h3 className="font-bold text-gray-800 mb-4">Revenue (Last 6 Months) · ₹ in thousands</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#fce8e3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Nunito' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Nunito' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [`₹${v}K`, 'Revenue']}
                contentStyle={{ fontFamily: 'Nunito', fontSize: 13, borderRadius: 12, border: '1px solid #ffe8e3' }}
              />
              <Bar dataKey="Revenue" fill="#e8180a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="card lg:col-span-2 flex flex-col gap-3">
          <h3 className="font-bold text-gray-800">Quick Actions</h3>
          {[
            { label: 'Create Invoice', desc: 'New tax invoice / proforma', path: '/invoices/new', color: 'bg-brand-600 text-white' },
            { label: 'Add Customer', desc: 'Register new party', path: '/customers', color: 'bg-warm-100 text-gray-700' },
            { label: 'Add Product', desc: 'New SKU / item', path: '/products', color: 'bg-warm-100 text-gray-700' },
            { label: 'Record Payment', desc: 'Cash / UPI / bank', path: '/payments', color: 'bg-warm-100 text-gray-700' },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] ${a.color}`}
            >
              <div className="text-left">
                <div>{a.label}</div>
                <div className="text-xs font-normal opacity-70">{a.desc}</div>
              </div>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Recent Invoices</h3>
          <button onClick={() => navigate('/invoices')} className="btn-ghost">View all →</button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Balance Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentInvoices || []).map(inv => (
                <tr key={inv.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td className="font-mono text-brand-600 font-medium">{inv.invoiceNo}</td>
                  <td className="font-semibold">{inv.customer?.name}</td>
                  <td className="text-gray-500">{formatDate(inv.invoiceDate)}</td>
                  <td className="amount">{formatINR(inv.grandTotal)}</td>
                  <td className="amount text-amber-600">{formatINR(inv.balanceDue)}</td>
                  <td>{statusBadge(inv.status)}</td>
                </tr>
              ))}
              {!data?.recentInvoices?.length && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No invoices yet. Create your first one!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
