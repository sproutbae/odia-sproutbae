// src/pages/PaymentsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatINR, formatDate, paymentModes } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Loader2, Search } from 'lucide-react';

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState({ amount: '', mode: 'CASH', reference: '', notes: '', paymentDate: new Date().toISOString().slice(0,10) });

  const { data: invoices } = useQuery({
    queryKey: ['invoices-unpaid', invoiceSearch],
    queryFn: () => api.get('/invoices', { params: { status: 'PARTIAL', limit: 10 } }).then(r => r.data.invoices),
    enabled: showModal,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/payments', d),
    onSuccess: () => { toast.success('Payment recorded!'); qc.invalidateQueries(); setShowModal(false); setSelectedInvoice(null); setForm({ amount:'', mode:'CASH', reference:'', notes:'', paymentDate: new Date().toISOString().slice(0,10) }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const handleSubmit = () => {
    if (!selectedInvoice) return toast.error('Select an invoice');
    if (!form.amount) return toast.error('Enter amount');
    createMutation.mutate({ ...form, invoiceId: selectedInvoice.id, amount: parseFloat(form.amount) });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
        <button className="btn-primary" onClick={()=>setShowModal(true)}><Plus size={16}/> Record Payment</button>
      </div>

      <div className="card">
        <p className="text-gray-500 text-sm">Select an invoice from the Invoices page to record a payment, or use the button above to record against any outstanding invoice.</p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-warm-200">
              <h2 className="font-bold text-lg">Record Payment</h2>
              <button onClick={()=>setShowModal(false)} className="p-1 rounded-lg hover:bg-warm-100"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Invoice picker */}
              <div>
                <label className="label">Select Invoice (Unpaid / Partial)</label>
                <select className="select" onChange={e => { const inv = invoices?.find(i => i.id === e.target.value); setSelectedInvoice(inv||null); }}>
                  <option value="">— Select Invoice —</option>
                  {invoices?.map(inv=><option key={inv.id} value={inv.id}>{inv.invoiceNo} · {inv.customer?.name} · Due: {formatINR(inv.balanceDue)}</option>)}
                </select>
                {selectedInvoice && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-xl text-sm">
                    <span className="font-semibold">{selectedInvoice.invoiceNo}</span> · Balance: <span className="text-amber-700 font-bold">{formatINR(selectedInvoice.balanceDue)}</span>
                  </div>
                )}
              </div>
              <div><label className="label">Amount (₹) *</label><input className="input" type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Mode</label>
                  <select className="select" value={form.mode} onChange={e=>setForm(f=>({...f,mode:e.target.value}))}>
                    {paymentModes.map(m=><option key={m}>{m.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div><label className="label">Date</label><input className="input" type="date" value={form.paymentDate} onChange={e=>setForm(f=>({...f,paymentDate:e.target.value}))}/></div>
              </div>
              <div><label className="label">Reference (UPI / Cheque No.)</label><input className="input" placeholder="Optional" value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))}/></div>
              <div><label className="label">Notes</label><input className="input" placeholder="Optional" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending?<Loader2 size={14} className="animate-spin"/>:null} Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
