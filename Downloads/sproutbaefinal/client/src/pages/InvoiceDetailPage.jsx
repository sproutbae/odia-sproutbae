// src/pages/InvoiceDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatINR, formatDate } from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, CheckCircle, Download, MessageCircle, Send } from 'lucide-react';

const statusBadge = (s) => {
  const cls = { PAID:'badge-paid', PARTIAL:'badge-partial', OVERDUE:'badge-overdue', DRAFT:'badge-draft', SENT:'badge-pending', CANCELLED:'badge-cancelled' };
  return <span className={cls[s]||'badge-draft'}>{s}</span>;
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: inv, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }) => api.patch(`/invoices/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['invoice', id]); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const whatsappMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/send-invoice', { invoiceId: id }),
    onSuccess: () => toast.success('Invoice sent via WhatsApp! ✅'),
    onError: (e) => toast.error(e.response?.data?.error || 'WhatsApp not configured'),
  });

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });
      const token = localStorage.getItem('sb_token');
      const res = await fetch(`/api/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!', { id: 'pdf' });
    } catch (e) {
      toast.error('PDF failed: ' + e.message, { id: 'pdf' });
    }
  };

  if (isLoading) return <div className="card animate-pulse h-96" />;
  if (!inv) return <div className="card text-center text-gray-400 py-10">Invoice not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 no-print">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3"><ArrowLeft size={16}/></button>
        <h1 className="page-title flex-1">{inv.invoiceNo}</h1>
        {statusBadge(inv.status)}
        <button onClick={() => window.print()} className="btn-secondary"><Printer size={15}/> Print</button>
        <button onClick={handleDownloadPDF} className="btn-secondary"><Download size={15}/> PDF</button>
        <button onClick={() => whatsappMutation.mutate()} disabled={whatsappMutation.isPending} className="btn-secondary text-green-700 border-green-200 hover:bg-green-50">
          <MessageCircle size={15}/> WhatsApp
        </button>
        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
          <button onClick={() => statusMutation.mutate({ status: 'PAID' })} className="btn-primary">
            <CheckCircle size={15}/> Mark Paid
          </button>
        )}
      </div>

      {/* Invoice document */}
      <div className="card" id="invoice-print">
        {/* Business header */}
        <div className="flex justify-between items-start pb-5 border-b border-warm-200 mb-5">
          <div>
            <div className="font-display text-3xl text-brand-600">SproutBae</div>
            <div className="text-xs text-gray-400 mt-1">Wholesale Billing</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{inv.type.replace('_',' ')}</div>
            <div className="font-mono text-brand-600 font-bold mt-1">{inv.invoiceNo}</div>
            <div className="text-sm text-gray-500">Date: {formatDate(inv.invoiceDate)}</div>
            {inv.dueDate && <div className="text-sm text-gray-500">Due: {formatDate(inv.dueDate)}</div>}
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Bill To</div>
          <div className="font-bold text-gray-800">{inv.customer?.name}</div>
          <div className="text-sm text-gray-500">{inv.customer?.address}, {inv.customer?.city}, {inv.customer?.state}</div>
          {inv.customer?.gstin && <div className="text-sm text-gray-500">GSTIN: {inv.customer.gstin}</div>}
          {inv.customer?.phone && <div className="text-sm text-gray-500">Ph: {inv.customer.phone}</div>}
        </div>

        {/* Items */}
        <div className="table-container mb-5">
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Unit</th>
                <th>Rate</th><th>GST%</th><th>GST Amt</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items?.map((item, i) => (
                <tr key={item.id}>
                  <td className="text-gray-400">{i+1}</td>
                  <td className="font-semibold">{item.description}</td>
                  <td className="font-mono text-xs">{item.hsnCode||'—'}</td>
                  <td className="font-mono">{item.qty}</td>
                  <td>{item.unit}</td>
                  <td className="amount">{formatINR(item.rate)}</td>
                  <td>{item.gstRate}%</td>
                  <td className="amount">{formatINR(item.cgst+item.sgst+item.igst)}</td>
                  <td className="amount font-semibold">{formatINR(item.totalAmt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="amount">{formatINR(inv.subtotal)}</span></div>
            {inv.gstType === 'CGST_SGST' ? (
              <>
                <div className="flex justify-between text-gray-500"><span>CGST</span><span className="amount">{formatINR(inv.cgst)}</span></div>
                <div className="flex justify-between text-gray-500"><span>SGST</span><span className="amount">{formatINR(inv.sgst)}</span></div>
              </>
            ) : (
              <div className="flex justify-between text-gray-500"><span>IGST</span><span className="amount">{formatINR(inv.igst)}</span></div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-warm-200 pt-2">
              <span>Grand Total</span><span className="text-brand-600 amount">{formatINR(inv.grandTotal)}</span>
            </div>
            {inv.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-emerald-600"><span>Paid</span><span className="amount">{formatINR(inv.amountPaid)}</span></div>
                <div className="flex justify-between font-bold text-amber-600"><span>Balance Due</span><span className="amount">{formatINR(inv.balanceDue)}</span></div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {(inv.notes || inv.terms) && (
          <div className="mt-5 pt-5 border-t border-warm-200 grid grid-cols-2 gap-4 text-xs text-gray-500">
            {inv.notes && <div><div className="font-semibold text-gray-700 mb-1">Notes</div>{inv.notes}</div>}
            {inv.terms && <div><div className="font-semibold text-gray-700 mb-1">Terms</div>{inv.terms}</div>}
          </div>
        )}
      </div>

      {/* Payment history */}
      {inv.payments?.length > 0 && (
        <div className="card no-print">
          <h3 className="font-bold mb-3">Payment History</h3>
          <div className="space-y-2">
            {inv.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-warm-100 last:border-0 text-sm">
                <div>
                  <span className="font-semibold">{formatINR(p.amount)}</span>
                  <span className="text-gray-400 ml-2">via {p.mode.replace('_',' ')}</span>
                  {p.reference && <span className="text-gray-400 ml-1">· Ref: {p.reference}</span>}
                </div>
                <div className="text-gray-400">{formatDate(p.paymentDate)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
