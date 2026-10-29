import { LogOut, Menu, Scissors, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { adminNavItems } from '../data/admin/navigation.js';
import { adminAuthApi } from '../services/adminAuthApi.js';
import { useAdminAuthStore } from '../store/useAdminAuthStore.js';

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { admin, clearAdmin } = useAdminAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await adminAuthApi.logout();
    } finally {
      clearAdmin();
      navigate('/admin/login', { replace: true });
    }
  }

  function renderNavItem(item, compact = false) {
    const Icon = item.icon;

    if (item.action === 'logout') {
      return (
        <button
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-neutral-600 transition hover:bg-red-50 hover:text-red-700 ${
            compact ? 'justify-center' : ''
          }`}
          key={item.label}
          type="button"
          onClick={handleLogout}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {compact ? null : <span>{item.label}</span>}
        </button>
      );
    }

    return (
      <NavLink
        className={({ isActive }) =>
          `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isActive ? 'bg-rosewood text-white shadow-soft' : 'text-neutral-600 hover:bg-pearl hover:text-rosewood'
          } ${compact ? 'justify-center' : ''}`
        }
        key={item.label}
        to={item.href}
        onClick={() => setMobileOpen(false)}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {compact ? null : <span>{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div className="min-h-screen bg-mist/80 lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-champagne/70 bg-white/95 shadow-soft lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-champagne/70 px-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-rosewood to-ink text-white shadow-soft">
            <Scissors className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold leading-5 text-ink">Bliss Admin</p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blush">Reception desk</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="grid gap-1">{adminNavItems.map((item) => renderNavItem(item))}</div>
        </nav>

        <div className="border-t border-champagne/70 p-4">
          <div className="rounded-lg bg-pearl p-3 ring-1 ring-champagne/70">
            <p className="truncate text-sm font-bold text-ink">{admin?.name}</p>
            <p className="truncate text-xs text-neutral-600">{admin?.email}</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-champagne/70 bg-white/90 shadow-sm backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-pearl text-ink ring-1 ring-champagne/70 lg:hidden"
                type="button"
                aria-label="Open admin navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div>
                <p className="text-sm font-semibold text-neutral-500">Bliss Beauty Salon</p>
                <h1 className="text-xl font-bold tracking-normal text-ink sm:text-2xl">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full bg-mist px-4 py-3 text-sm font-semibold text-ink ring-1 ring-neutral-200 sm:inline-flex">
                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {admin?.role}
              </div>
              <button
                className="hidden min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-rosewood sm:inline-flex lg:hidden"
                type="button"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-champagne/70 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {adminNavItems
              .filter((item) => item.action !== 'logout')
              .slice(0, 6)
              .map((item) => renderNavItem(item, true))}
          </nav>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative h-full w-80 max-w-[86vw] bg-white shadow-salon">
              <div className="flex h-20 items-center justify-between border-b border-champagne/70 px-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-rosewood to-ink text-white shadow-soft">
                    <Scissors className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-ink">Bliss Admin</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blush">Navigation</p>
                  </div>
                </div>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pearl text-ink ring-1 ring-champagne/70"
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <nav className="grid gap-1 overflow-y-auto px-3 py-5">{adminNavItems.map((item) => renderNavItem(item))}</nav>
            </aside>
          </div>
        ) : null}

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
