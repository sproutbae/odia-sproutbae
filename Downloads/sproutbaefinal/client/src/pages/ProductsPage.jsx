// src/pages/ProductsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatINR, GST_RATES } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Loader2, AlertTriangle } from 'lucide-react';

const emptyProd = { name:'', sku:'', hsnCode:'', unit:'PCS', category:'', salePrice:0, costPrice:0, gstRate:5, stockQty:0, minStockQty:10, description:'' };
const UNITS = ['PCS','KG','BAG','BOX','MTR','LTR','CAN','DOZ','SET','TON'];
const CATEGORIES = ['Grains','Pulses','Oils','Sugar','Spices','Dairy','Beverages','Snacks','Household','Other'];

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyProd);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products', { params: { search } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/products', d),
    onSuccess: () => { toast.success('Product added!'); qc.invalidateQueries(['products']); setShowModal(false); setForm(emptyProd); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/> Add Product</button>
      </div>

      <div className="card p-4">
        <input className="input" placeholder="Search by name, SKU, or HSN..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Product</th><th>SKU</th><th>HSN</th><th>Unit</th><th>Sale Price</th><th>GST</th><th>Stock</th></tr></thead>
            <tbody>
              {isLoading && [...Array(5)].map((_,i)=><tr key={i}><td colSpan={7}><div className="h-4 bg-warm-100 rounded animate-pulse"/></td></tr>)}
              {!isLoading && products?.map(p=>(
                <tr key={p.id}>
                  <td><div className="font-semibold">{p.name}</div><div className="text-xs text-gray-400">{p.category}</div></td>
                  <td className="font-mono text-xs text-gray-500">{p.sku||'—'}</td>
                  <td className="font-mono text-xs">{p.hsnCode||'—'}</td>
                  <td>{p.unit}</td>
                  <td className="font-semibold amount">{formatINR(p.salePrice)}</td>
                  <td><span className="badge bg-warm-100 text-gray-600">{p.gstRate}%</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${p.stockQty <= p.minStockQty ? 'text-red-600' : 'text-emerald-600'}`}>{p.stockQty}</span>
                      {p.stockQty <= p.minStockQty && <AlertTriangle size={13} className="text-amber-500"/>}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !products?.length && <tr><td colSpan={7} className="text-center text-gray-400 py-10">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-warm-200">
              <h2 className="font-bold text-lg">Add Product / SKU</h2>
              <button onClick={()=>setShowModal(false)} className="p-1 rounded-lg hover:bg-warm-100"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Product Name *</label><input className="input" value={form.name} onChange={f('name')} required/></div>
                <div><label className="label">SKU</label><input className="input" placeholder="RICE-BAS-25" value={form.sku} onChange={f('sku')}/></div>
                <div><label className="label">HSN Code</label><input className="input" placeholder="1006" value={form.hsnCode} onChange={f('hsnCode')}/></div>
                <div><label className="label">Category</label>
                  <select className="select" value={form.category} onChange={f('category')}>
                    <option value="">Select...</option>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Unit</label>
                  <select className="select" value={form.unit} onChange={f('unit')}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div><label className="label">Cost Price (₹)</label><input className="input" type="number" value={form.costPrice} onChange={f('costPrice')}/></div>
                <div><label className="label">Sale Price (₹)</label><input className="input" type="number" value={form.salePrice} onChange={f('salePrice')}/></div>
                <div><label className="label">GST Rate</label>
                  <select className="select" value={form.gstRate} onChange={f('gstRate')}>
                    {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div><label className="label">Opening Stock</label><input className="input" type="number" value={form.stockQty} onChange={f('stockQty')}/></div>
                <div><label className="label">Min Stock Alert</label><input className="input" type="number" value={form.minStockQty} onChange={f('minStockQty')}/></div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={()=>createMutation.mutate(form)} disabled={createMutation.isPending}>
                {createMutation.isPending?<Loader2 size={14} className="animate-spin"/>:null} Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
