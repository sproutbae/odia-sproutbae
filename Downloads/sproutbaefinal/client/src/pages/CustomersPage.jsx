// src/pages/CustomersPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { formatINR } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, X, Loader2 } from 'lucide-react';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh'];

const emptyForm = { name:'', contactName:'', phone:'', email:'', gstin:'', address:'', city:'', state:'Maharashtra', pincode:'', creditLimit:0 };

export default function CustomersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/customers', { params: { search, limit: 50 } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/customers', d),
    onSuccess: () => { toast.success('Customer added!'); qc.invalidateQueries(['customers']); setShowModal(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/> Add Customer</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>GSTIN</th><th>Credit Limit</th><th>Action</th></tr></thead>
            <tbody>
              {isLoading && [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-4 bg-warm-100 rounded animate-pulse"/></td></tr>)}
              {!isLoading && data?.customers?.map(c => (
                <tr key={c.id}>
                  <td><div className="font-semibold">{c.name}</div><div className="text-xs text-gray-400">{c.contactName}</div></td>
                  <td className="font-mono text-sm">{c.phone || '—'}</td>
                  <td>{c.city || '—'}</td>
                  <td className="font-mono text-xs">{c.gstin || '—'}</td>
                  <td>{formatINR(c.creditLimit)}</td>
                  <td><button onClick={() => navigate(`/customers/${c.id}`)} className="btn-ghost text-xs py-1">View →</button></td>
                </tr>
              ))}
              {!isLoading && !data?.customers?.length && <tr><td colSpan={6} className="text-center text-gray-400 py-10">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-warm-200">
              <h2 className="font-bold text-lg">Add Customer</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-warm-100"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Business Name *</label><input className="input" value={form.name} onChange={f('name')} required/></div>
                <div><label className="label">Contact Person</label><input className="input" value={form.contactName} onChange={f('contactName')}/></div>
                <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={f('phone')}/></div>
                <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={f('email')}/></div>
                <div><label className="label">GSTIN</label><input className="input" placeholder="27AABCS..." value={form.gstin} onChange={f('gstin')}/></div>
                <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={f('address')}/></div>
                <div><label className="label">City</label><input className="input" value={form.city} onChange={f('city')}/></div>
                <div><label className="label">State</label>
                  <select className="select" value={form.state} onChange={f('state')}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="label">Pincode</label><input className="input" value={form.pincode} onChange={f('pincode')}/></div>
                <div><label className="label">Credit Limit (₹)</label><input className="input" type="number" value={form.creditLimit} onChange={f('creditLimit')}/></div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : null} Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
