// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';

export default function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const [form, setForm] = useState({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  const mutation = useMutation({
    mutationFn: (d) => api.put('/settings', d),
    onSuccess: () => toast.success('Settings saved!'),
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  if (isLoading) return <div className="card animate-pulse h-64" />;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="page-title">Business Settings</h1>

      <div className="card space-y-5">
        <h3 className="font-bold text-gray-800">Business Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Business Name</label><input className="input" value={form.name||''} onChange={f('name')}/></div>
          <div className="col-span-2"><label className="label">GSTIN</label><input className="input" placeholder="27AABCS1429B1ZB" value={form.gstin||''} onChange={f('gstin')}/></div>
          <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address||''} onChange={f('address')}/></div>
          <div><label className="label">City</label><input className="input" value={form.city||''} onChange={f('city')}/></div>
          <div><label className="label">State</label><input className="input" value={form.state||''} onChange={f('state')}/></div>
          <div><label className="label">Pincode</label><input className="input" value={form.pincode||''} onChange={f('pincode')}/></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone||''} onChange={f('phone')}/></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email||''} onChange={f('email')}/></div>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-gray-800">Invoice Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Invoice Prefix</label><input className="input" placeholder="SB" value={form.invoicePrefix||''} onChange={f('invoicePrefix')}/></div>
          <div><label className="label">Next Invoice #</label><input className="input" type="number" value={form.nextInvoiceNo||1} onChange={f('nextInvoiceNo')}/></div>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-gray-800">Bank & Payment Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Bank Name</label><input className="input" value={form.bankName||''} onChange={f('bankName')}/></div>
          <div><label className="label">Account Number</label><input className="input" value={form.accountNo||''} onChange={f('accountNo')}/></div>
          <div><label className="label">IFSC Code</label><input className="input" value={form.ifsc||''} onChange={f('ifsc')}/></div>
          <div><label className="label">UPI ID</label><input className="input" placeholder="sproutbae@upi" value={form.upiId||''} onChange={f('upiId')}/></div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button className="btn-primary" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
          Save Settings
        </button>
      </div>
    </div>
  );
}
