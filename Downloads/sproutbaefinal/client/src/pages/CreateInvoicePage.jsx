// src/pages/CreateInvoicePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api, { formatINR, GST_RATES } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';

const emptyItem = { description: '', productId: '', hsnCode: '', qty: 1, unit: 'PCS', rate: '', discount: 0, gstRate: 18 };

const calcItem = (item, gstType) => {
  const base = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0) - (parseFloat(item.discount) || 0);
  const gst = base * (item.gstRate / 100);
  const cgst = gstType === 'CGST_SGST' ? gst / 2 : 0;
  const sgst = gstType === 'CGST_SGST' ? gst / 2 : 0;
  const igst = gstType === 'IGST' ? gst : 0;
  return { taxableAmt: base, cgst, sgst, igst, totalAmt: base + gst };
};

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerId: '', gstType: 'CGST_SGST', type: 'TAX_INVOICE',
    dueDate: '', notes: '', terms: 'Payment due within 30 days.',
    items: [{ ...emptyItem }],
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => api.get('/customers', { params: { search: customerSearch, limit: 8 } }).then(r => r.data.customers),
    enabled: customerSearch.length > 1,
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const selectedCustomer = useQuery({
    queryKey: ['customer', form.customerId],
    queryFn: () => api.get(`/customers/${form.customerId}`).then(r => r.data),
    enabled: !!form.customerId,
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/invoices', data),
    onSuccess: (res) => {
      toast.success(`Invoice ${res.data.invoiceNo} created!`);
      navigate(`/invoices/${res.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create invoice'),
  });

  const updateItem = (i, key, val) =>
    setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));

  const setProduct = (i, product) => {
    updateItem(i, 'description', product.name);
    updateItem(i, 'productId', product.id);
    updateItem(i, 'hsnCode', product.hsnCode || '');
    updateItem(i, 'rate', product.salePrice);
    updateItem(i, 'unit', product.unit);
    updateItem(i, 'gstRate', product.gstRate);
  };

  const totals = form.items.reduce((acc, item) => {
    const c = calcItem(item, form.gstType);
    return {
      subtotal: acc.subtotal + c.taxableAmt,
      cgst: acc.cgst + c.cgst,
      sgst: acc.sgst + c.sgst,
      igst: acc.igst + c.igst,
      total: acc.total + c.totalAmt,
    };
  }, { subtotal: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

  const handleSubmit = (status = 'DRAFT') => {
    if (!form.customerId) return toast.error('Please select a customer');
    if (form.items.some(i => !i.description || !i.rate)) return toast.error('Fill all item details');
    mutation.mutate({ ...form, status });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Invoice</h1>
          <p className="text-sm text-gray-500">Create a GST-compliant invoice</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
      </div>

      {/* Invoice meta */}
      <div className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Invoice Type</label>
          <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="TAX_INVOICE">Tax Invoice</option>
            <option value="PROFORMA">Proforma Invoice</option>
            <option value="DELIVERY_CHALLAN">Delivery Challan</option>
          </select>
        </div>
        <div>
          <label className="label">GST Type</label>
          <select className="select" value={form.gstType} onChange={e => setForm(f => ({ ...f, gstType: e.target.value }))}>
            <option value="CGST_SGST">CGST + SGST (Intra-state)</option>
            <option value="IGST">IGST (Inter-state)</option>
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
      </div>

      {/* Customer selection */}
      <div className="card">
        <label className="label">Bill To (Customer)</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search customer name..."
            value={customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); setShowCustomerList(true); }}
            onFocus={() => setShowCustomerList(true)}
          />
          {showCustomerList && customers?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-warm-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {customers.map(c => (
                <button key={c.id} className="w-full text-left px-4 py-2.5 hover:bg-warm-50 text-sm transition-colors"
                  onClick={() => { setForm(f => ({ ...f, customerId: c.id })); setCustomerSearch(c.name); setShowCustomerList(false); }}>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.phone} · {c.city} · {c.gstin || 'No GSTIN'}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedCustomer.data && (
          <div className="mt-3 p-3 bg-warm-50 rounded-xl text-sm">
            <div className="font-semibold">{selectedCustomer.data.name}</div>
            <div className="text-gray-500">{selectedCustomer.data.address}, {selectedCustomer.data.city}, {selectedCustomer.data.state}</div>
            <div className="text-gray-500">GSTIN: {selectedCustomer.data.gstin || 'N/A'} · {selectedCustomer.data.phone}</div>
            <div className="text-amber-600 font-semibold text-xs mt-1">Outstanding: {formatINR(selectedCustomer.data.outstanding)}</div>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Items</h3>
          <button className="btn-ghost" onClick={() => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }))}>
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {form.items.map((item, i) => (
            <div key={i} className="border border-warm-200 rounded-xl p-4 bg-warm-50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Description + product picker */}
                <div className="sm:col-span-2">
                  <label className="label">Description / Product</label>
                  <select className="select mb-2" onChange={e => { const p = products?.find(x => x.id === e.target.value); if (p) setProduct(i, p); }}>
                    <option value="">— Pick from catalog —</option>
                    {products?.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty} {p.unit})</option>)}
                  </select>
                  <input className="input" placeholder="Or type description manually..." value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                </div>
                <div>
                  <label className="label">HSN Code</label>
                  <input className="input" placeholder="e.g. 1006" value={item.hsnCode} onChange={e => updateItem(i, 'hsnCode', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="label">Qty</label>
                  <input type="number" className="input" min="0" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select className="select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                    {['PCS', 'KG', 'BAG', 'BOX', 'MTR', 'LTR', 'CAN', 'DOZ', 'SET'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Rate (₹)</label>
                  <input type="number" className="input" min="0" value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} />
                </div>
                <div>
                  <label className="label">GST %</label>
                  <select className="select" value={item.gstRate} onChange={e => updateItem(i, 'gstRate', Number(e.target.value))}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="label">Total</label>
                    <div className="input bg-warm-100 font-semibold text-gray-700 font-mono">
                      {formatINR(calcItem(item, form.gstType).totalAmt)}
                    </div>
                  </div>
                  {form.items.length > 1 && (
                    <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}
                      className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal (Taxable)</span><span className="font-mono">{formatINR(totals.subtotal)}</span></div>
            {form.gstType === 'CGST_SGST' ? (
              <>
                <div className="flex justify-between text-sm text-gray-600"><span>CGST</span><span className="font-mono">{formatINR(totals.cgst)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>SGST</span><span className="font-mono">{formatINR(totals.sgst)}</span></div>
              </>
            ) : (
              <div className="flex justify-between text-sm text-gray-600"><span>IGST</span><span className="font-mono">{formatINR(totals.igst)}</span></div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-warm-200 pt-2">
              <span>Grand Total</span>
              <span className="font-mono text-brand-600">{formatINR(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Notes</label>
          <textarea className="input h-20 resize-none" placeholder="Any notes for customer..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div>
          <label className="label">Terms & Conditions</label>
          <textarea className="input h-20 resize-none" value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pb-8">
        <button className="btn-secondary" onClick={() => handleSubmit('DRAFT')} disabled={mutation.isPending}>
          Save as Draft
        </button>
        <button className="btn-primary" onClick={() => handleSubmit('SENT')} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
          Create & Send
        </button>
      </div>
    </div>
  );
}
