import {
  AlertTriangle,
  CalendarClock,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  UserCheck,
  UserX,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/admin/dashboard/EmptyState.jsx';
import StatusBadge from '../components/admin/dashboard/StatusBadge.jsx';
import { appointmentsApi } from '../services/appointmentsApi.js';
import { bookingApi } from '../services/bookingApi.js';
import { servicesApi } from '../services/servicesApi.js';
import { socket } from '../services/socketClient.js';
import { staffApi } from '../services/staffApi.js';

const filters = [
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No-show', value: 'no-show' },
  { label: 'Walk-ins', value: 'walk-ins' },
  { label: 'Online', value: 'online' }
];

const emptyNewAppointment = {
  customerName: '',
  customerPhone: '',
  serviceId: '',
  staffId: 'any',
  bookingDate: '',
  slotTime: '',
  notes: ''
};

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSlot(value) {
  if (!value) return 'Not set';
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function dateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function serviceId(appointment) {
  return appointment?.service?._id || appointment?.service?.id || '';
}

function staffId(appointment) {
  return appointment?.preferredStaff?._id || appointment?.preferredStaff?.id || appointment?.staff?._id || appointment?.staff?.id || 'any';
}

function AppointmentAction({ icon: Icon, children, tone = 'dark', disabled, onClick }) {
  const ActionIcon = Icon;
  const tones = {
    dark: 'bg-ink text-white hover:bg-rosewood',
    mist: 'bg-mist text-sage ring-1 ring-neutral-200 hover:bg-white',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-100 hover:bg-red-100'
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <ActionIcon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function AppointmentCard({ appointment, active, busy, onSelect, onAction }) {
  return (
    <article
      className={`rounded-lg bg-white p-4 shadow-sm ring-1 transition ${
        active ? 'ring-ink' : 'ring-neutral-200 hover:ring-blush/40'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button className="min-w-0 text-left" type="button" onClick={() => onSelect(appointment)}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blush">{appointment.bookingReference}</p>
          <h3 className="mt-1 truncate text-lg font-bold text-ink">{appointment.customerName}</h3>
          <p className="mt-1 text-sm text-neutral-600">{appointment.customerPhone}</p>
        </button>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="font-bold text-ink">{appointment.service?.name || 'Service'}</p>
          <p className="text-neutral-500">{appointment.staff?.name || appointment.preferredStaff?.name || 'Any stylist'}</p>
        </div>
        <div>
          <p className="font-bold text-ink">{formatDate(appointment.bookingDate)}</p>
          <p className="text-neutral-500">{formatSlot(appointment.slotTime)}</p>
        </div>
        <div>
          <p className="font-bold capitalize text-ink">{appointment.source}</p>
          <p className="text-neutral-500">{appointment.estimatedDuration} min</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AppointmentAction icon={Eye} tone="mist" disabled={busy} onClick={() => onSelect(appointment)}>
          View
        </AppointmentAction>
        <AppointmentAction icon={UserCheck} disabled={busy} onClick={() => onAction('checkIn', appointment)}>
          Check In
        </AppointmentAction>
        <AppointmentAction icon={AlertTriangle} tone="amber" disabled={busy} onClick={() => onAction('late', appointment)}>
          Late
        </AppointmentAction>
        <AppointmentAction icon={UserX} tone="red" disabled={busy} onClick={() => onAction('noShow', appointment)}>
          No Show
        </AppointmentAction>
        <AppointmentAction icon={XCircle} tone="red" disabled={busy} onClick={() => onAction('cancel', appointment)}>
          Cancel
        </AppointmentAction>
      </div>
    </article>
  );
}

function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [newForm, setNewForm] = useState(emptyNewAppointment);
  const [newSlots, setNewSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNewSlots, setLoadingNewSlots] = useState(false);
  const [actionId, setActionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const eligibleStaff = useMemo(() => {
    if (!form?.serviceId) return staff;
    return staff.filter((member) => member.services?.some((service) => (service._id || service).toString() === form.serviceId));
  }, [form?.serviceId, staff]);

  const newEligibleStaff = useMemo(() => {
    if (!newForm.serviceId) return staff;
    return staff.filter((member) => member.services?.some((service) => (service._id || service).toString() === newForm.serviceId));
  }, [newForm.serviceId, staff]);

  const syncForm = useCallback((appointment) => {
    if (!appointment) {
      setForm(null);
      return;
    }

    setForm({
      customerName: appointment.customerName || '',
      customerPhone: appointment.customerPhone || '',
      customerEmail: appointment.customerEmail || '',
      serviceId: serviceId(appointment),
      staffId: staffId(appointment),
      bookingDate: dateInputValue(appointment.bookingDate),
      slotTime: appointment.slotTime || '',
      notes: appointment.notes || ''
    });
  }, []);

  const loadAppointments = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');

    try {
      const response = await appointmentsApi.listAdmin({ filter, search });
      setAppointments(response.appointments);
      if (selected) {
        const fresh = response.appointments.find((appointment) => appointment.id === selected.id);
        if (fresh && fresh.updatedAt !== selected.updatedAt) {
          setSelected(fresh);
          syncForm(fresh);
        }
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load appointments.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [filter, search, selected, syncForm]);

  useEffect(() => {
    Promise.all([servicesApi.listAdmin(), staffApi.listAdmin()])
      .then(([servicesResponse, staffResponse]) => {
        setServices(servicesResponse.services);
        setStaff(staffResponse.staff);
        setNewForm((current) => ({ ...current, serviceId: servicesResponse.services[0]?._id || '' }));
      })
      .catch(() => setError('Unable to load service and staff options.'));
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filter, loadAppointments]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadAppointments({ quiet: true }), 300);
    return () => window.clearTimeout(timer);
  }, [search, loadAppointments]);

  useEffect(() => {
    socket.connect();
    socket.emit('join:admin');
    socket.on('queue:updated', () => loadAppointments({ quiet: true }));
    socket.on('appointment:updated', () => loadAppointments({ quiet: true }));

    return () => {
      socket.off('queue:updated');
      socket.off('appointment:updated');
    };
  }, [loadAppointments]);

  function selectAppointment(appointment) {
    setSelected(appointment);
    syncForm(appointment);
    setNotice('');
    setError('');
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'serviceId' ? { staffId: 'any' } : {})
    }));
    setError('');
    setNotice('');
  }

  function updateNewForm(event) {
    const { name, value } = event.target;
    setNewForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'serviceId' ? { staffId: 'any', slotTime: '' } : {}),
      ...(name === 'staffId' || name === 'bookingDate' ? { slotTime: '' } : {})
    }));
    if (['serviceId', 'staffId', 'bookingDate'].includes(name)) setNewSlots([]);
    setError('');
    setNotice('');
  }

  async function loadNewSlots() {
    if (!newForm.serviceId || !newForm.bookingDate) {
      setError('Choose a service and date first.');
      return;
    }

    setLoadingNewSlots(true);
    setError('');

    try {
      const data = await bookingApi.availableSlots({
        serviceId: newForm.serviceId,
        staffId: newForm.staffId,
        date: newForm.bookingDate
      });
      setNewSlots(data.slots || []);
      if (data.closed || data.slots.length === 0) {
        setError(data.reason || 'No available slots for this selection.');
      }
    } catch (slotError) {
      setNewSlots([]);
      setError(slotError.response?.data?.message || 'Unable to load available times.');
    } finally {
      setLoadingNewSlots(false);
    }
  }

  async function createAdminAppointment(event) {
    event.preventDefault();
    if (!newForm.customerName.trim() || !newForm.customerPhone.trim()) {
      setError('Customer name and phone are required.');
      return;
    }
    if (!newForm.serviceId || !newForm.bookingDate || !newForm.slotTime) {
      setError('Choose service, date, and time.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await appointmentsApi.createAdmin(newForm);
      setNotice(`${response.appointment.bookingReference} booked successfully.`);
      setNewForm({ ...emptyNewAppointment, serviceId: services[0]?._id || '' });
      setNewSlots([]);
      await loadAppointments({ quiet: true });
    } catch (createError) {
      setError(createError.response?.data?.message || 'Unable to create appointment.');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action, appointment) {
    const confirmations = {
      cancel: `Cancel ${appointment.bookingReference}?`,
      noShow: `Mark ${appointment.bookingReference} as no-show?`
    };

    if (confirmations[action] && !window.confirm(confirmations[action])) return;

    const handlers = {
      checkIn: appointmentsApi.adminCheckIn,
      late: appointmentsApi.adminMarkLate,
      noShow: appointmentsApi.adminNoShow,
      cancel: appointmentsApi.cancelAdmin
    };

    setActionId(`${appointment.id}-${action}`);
    setError('');
    setNotice('');

    try {
      const response = await handlers[action](appointment.id);
      setNotice(response.message || 'Appointment updated.');
      await loadAppointments({ quiet: true });
    } catch (actionError) {
      setError(actionError.response?.data?.message || 'Unable to update appointment.');
    } finally {
      setActionId('');
    }
  }

  async function saveDetails(event) {
    event.preventDefault();
    if (!selected || !form) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await appointmentsApi.updateAdmin(selected.id, {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        serviceId: form.serviceId,
        staffId: form.staffId,
        notes: form.notes
      });
      setNotice(response.message || 'Appointment updated.');
      await loadAppointments({ quiet: true });
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save appointment.');
    } finally {
      setSaving(false);
    }
  }

  async function reschedule(event) {
    event.preventDefault();
    if (!selected || !form) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await appointmentsApi.rescheduleAdmin(selected.id, {
        serviceId: form.serviceId,
        staffId: form.staffId,
        bookingDate: form.bookingDate,
        slotTime: form.slotTime
      });
      setNotice(response.message || 'Appointment rescheduled.');
      await loadAppointments({ quiet: true });
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to reschedule appointment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Appointment Management</p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Bookings and visit history</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Review bookings, handle arrivals, update details, and resolve missed appointments.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-mist px-4 py-2 text-sm font-semibold text-ink ring-1 ring-neutral-200"
            type="button"
            onClick={() => loadAppointments()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-bold transition ${
                filter === item.value ? 'bg-ink text-white' : 'bg-mist text-neutral-700 hover:bg-white'
              }`}
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="mt-4 flex min-h-11 items-center gap-3 rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 focus-within:border-blush focus-within:ring-2 focus-within:ring-blush/20">
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
      {notice ? <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div> : null}

      <form className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200" onSubmit={createAdminAppointment}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">New Appointment</p>
            <h3 className="mt-1 text-xl font-bold text-ink">Book for a calling customer</h3>
          </div>
          <AppointmentAction icon={Plus} disabled={saving} onClick={createAdminAppointment}>
            Create Booking
          </AppointmentAction>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
            name="customerName"
            value={newForm.customerName}
            onChange={updateNewForm}
            placeholder="Customer"
          />
          <input
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
            name="customerPhone"
            value={newForm.customerPhone}
            onChange={updateNewForm}
            placeholder="Phone"
          />
          <select
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
            name="serviceId"
            value={newForm.serviceId}
            onChange={updateNewForm}
          >
            {services.map((service) => (
              <option key={service._id} value={service._id}>
                {service.name}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
            name="staffId"
            value={newForm.staffId}
            onChange={updateNewForm}
          >
            <option value="any">Any available stylist</option>
            {newEligibleStaff.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
          <input
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
            name="bookingDate"
            type="date"
            value={newForm.bookingDate}
            onChange={updateNewForm}
          />
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-mist px-3 text-sm font-semibold text-ink ring-1 ring-neutral-200"
            type="button"
            disabled={loadingNewSlots}
            onClick={loadNewSlots}
          >
            {loadingNewSlots ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarClock className="h-4 w-4" aria-hidden="true" />}
            Load Times
          </button>
          <select
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
            name="slotTime"
            value={newForm.slotTime}
            onChange={updateNewForm}
          >
            <option value="">Time</option>
            {newSlots.map((slot) => (
              <option key={slot.time} value={slot.time}>
                {slot.label}
              </option>
            ))}
          </select>
          <input
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
            name="notes"
            value={newForm.notes}
            onChange={updateNewForm}
            placeholder="Notes"
          />
        </div>
      </form>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200">
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading appointments
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState title="No appointments found" message="Try another filter or search term." />
          ) : (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                active={selected?.id === appointment.id}
                busy={Boolean(actionId)}
                onSelect={selectAppointment}
                onAction={runAction}
              />
            ))
          )}
        </div>

        <aside className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 xl:sticky xl:top-24 xl:self-start">
          {!selected || !form ? (
            <EmptyState title="Select an appointment" message="Open a booking to view details, edit, or reschedule." />
          ) : (
            <div className="grid gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blush">{selected.bookingReference}</p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{selected.customerName}</h3>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid gap-3 rounded-md bg-mist p-4 text-sm">
                <p>
                  <span className="font-bold text-ink">Service:</span> {selected.service?.name || 'Service'}
                </p>
                <p>
                  <span className="font-bold text-ink">Stylist:</span>{' '}
                  {selected.staff?.name || selected.preferredStaff?.name || 'Any stylist'}
                </p>
                <p>
                  <span className="font-bold text-ink">Booked:</span> {formatDate(selected.bookingDate)} at{' '}
                  {formatSlot(selected.slotTime)}
                </p>
                <p>
                  <span className="font-bold text-ink">Source:</span> {selected.source}
                </p>
              </div>

              <form className="grid gap-3" onSubmit={saveDetails}>
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-neutral-500">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </h4>
                <input className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush" name="customerName" value={form.customerName} onChange={updateForm} placeholder="Customer name" />
                <input className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush" name="customerPhone" value={form.customerPhone} onChange={updateForm} placeholder="Phone" />
                <input className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush" name="customerEmail" value={form.customerEmail} onChange={updateForm} placeholder="Email optional" />
                <select className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush" name="serviceId" value={form.serviceId} onChange={updateForm}>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <select className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush" name="staffId" value={form.staffId} onChange={updateForm}>
                  <option value="any">Any available stylist</option>
                  {eligibleStaff.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <textarea className="min-h-24 rounded-md border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-blush" name="notes" value={form.notes} onChange={updateForm} placeholder="Notes" />
                <AppointmentAction icon={Save} disabled={saving} onClick={saveDetails}>
                  Save Details
                </AppointmentAction>
              </form>

              <form className="grid gap-3 border-t border-neutral-200 pt-5" onSubmit={reschedule}>
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-neutral-500">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Reschedule
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush" name="bookingDate" type="date" value={form.bookingDate} onChange={updateForm} />
                  <input className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush" name="slotTime" type="time" value={form.slotTime} onChange={updateForm} />
                </div>
                <AppointmentAction icon={RotateCcw} tone="mist" disabled={saving} onClick={reschedule}>
                  Reschedule
                </AppointmentAction>
              </form>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

export default AdminAppointmentsPage;
