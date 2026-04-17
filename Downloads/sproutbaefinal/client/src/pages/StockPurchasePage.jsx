// src/pages/StockPurchasePage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { formatINR } from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Loader2, PackagePlus } from 'lucide-react';

const emptyItem = { productId: '', qty: '', rate: '', notes: '' };

export default function StockPurchasePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [meta, setMeta] = useState({ vendorName: '', billNumber: '', billDate: new Date().toISOString().slice(0,10), paymentMode: 'CASH', notes: '' });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (d) => api.post('/stock/purchase', d),
    onSuccess: (res) => {
      toast.success(res.data.message);
      navigate('/products');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const updateItem = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const getProduct = (id) => products?.find(p => p.id === id);

  const handleSubmit = () => {
    const validItems = items.filter(i => i.productId && i.qty > 0);
    if (!validItems.length) return toast.error('Add at least one item with product and quantity');
    mutation.mutate({ ...meta, items: validItems });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3"><ArrowLeft size={16}/></button>
        <div>
          <h1 className="page-title">Quick Stock Entry</h1>
          <p className="text-sm text-gray-500">Record stock received without a full Purchase Order</p>
        </div>
      </div>

      {/* Meta */}
      <div className="card grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Vendor / Supplier Name</label>
          <input className="input" placeholder="e.g. Local Mandi, Cash Purchase" value={meta.vendorName} onChange={e => setMeta(p => ({...p, vendorName: e.target.value}))}/>
        </div>
        <div>
          <label className="label">Bill / Challan Number</label>
          <input className="input" placeholder="Optional" value={meta.billNumber} onChange={e => setMeta(p => ({...p, billNumber: e.target.value}))}/>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={meta.billDate} onChange={e => setMeta(p => ({...p, billDate: e.target.value}))}/>
        </div>
        <div>
          <label className="label">Payment Mode</label>
          <select className="select" value={meta.paymentMode} onChange={e => setMeta(p => ({...p, paymentMode: e.target.value}))}>
            {['CASH','UPI','BANK_TRANSFER','CHEQUE'].map(m => <option key={m}>{m.replace('_',' ')}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <input className="input" placeholder="Optional" value={meta.notes} onChange={e => setMeta(p => ({...p, notes: e.target.value}))}/>
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Items Received</h3>
          <button className="btn-ghost" onClick={() => setItems(p => [...p, {...emptyItem}])}>
            <Plus size={14}/> Add Item
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => {
            const prod = getProduct(item.productId);
            return (
              <div key={i} className="border border-warm-200 rounded-xl p-4 bg-warm-50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Product *</label>
                    <select className="select" value={item.productId}
                      onChange={e => {
                        const p = products?.find(x => x.id === e.target.value);
                        updateItem(i, 'productId', e.target.value);
                        if (p) updateItem(i, 'rate', p.costPrice || '');
                      }}>
                      <option value="">— Select product —</option>
                      {products?.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current stock: {p.stockQty} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  {prod && (
                    <div className="flex items-end">
                      <div className="p-3 bg-white rounded-xl border border-warm-200 text-xs w-full">
                        <span className="text-gray-400">Current stock: </span>
                        <span className="font-bold text-brand-600">{prod.stockQty} {prod.unit}</span>
                        {item.qty && (
                          <span className="ml-2 text-emerald-600">
                            → After: {prod.stockQty + parseFloat(item.qty || 0)} {prod.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="label">Quantity *</label>
                    <input type="number" className="input" min="0" placeholder="0"
                      value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">Purchase Rate (₹)</label>
                    <input type="number" className="input" min="0" placeholder="Cost price"
                      value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)}/>
                    <div className="text-xs text-gray-400 mt-1">Updates cost price</div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="label">Value</label>
                      <div className="input bg-warm-100 font-semibold font-mono text-gray-700">
                        {formatINR((parseFloat(item.qty)||0) * (parseFloat(item.rate)||0))}
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => setItems(p => p.filter((_,idx)=>idx!==i))}
                        className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-4 text-right">
          <div className="text-lg font-bold text-brand-600">
            Total Value: {formatINR(items.reduce((s,i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.rate)||0), 0))}
          </div>
          <div className="text-xs text-gray-400 mt-1">Stock will be added immediately on save</div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pb-8">
        <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={15} className="animate-spin"/> : <PackagePlus size={15}/>}
          {mutation.isPending ? 'Saving...' : 'Add Stock'}
        </button>
      </div>
    </div>
  );
}
