// src/pages/InvoicesPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { formatINR, formatDate } from '../utils/api';
import { Plus, Search, Filter } from 'lucide-react';

const statusBadge = (s) => {
  const cls = { PAID:'badge-paid', PARTIAL:'badge-partial', OVERDUE:'badge-overdue', DRAFT:'badge-draft', SENT:'badge-pending', CANCELLED:'badge-cancelled' };
  return <span className={cls[s] || 'badge-draft'}>{s}</span>;
};

const STATUSES = ['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status, page],
    queryFn: () => api.get('/invoices', {
      params: { status: status === 'ALL' ? undefined : status, page, limit: 25 }
    }).then(r => r.data),
  });

  const invoices = (data?.invoices || []).filter(inv =>
    !search || inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <button className="btn-primary" onClick={() => navigate('/invoices/new')}>
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search invoice # or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${status === s ? 'bg-brand-600 text-white' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Total</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="h-4 bg-warm-100 rounded animate-pulse" /></td></tr>
              ))}
              {!isLoading && invoices.map(inv => (
                <tr key={inv.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td className="font-mono text-brand-600 font-semibold">{inv.invoiceNo}</td>
                  <td className="font-semibold text-gray-800">{inv.customer?.name}</td>
                  <td className="text-gray-500">{formatDate(inv.invoiceDate)}</td>
                  <td className="text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                  <td className="amount font-semibold">{formatINR(inv.grandTotal)}</td>
                  <td className={`amount font-semibold ${inv.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatINR(inv.balanceDue)}
                  </td>
                  <td>{statusBadge(inv.status)}</td>
                </tr>
              ))}
              {!isLoading && invoices.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">No invoices found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-warm-100">
            <span className="text-xs text-gray-400">Total: {data.total} invoices</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">← Prev</button>
              <span className="text-xs text-gray-500 py-1 px-2">Page {page} of {data.pages}</span>
              <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
