// src/pages/TeamPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Plus, X, Loader2, Shield, User, Edit2, Trash2, Key } from 'lucide-react';

const ROLES = ['ADMIN', 'ACCOUNTANT', 'STAFF'];
const ROLE_COLORS = {
  ADMIN: 'bg-brand-100 text-brand-700',
  ACCOUNTANT: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-gray-100 text-gray-600',
};
const ROLE_DESC = {
  ADMIN: 'Full access — can manage users, settings, all data',
  ACCOUNTANT: 'Can view all data, manage invoices and payments',
  STAFF: 'Can create invoices and view customers/products',
};

export default function TeamPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showPassword, setShowPassword] = useState(null); // userId
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
    enabled: me?.role === 'ADMIN',
  });

  const { data: logs } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get('/users/activity').then(r => r.data),
    enabled: ['ADMIN','ACCOUNTANT'].includes(me?.role),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/users', d),
    onSuccess: () => { toast.success('User created!'); qc.invalidateQueries(['users']); setShowAdd(false); setForm({ name:'', email:'', password:'', role:'STAFF' }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries(['users']); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }) => api.put(`/users/${id}/reset-password`, { newPassword: password }),
    onSuccess: () => { toast.success('Password reset!'); setShowPassword(null); setNewPassword(''); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('User removed'); qc.invalidateQueries(['users']); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  if (me?.role !== 'ADMIN') {
    return (
      <div className="card text-center py-12">
        <Shield size={40} className="text-gray-200 mx-auto mb-3"/>
        <div className="font-bold text-gray-500">Admin Access Required</div>
        <div className="text-sm text-gray-400 mt-1">Only admins can manage team members</div>
      </div>
    );
  }

  const f = (k) => (e) => setForm(p => ({...p, [k]: e.target.value}));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users and their access levels</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16}/> Add User</button>
      </div>

      {/* Role guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ROLES.map(role => (
          <div key={role} className="card flex items-start gap-3 py-3">
            <div className={`badge mt-0.5 ${ROLE_COLORS[role]}`}>{role}</div>
            <div className="text-xs text-gray-500">{ROLE_DESC[role]}</div>
          </div>
        ))}
      </div>

      {/* Users list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-warm-100">
          <h3 className="font-bold text-gray-800">Users ({users?.length || 0})</h3>
        </div>
        <div className="divide-y divide-warm-100">
          {isLoading && [...Array(3)].map((_,i) => (
            <div key={i} className="h-16 animate-pulse bg-warm-50 m-4 rounded-xl"/>
          ))}
          {users?.map(u => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-600 font-bold">{u.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  {u.name}
                  {u.id === me.id && <span className="text-xs text-gray-400">(you)</span>}
                </div>
                <div className="text-sm text-gray-400">{u.email}</div>
              </div>
              <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span>

              {u.id !== me.id && (
                <div className="flex items-center gap-1">
                  {/* Change role */}
                  <select
                    value={u.role}
                    onChange={e => roleMutation.mutate({ id: u.id, role: e.target.value })}
                    className="text-xs border border-warm-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => { setShowPassword(u.id); setNewPassword(''); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Reset password">
                    <Key size={14}/>
                  </button>
                  <button onClick={() => { if(confirm(`Remove ${u.name}?`)) deleteMutation.mutate(u.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      {logs?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.slice(0, 30).map(log => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-warm-50 last:border-0 text-sm">
                <div className="w-7 h-7 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={12} className="text-gray-500"/>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{log.userName}</span>
                  <span className="text-gray-500 mx-1">·</span>
                  <span className="text-gray-600">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                  {log.details && <div className="text-xs text-gray-400 truncate">{log.details}</div>}
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-warm-200">
              <h2 className="font-bold text-lg">Add Team Member</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-warm-100"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={f('name')} placeholder="Ravi Sharma"/></div>
              <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={f('email')} placeholder="ravi@sproutbae.com"/></div>
              <div><label className="label">Password *</label><input className="input" type="password" value={form.password} onChange={f('password')} placeholder="Min 8 characters"/></div>
              <div><label className="label">Role</label>
                <select className="select" value={form.role} onChange={f('role')}>
                  {ROLES.map(r => <option key={r} value={r}>{r} — {ROLE_DESC[r].split('—')[0].trim()}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : null} Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl3 shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-warm-200">
              <h2 className="font-bold text-lg">Reset Password</h2>
              <button onClick={() => setShowPassword(null)} className="p-1 rounded-lg hover:bg-warm-100"><X size={18}/></button>
            </div>
            <div className="p-5">
              <label className="label">New Password (min 8 chars)</label>
              <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"/>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-200">
              <button className="btn-secondary flex-1" onClick={() => setShowPassword(null)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={() => resetMutation.mutate({ id: showPassword, password: newPassword })} disabled={resetMutation.isPending}>
                {resetMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : null} Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
