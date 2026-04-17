// src/pages/CustomerDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { formatINR, formatDate } from '../utils/api';
import { ArrowLeft } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: c, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="card animate-pulse h-48" />;
  if (!c) return <div className="card text-center text-gray-400 py-10">Customer not found</div>;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3"><ArrowLeft size={16}/></button>
        <h1 className="page-title">{c.name}</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', val: formatINR(c.totalBilled), color: 'text-gray-800' },
          { label: 'Total Paid', val: formatINR(c.totalPaid), color: 'text-emerald-600' },
          { label: 'Outstanding', val: formatINR(c.outstanding), color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-xs text-gray-500 font-semibold">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="card grid grid-cols-2 gap-3 text-sm">
        {[
          ['Phone', c.phone], ['Email', c.email], ['GSTIN', c.gstin],
          ['Address', `${c.address}, ${c.city}, ${c.state} - ${c.pincode}`],
          ['Credit Limit', formatINR(c.creditLimit)],
        ].map(([k, v]) => v && (
          <div key={k}><span className="text-gray-400 font-semibold">{k}: </span><span>{v}</span></div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <h3 className="font-bold mb-3">Recent Invoices</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Invoice #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {c.invoices?.map(inv => (
                <tr key={inv.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td className="font-mono text-brand-600 font-semibold">{inv.invoiceNo}</td>
                  <td>{formatDate(inv.invoiceDate)}</td>
                  <td className="amount">{formatINR(inv.grandTotal)}</td>
                  <td><span className={`badge badge-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
