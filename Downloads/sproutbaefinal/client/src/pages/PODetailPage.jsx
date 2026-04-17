// src/pages/PODetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatINR, formatDate } from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, PackageCheck, IndianRupee, Loader2 } from 'lucide-react';

const STATUS_BADGE = {
  DRAFT: 'badge-draft', SENT: 'badge-pending', RECEIVED: 'badge-paid',
  PARTIAL: 'badge-partial', CANCELLED: 'badge-cancelled',
};

export default function PODetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showReceive, setShowReceive] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState({});
  const [payment, setPayment] = useState({ amount: '', mode: 'CASH', reference: '' });

  const { data: po, isLoading } = useQuery({
    queryKey: ['po', id],
    queryFn: () => api.get(`/purchase-orders/${id}`).then(r => r.data),
  });

  const receiveMutation = useMutation({
    mutationFn: (d) => api.post(`/purchase-orders/${id}/receive`, d),
    onSuccess: () => {
      toast.success('Stock received and updated!');
      qc.invalidateQueries(['po', id]);
      setShowReceive(false);
      setReceivedQtys({});
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const paymentMutation = useMutation({
    mutationFn: (d) => api.post(`/purchase-orders/${id}/payment`, d),
    onSuccess: () => {
      toast.success('Payment recorded!');
      qc.invalidateQueries(['po', id]);
      setShowPayment(false);
      setPayment({ amount: '', mode: 'CASH', reference: '' });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => api.patch(`/purchase-orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['po', id]); },
  });

  if (isLoading) return <div className="card animate-pulse h-64"/>;
  if (!po) return <div className="card text-center text-gray-400 py-10">PO not found</div>;

  const handleReceive = () => {
    const receivedItems = Object.entries(receivedQtys)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, receivedQty]) => ({ itemId, receivedQty: parseFloat(receivedQty) }));

    if (!receivedItems.length) return toast.error('Enter quantity received for at least one item');
    receiveMutation.mutate({ receivedItems });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3"><ArrowLeft size={16}/></button>
        <h1 className="page-title flex-1">{po.poNumber}</h1>
        <span className={STATUS_BADGE[po.status] || 'badge-draft'}>{po.status}</span>
        {po.status === 'DRAFT' && (
          <button onClick={() => statusMutation.mutate('SENT')} className="btn-secondary">
            Mark Sent
          </button>
        )}
        {['SENT','PARTIAL','DRAFT'].includes(po.status) && (
          <button onClick={() => setShowReceive(true)} className="btn-secondary">
            <PackageCheck size={15}/> Receive Stock
          </button>
        )}
        {po.balanceDue > 0 && (
          <button onClick={() => setShowPayment(true)} className="btn-primary">
            <IndianRupee size={14}/> Record Payment
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Grand Total', val: formatINR(po.grandTotal), color: 'text-gray-800' },
          { label: 'Amount Paid', val: formatINR(po.amountPaid), color: 'text-emerald-600' },
          { label: 'Balance Due', val: formatINR(po.balanceDue), color: 'text-amber-600' },
          { label: 'Vendor', val: po.vendor?.name, color: 'text-brand-600' },
        ].map(s => (
          <div key={s.label} className="card py-3">
            <div className="text-xs text-gray-400 font-semibold">{s.label}</div>
            <div className={`font-bold mt-1 truncate ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* PO Details */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-5 pb-5 border-b border-warm-100">
          <div><span className="text-gray-400">Order Date:</span> <span className="font-semibold">{formatDate(po.orderDate)}</span></div>
          <div><span className="text-gray-400">Expected:</span> <span className="font-semibold">{po.expectedDate ? formatDate(po.expectedDate) : '—'}</span></div>
          <div><span className="text-gray-400">Received:</span> <span className="font-semibold">{po.receivedDate ? formatDate(po.receivedDate) : '—'}</span></div>
          <div><span className="text-gray-400">Created by:</span> <span className="font-semibold">{po.createdBy?.name}</span></div>
          {po.vendor?.gstin && <div><span className="text-gray-400">Vendor GSTIN:</span> <span className="font-mono text-xs">{po.vendor.gstin}</span></div>}
          {po.notes && <div className="col-span-3"><span className="text-gray-400">Notes:</span> {po.notes}</div>}
        </div>

        {/* Items */}
        <h3 className="font-bold mb-3">Items</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Pending</th>
                <th>Rate</th>
                <th>GST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="font-semibold">{item.description}</div>
                    {item.hsnCode && <div className="text-xs text-gray-400">HSN: {item.hsnCode}</div>}
                  </td>
                  <td className="font-mono">{item.qty} {item.unit}</td>
                  <td className="font-mono text-emerald-600">{item.receivedQty} {item.unit}</td>
                  <td className={`font-mono ${item.qty - item.receivedQty > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {item.qty - item.receivedQty} {item.unit}
                  </td>
                  <td className="amount">{formatINR(item.rate)}</td>
                  <td>{item.gstRate}%</td>
                  <td className="amount font-semibold">{formatINR(item.totalAmt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatINR(po.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Total Tax</span><span>{formatINR(po.totalTax)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-warm-200 pt-2">
              <span>Grand Total</span><span className="text-brand-600">{formatINR(po.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {showReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-warm-200">
              <h3 className="font-bold text-lg">Receive Stock</h3>
              <p className="text-sm text-gray-400 mt-1">Enter quantities actually received. Stock will be updated automatically.</p>
            </div>
            <div className="p-5 space-y-3">
              {po.items?.filter(i => i.qty - i.receivedQty > 0).map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.description}</div>
                    <div className="text-xs text-gray-400">Pending: {item.qty - item.receivedQty} {item.unit}</div>
                  </div>
                  <input
                    type="number" min="0" max={item.qty - item.receivedQty}
                    className="input w-24 text-center"
                    placeholder="0"
                    value={receivedQtys[item.id] || ''}
                    onChange={e => setReceivedQtys(p => ({ ...p, [item.id]: e.target.value }))}
                  />
                  <span className="text-xs text-gray-400 w-10">{item.unit}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={() => setShowReceive(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleReceive} disabled={receiveMutation.isPending}>
                {receiveMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <PackageCheck size={14}/>}
                Confirm Receipt & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-sm">
            <div className="p-5 border-b border-warm-200">
              <h3 className="font-bold text-lg">Record Payment</h3>
              <p className="text-sm text-gray-400">Balance due: <span className="font-bold text-amber-600">{formatINR(po.balanceDue)}</span></p>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="label">Amount (₹)</label>
                <input type="number" className="input" value={payment.amount} onChange={e => setPayment(p => ({...p, amount: e.target.value}))}/>
              </div>
              <div><label className="label">Mode</label>
                <select className="select" value={payment.mode} onChange={e => setPayment(p => ({...p, mode: e.target.value}))}>
                  {['CASH','UPI','BANK_TRANSFER','CHEQUE'].map(m => <option key={m}>{m.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Reference</label>
                <input className="input" placeholder="UTR / Cheque no." value={payment.reference} onChange={e => setPayment(p => ({...p, reference: e.target.value}))}/>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={() => setShowPayment(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={() => paymentMutation.mutate(payment)} disabled={paymentMutation.isPending}>
                {paymentMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : null} Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
