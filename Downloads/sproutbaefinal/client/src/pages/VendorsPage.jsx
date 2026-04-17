// src/pages/VendorsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { formatINR } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, X, Loader2, Building2 } from 'lucide-react';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh'];

const emptyForm = { name:'', contactName:'', phone:'', email:'', gstin:'', address:'', city:'', state:'Maharashtra', pincode:'', creditDays:30 };

export default function VendorsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => api.get('/vendors', { params: { search } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/vendors', d),
    onSuccess: () => {
      toast.success('Vendor added!');
      qc.invalidateQueries(['vendors']);
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors / Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your suppliers and purchase sources</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/purchase-orders')}>
            Purchase Orders
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16}/> Add Vendor
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search by name, phone, or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>GSTIN</th>
                <th>Credit Days</th>
                <th>POs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="h-4 bg-warm-100 rounded animate-pulse"/></td></tr>
              ))}
              {!isLoading && data?.vendors?.map(v => (
                <tr key={v.id}>
                  <td>
                    <div className="font-semibold text-gray-800">{v.name}</div>
                    <div className="text-xs text-gray-400">{v.contactName}</div>
                  </td>
                  <td className="font-mono text-sm">{v.phone || '—'}</td>
                  <td>{v.city || '—'}</td>
                  <td className="font-mono text-xs">{v.gstin || '—'}</td>
                  <td>
                    <span className="badge bg-blue-50 text-blue-700">{v.creditDays} days</span>
                  </td>
                  <td className="text-center">
                    <span className="font-semibold text-gray-700">{v._count?.purchaseOrders || 0}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/purchase-orders/new?vendorId=${v.id}`)}
                      className="btn-ghost text-xs py-1"
                    >
                      + PO
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.vendors?.length && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Building2 size={32} className="text-gray-200 mx-auto mb-2"/>
                    <div className="text-gray-400">No vendors yet. Add your first supplier!</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-warm-200">
              <h2 className="font-bold text-lg">Add Vendor / Supplier</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-warm-100">
                <X size={18}/>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Business Name *</label>
                  <input className="input" value={form.name} onChange={f('name')} placeholder="Supplier Co. Pvt Ltd" required/>
                </div>
                <div>
                  <label className="label">Contact Person</label>
                  <input className="input" value={form.contactName} onChange={f('contactName')}/>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={f('phone')}/>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={f('email')}/>
                </div>
                <div>
                  <label className="label">GSTIN</label>
                  <input className="input" placeholder="27AABCS..." value={form.gstin} onChange={f('gstin')}/>
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input className="input" value={form.address} onChange={f('address')}/>
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" value={form.city} onChange={f('city')}/>
                </div>
                <div>
                  <label className="label">State</label>
                  <select className="select" value={form.state} onChange={f('state')}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input className="input" value={form.pincode} onChange={f('pincode')}/>
                </div>
                <div>
                  <label className="label">Credit Days</label>
                  <input className="input" type="number" value={form.creditDays} onChange={f('creditDays')} min={0}/>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : null}
                Save Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
