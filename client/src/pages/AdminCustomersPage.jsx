import { CalendarDays, LoaderCircle, RefreshCw, Search, Scissors, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import EmptyState from '../components/admin/dashboard/EmptyState.jsx';
import StatusBadge from '../components/admin/dashboard/StatusBadge.jsx';
import { customersApi } from '../services/customersApi.js';

function formatDate(value) {
  if (!value) return 'No visits yet';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSlot(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-mist p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-sage">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function CustomerCard({ customer }) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ink text-white">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold text-ink">{customer.name}</h3>
              <p className="mt-1 text-sm font-semibold text-neutral-600">{customer.maskedPhone}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
            <span className="rounded-full bg-mist px-3 py-1">{customer.email || 'No email'}</span>
            <span className="rounded-full bg-mist px-3 py-1">Last visit {formatDate(customer.lastVisit)}</span>
            <span className="rounded-full bg-mist px-3 py-1">
              Common service {customer.commonService?.name || 'Not enough data'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-80">
          <Metric label="Total visits" value={customer.totalVisits} />
          <Metric label="Completed" value={customer.completed} />
          <Metric label="No-shows" value={customer.noShows} />
        </div>
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-4">
        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-neutral-500">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Recent appointments
        </h4>
        <div className="mt-3 grid gap-2">
          {customer.recentAppointments.map((appointment) => (
            <div
              className="grid gap-3 rounded-md border border-neutral-200 p-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"
              key={appointment.id}
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{appointment.service?.name || 'Service'}</p>
                <p className="text-neutral-500">
                  {appointment.bookingReference} - {appointment.staff?.name || 'Any stylist'}
                </p>
              </div>
              <p className="font-semibold text-neutral-600">
                {formatDate(appointment.bookingDate)} {formatSlot(appointment.slotTime)}
              </p>
              <StatusBadge status={appointment.status} />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');

    try {
      const response = await customersApi.listAdmin({ search });
      setCustomers(response.customers);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load customer history.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadCustomers({ quiet: customers.length > 0 }), 300);
    return () => window.clearTimeout(timer);
  }, [customers.length, loadCustomers]);

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Customer History</p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Repeat visitors by phone</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Customer profiles are derived from appointments, so accounts can be added later without changing visit history.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-mist px-4 py-2 text-sm font-semibold text-ink ring-1 ring-neutral-200"
            type="button"
            onClick={() => loadCustomers()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <label className="mt-5 flex min-h-11 items-center gap-3 rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 focus-within:border-blush focus-within:ring-2 focus-within:ring-blush/20">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            className="w-full border-0 bg-transparent py-3 font-normal outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, phone, or booking ID"
          />
        </label>
      </section>

      {error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Loading customer history
        </div>
      ) : customers.length === 0 ? (
        <EmptyState title="No customer history found" message="Completed and missed visits will appear here by phone number." />
      ) : (
        <section className="grid gap-4">
          {customers.map((customer) => (
            <CustomerCard customer={customer} key={customer.id} />
          ))}
        </section>
      )}

      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mist text-sage">
            <Scissors className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-bold text-ink">Account-ready structure</h3>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              These records are grouped by normalized phone number today. A future Customer account can attach to the same phone
              key without losing historical bookings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminCustomersPage;
