// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Users, Package, FileText,
  CreditCard, Settings, LogOut, Menu, X, Bell,
  Building2, ShoppingCart, UsersRound, PackagePlus
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices',        icon: FileText,         label: 'Invoices' },
  { to: '/customers',       icon: Users,            label: 'Customers' },
  { to: '/products',        icon: Package,          label: 'Products' },
  { to: '/payments',        icon: CreditCard,       label: 'Payments' },
  { to: '/vendors',         icon: Building2,        label: 'Vendors' },
  { to: '/purchase-orders', icon: ShoppingCart,     label: 'Purchase Orders' },
  { to: '/stock/purchase',  icon: PackagePlus,      label: 'Stock Entry' },
  { to: '/team',            icon: UsersRound,       label: 'Team' },
  { to: '/settings',        icon: Settings,         label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-warm-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-brand">
            <span className="text-white font-display text-lg">S</span>
          </div>
          <div>
            <div className="font-display text-xl text-brand-600 leading-none">SproutBae</div>
            <div className="text-xs text-gray-400 font-body">Wholesale Billing</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-warm-200">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-brand-600 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-brand-600 transition-colors p-1 rounded-lg hover:bg-warm-100">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-warm-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-warm-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white shadow-xl z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-warm-200 px-4 md:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-warm-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-warm-100 text-gray-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-600 rounded-full" />
            </button>
            <button
              onClick={() => navigate('/invoices/new')}
              className="btn-primary"
            >
              + New Invoice
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
