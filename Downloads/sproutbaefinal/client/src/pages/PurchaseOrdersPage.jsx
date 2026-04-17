// src/pages/PurchaseOrdersPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { formatINR, formatDate, GST_RATES } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Loader2, Trash2, Search, Package } from 'lucide-react';

const STATUS_COLORS = {
  DRAFT: 'badge-draft', SENT: 'badge-pending', RECEIVED: 'badge-paid',
  PARTIAL: 'badge-partial', CANCELLED: 'badge-cancelled',
};

const emptyItem = { description: '', productId: '', hsnCode: '', qty: 1, unit: 'PCS', rate: '', gstRate: 18 };

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorList, setShowVendorList] = useState(false);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [form, setForm] = useState({ expectedDate: '', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', filterStatus],
    queryFn: () => api.get('/purchase-orders', {
      params: { status: filterStatus === 'ALL' ? undefined : filterStatus }
    }).then(r => r.data),
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-search', vendorSearch],
    queryFn: () => api.get('/vendors', { params: { search: vendorSearch, limit: 8 } }).then(r => r.data.vendors),
    enabled: vendorSearch.length > 1,
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/purchase-orders', d),
    onSuccess: (res) => {
      toast.success(`PO ${res.data.poNumber} created!`);
      qc.invalidateQueries(['purchase-orders']);
      setShowCreate(false);
      setItems([{ ...emptyItem }]);
      setSelectedVendor(null);
      setVendorSearch('');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const updateItem = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const setProduct = (i, product) => {
    updateItem(i, 'description', product.name);
    updateItem(i, 'productId', product.id);
    updateItem(i, 'hsnCode', product.hsnCode || '');
    updateItem(i, 'rate', product.costPrice || product.salePrice);
    updateItem(i, 'unit', product.unit);
    updateItem(i, 'gstRate', product.gstRate);
  };

  const calcItem = (item) => {
    const base = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    return base + base * ((item.gstRate || 18) / 100);
  };

  const grandTotal = items.reduce((s, i) => s + calcItem(i), 0);

  const handleCreate = () => {
    if (!selectedVendor) return toast.error('Select a vendor');
    if (items.some(i => !i.description || !i.rate)) return toast.error('Fill all item details');
    createMutation.mutate({
      vendorId: selectedVendor.id,
      items,
      expectedDate: form.expectedDate,
      notes: form.notes,
    });
  };

  const STATUSES = ['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track purchases from vendors</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/vendors')}>Vendors</button>
          <button className="btn-secondary" onClick={() => navigate('/stock/purchase')}>Quick Stock Entry</button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16}/> New PO</button>
        </div>
      </div>

      {/* Status filters */}
      <div className="card p-4 flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterStatus === s ? 'bg-brand-600 text-white' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* PO Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Expected</th>
                <th>Total</th>
                <th>Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={8}><div className="h-4 bg-warm-100 rounded animate-pulse"/></td></tr>
              ))}
              {!isLoading && data?.orders?.map(po => (
                <tr key={po.id} className="cursor-pointer" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                  <td className="font-mono text-brand-600 font-semibold">{po.poNumber}</td>
                  <td className="font-semibold">{po.vendor?.name}</td>
                  <td className="text-gray-500 text-sm">{formatDate(po.orderDate)}</td>
                  <td className="text-gray-500 text-sm">{po.expectedDate ? formatDate(po.expectedDate) : '—'}</td>
                  <td className="amount font-semibold">{formatINR(po.grandTotal)}</td>
                  <td className={`amount font-semibold ${po.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatINR(po.balanceDue)}
                  </td>
                  <td><span className={STATUS_COLORS[po.status] || 'badge-draft'}>{po.status}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn-ghost text-xs py-1" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.orders?.length && (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Package size={32} className="text-gray-200 mx-auto mb-2"/>
                    <div className="text-gray-400">No purchase orders yet</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/30 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-3xl mb-8">
            <div className="flex items-center justify-between p-5 border-b border-warm-200">
              <h2 className="font-bold text-lg">Create Purchase Order</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-warm-100"><X size={18}/></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Vendor */}
              <div>
                <label className="label">Vendor / Supplier *</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input className="input pl-9" placeholder="Search vendor..." value={vendorSearch}
                    onChange={e => { setVendorSearch(e.target.value); setShowVendorList(true); }}
                    onFocus={() => setShowVendorList(true)}/>
                  {showVendorList && vendors?.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-warm-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      {vendors.map(v => (
                        <button key={v.id} className="w-full text-left px-4 py-2.5 hover:bg-warm-50 text-sm transition-colors"
                          onClick={() => { setSelectedVendor(v); setVendorSearch(v.name); setShowVendorList(false); }}>
                          <div className="font-semibold">{v.name}</div>
                          <div className="text-xs text-gray-400">{v.phone} · {v.city} · Credit: {v.creditDays} days</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedVendor && (
                  <div className="mt-2 p-3 bg-warm-50 rounded-xl text-sm">
                    <span className="font-semibold">{selectedVendor.name}</span>
                    {selectedVendor.gstin && <span className="text-gray-500 ml-2">GSTIN: {selectedVendor.gstin}</span>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expected Delivery Date</label>
                  <input type="date" className="input" value={form.expectedDate} onChange={e => setForm(f => ({...f, expectedDate: e.target.value}))}/>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input className="input" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}/>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Items *</label>
                  <button className="btn-ghost text-xs" onClick={() => setItems(p => [...p, {...emptyItem}])}>
                    <Plus size={13}/> Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="border border-warm-200 rounded-xl p-4 bg-warm-50 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="label">Product (from catalog)</label>
                          <select className="select" onChange={e => { const p = products?.find(x => x.id === e.target.value); if(p) setProduct(i, p); }}>
                            <option value="">— Pick product —</option>
                            {products?.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Description *</label>
                          <input className="input" placeholder="Item name..." value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}/>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="label">Qty</label>
                          <input type="number" className="input" min="0" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)}/>
                        </div>
                        <div>
                          <label className="label">Unit</label>
                          <select className="select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                            {['PCS','KG','BAG','BOX','MTR','LTR','CAN','DOZ','SET','TON'].map(u => <option key={u}>{u}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Rate (₹)</label>
                          <input type="number" className="input" min="0" value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)}/>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="label">GST %</label>
                            <select className="select" value={item.gstRate} onChange={e => updateItem(i, 'gstRate', Number(e.target.value))}>
                              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </div>
                          {items.length > 1 && (
                            <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                              className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14}/>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-brand-600">
                        Total: {formatINR(calcItem(item))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <div className="text-xl font-bold text-brand-600">Grand Total: {formatINR(grandTotal)}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : null}
                Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
