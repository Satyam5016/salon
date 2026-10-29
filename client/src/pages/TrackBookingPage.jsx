import { Bell, CalendarClock, LoaderCircle, MapPin, RefreshCw, Search, TicketCheck, UserCheck, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageHero from '../components/public/PageHero.jsx';
import { appointmentsApi } from '../services/appointmentsApi.js';
import { bookingApi } from '../services/bookingApi.js';
import { notificationsApi } from '../services/notificationsApi.js';
import { servicesApi } from '../services/servicesApi.js';
import { socket } from '../services/socketClient.js';
import { staffApi } from '../services/staffApi.js';

const initialForm = {
  bookingReference: '',
  phone: ''
};

const initialRescheduleForm = {
  serviceId: '',
  staffId: 'any',
  bookingDate: '',
  slotTime: ''
};

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatTimeFromSlot(value) {
  if (!value) return 'Select time';
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function statusLabel(status) {
  return status.replaceAll('_', ' ').toUpperCase();
}

function getId(record) {
  return record?._id || record?.id || '';
}

function mergeNotifications(current, incoming) {
  if (!incoming?.id || current.some((notification) => notification.id === incoming.id)) return current;
  return [incoming, ...current];
}

function showBrowserNotification(notification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification(notification.title || 'Bliss Beauty Salon', {
    body: notification.message
  });
  notificationsApi.markBrowserSent(notification.id).catch(() => {});
}

function TrackBookingPage() {
  const [form, setForm] = useState(initialForm);
  const [tracking, setTracking] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [slots, setSlots] = useState([]);
  const [rescheduleForm, setRescheduleForm] = useState(initialRescheduleForm);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const eligibleStaff = useMemo(() => {
    if (!rescheduleForm.serviceId) return staff;
    return staff.filter((member) => member.services?.some((service) => getId(service) === rescheduleForm.serviceId));
  }, [rescheduleForm.serviceId, staff]);

  useEffect(() => {
    let active = true;

    Promise.all([servicesApi.listPublic(), staffApi.listPublic()])
      .then(([servicesResponse, staffResponse]) => {
        if (!active) return;
        setServices(servicesResponse.services);
        setStaff(staffResponse.staff);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!tracking?.bookingReference) return undefined;

    socket.connect();
    socket.emit('join:appointment', tracking.bookingReference);

    function handleNotification(notification) {
      if (notification.bookingReference !== tracking.bookingReference) return;

      setTracking((current) => ({
        ...current,
        status: notification.type === 'turn_available' ? 'notified' : current.status,
        liveEstimatedStart: notification.metadata?.estimatedStartTime || current.liveEstimatedStart,
        queuePosition: notification.metadata?.queuePosition ?? current.queuePosition,
        customersAhead: notification.metadata?.customersAhead ?? current.customersAhead,
        estimatedWaitingMinutes: notification.metadata?.estimatedWaitMinutes ?? current.estimatedWaitingMinutes,
        notifications: mergeNotifications(current.notifications || [], notification)
      }));
      showBrowserNotification(notification);
    }

    function handleAppointmentUpdated({ appointment, queueStatus }) {
      if (appointment.bookingReference !== tracking.bookingReference) return;

      setTracking((current) => ({
        ...current,
        status: appointment.status,
        liveEstimatedStart: queueStatus.estimatedStartTime,
        queuePosition: queueStatus.queuePosition,
        customersAhead: queueStatus.customersAhead,
        estimatedWaitingMinutes: queueStatus.estimatedWaitMinutes,
        stylist: appointment.staff || current.stylist
      }));
    }

    socket.on('notification', handleNotification);
    socket.on('appointment:updated', handleAppointmentUpdated);
    socket.on('appointment:next', handleNotification);
    socket.on('appointment:your-turn', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('appointment:updated', handleAppointmentUpdated);
      socket.off('appointment:next', handleNotification);
      socket.off('appointment:your-turn', handleNotification);
    };
  }, [tracking?.bookingReference]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setNotice('');
  }

  function handleRescheduleChange(event) {
    const { name, value } = event.target;
    setRescheduleForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'serviceId' ? { staffId: 'any', slotTime: '' } : {}),
      ...(name === 'staffId' || name === 'bookingDate' ? { slotTime: '' } : {})
    }));
    if (['serviceId', 'staffId', 'bookingDate'].includes(name)) setSlots([]);
    setError('');
    setNotice('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.bookingReference.trim() || !form.phone.trim()) {
      setError('Enter your booking ID and phone number.');
      return;
    }

    setLoading(true);
    setError('');
    setTracking(null);

    try {
      const { tracking: result } = await appointmentsApi.track({
        bookingReference: form.bookingReference,
        phone: form.phone
      });
      setTracking(result);
      setRescheduleForm({
        serviceId: result.service?.id || '',
        staffId: result.stylist?.id || 'any',
        bookingDate: new Date(result.bookingDate).toISOString().split('T')[0],
        slotTime: result.bookedTime || ''
      });
      setSlots([]);
      (result.notifications || []).forEach(showBrowserNotification);
    } catch (trackError) {
      setError(trackError.response?.data?.message || 'Unable to find booking.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelfCheckIn() {
    setCheckingIn(true);
    setError('');

    try {
      const result = await appointmentsApi.selfCheckIn({
        bookingReference: form.bookingReference,
        phone: form.phone
      });

      setTracking((current) => ({
        ...current,
        status: result.appointment.status,
        liveEstimatedStart: result.queueStatus.estimatedStartTime,
        queuePosition: result.queueStatus.queuePosition,
        customersAhead: result.queueStatus.customersAhead,
        estimatedWaitingMinutes: result.queueStatus.estimatedWaitMinutes,
        notifications: [...(result.notifications || []), ...(current.notifications || [])],
        canSelfCheckIn: false
      }));
      (result.notifications || []).forEach(showBrowserNotification);
    } catch (checkInError) {
      setError(checkInError.response?.data?.message || 'Self check-in is not available right now.');
    } finally {
      setCheckingIn(false);
    }
  }

  async function refreshTracking() {
    const { tracking: result } = await appointmentsApi.track({
      bookingReference: form.bookingReference,
      phone: form.phone
    });
    setTracking(result);
    setRescheduleForm({
      serviceId: result.service?.id || '',
      staffId: result.stylist?.id || 'any',
      bookingDate: new Date(result.bookingDate).toISOString().split('T')[0],
      slotTime: result.bookedTime || ''
    });
    return result;
  }

  async function handleCancel() {
    if (!tracking?.appointmentId || !window.confirm('Cancel this appointment?')) return;

    setMutating(true);
    setError('');
    setNotice('');

    try {
      await appointmentsApi.customerCancel(tracking.appointmentId, { phone: form.phone });
      await refreshTracking();
      setNotice('Appointment cancelled successfully.');
    } catch (cancelError) {
      setError(cancelError.response?.data?.message || 'Unable to cancel appointment.');
    } finally {
      setMutating(false);
    }
  }

  async function loadRescheduleSlots() {
    if (!rescheduleForm.serviceId || !rescheduleForm.bookingDate) {
      setError('Choose a service and date first.');
      return;
    }

    setLoadingSlots(true);
    setError('');
    setNotice('');

    try {
      const data = await bookingApi.availableSlots({
        serviceId: rescheduleForm.serviceId,
        staffId: rescheduleForm.staffId,
        date: rescheduleForm.bookingDate
      });
      setSlots(data.slots || []);
      if (data.closed || data.slots.length === 0) {
        setError(data.reason || 'No slots are available for this date.');
      }
    } catch (slotError) {
      setSlots([]);
      setError(slotError.response?.data?.message || 'Unable to load available slots.');
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleReschedule(event) {
    event.preventDefault();
    if (!tracking?.appointmentId) return;
    if (!rescheduleForm.serviceId || !rescheduleForm.bookingDate || !rescheduleForm.slotTime) {
      setError('Choose a service, date, and time.');
      return;
    }

    setMutating(true);
    setError('');
    setNotice('');

    try {
      await appointmentsApi.customerReschedule(tracking.appointmentId, {
        ...rescheduleForm,
        phone: form.phone
      });
      await refreshTracking();
      setNotice('Appointment rescheduled successfully.');
      setSlots([]);
    } catch (rescheduleError) {
      setError(rescheduleError.response?.data?.message || 'Unable to reschedule appointment.');
    } finally {
      setMutating(false);
    }
  }

  return (
    <main>
      <PageHero
        eyebrow="Track booking"
        title="Check your appointment status"
        text="Enter your booking ID and phone number to see your safe customer booking update."
        image="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1800&q=85"
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <form className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6" onSubmit={handleSubmit}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-mist text-blush">
              <TicketCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-ink">Find booking</h2>
              <p className="mt-1 text-sm text-neutral-600">Use the details from your confirmation.</p>
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mb-5 rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
              {notice}
            </div>
          ) : null}

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Booking ID
              <input
                className="min-h-12 rounded-md border border-neutral-300 px-4 font-normal uppercase outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="bookingReference"
                value={form.bookingReference}
                onChange={handleChange}
                placeholder="BLISS-2026-A83K9"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Phone number
              <input
                className="min-h-12 rounded-md border border-neutral-300 px-4 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </label>
          </div>

          <button
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blush px-5 py-3 text-sm font-bold text-white transition hover:bg-rosewood disabled:opacity-70"
            type="submit"
            disabled={loading}
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            {loading ? 'Checking...' : 'Track Booking'}
          </button>
        </form>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          {tracking ? (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Your appointment</p>
              <div className="mt-4 rounded-lg bg-mist p-5">
                <h2 className="text-3xl font-bold text-ink">{tracking.service.name}</h2>
                <p className="mt-2 text-lg font-semibold text-neutral-700">{formatTimeFromSlot(tracking.bookedTime)}</p>
                <p className="mt-1 text-sm text-neutral-600">{formatDate(tracking.bookingDate)}</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Current status</p>
                  <p className="mt-2 text-2xl font-bold text-ink">{statusLabel(tracking.status)}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Stylist</p>
                  <p className="mt-2 text-2xl font-bold text-ink">{tracking.stylist?.name || 'Assigned soon'}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Customers ahead</p>
                  <p className="mt-2 text-2xl font-bold text-ink">{tracking.customersAhead}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Estimated waiting</p>
                  <p className="mt-2 text-2xl font-bold text-ink">{tracking.estimatedWaitingMinutes} min</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-ink">Manage booking</h3>
                    <p className="mt-1 text-sm text-neutral-600">Changes are checked against salon policy and live availability.</p>
                  </div>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-red-50 px-4 py-2 text-sm font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 disabled:opacity-60"
                    type="button"
                    disabled={mutating || !tracking.canCancel}
                    onClick={handleCancel}
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </button>
                </div>

                <form className="grid gap-3" onSubmit={handleReschedule}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
                      name="serviceId"
                      value={rescheduleForm.serviceId}
                      onChange={handleRescheduleChange}
                      disabled={!tracking.canReschedule}
                    >
                      {services.map((service) => (
                        <option key={getId(service)} value={getId(service)}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
                      name="staffId"
                      value={rescheduleForm.staffId}
                      onChange={handleRescheduleChange}
                      disabled={!tracking.canReschedule}
                    >
                      <option value="any">Any available stylist</option>
                      {eligibleStaff.map((member) => (
                        <option key={getId(member)} value={getId(member)}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush"
                      name="bookingDate"
                      type="date"
                      value={rescheduleForm.bookingDate}
                      onChange={handleRescheduleChange}
                      disabled={!tracking.canReschedule}
                    />
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-mist px-4 py-2 text-sm font-bold text-ink ring-1 ring-neutral-200 disabled:opacity-60"
                      type="button"
                      disabled={loadingSlots || !tracking.canReschedule}
                      onClick={loadRescheduleSlots}
                    >
                      {loadingSlots ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                      Load Times
                    </button>
                    <select
                      className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blush sm:col-span-2"
                      name="slotTime"
                      value={rescheduleForm.slotTime}
                      onChange={handleRescheduleChange}
                      disabled={!tracking.canReschedule}
                    >
                      <option value={rescheduleForm.slotTime}>{formatTimeFromSlot(rescheduleForm.slotTime)}</option>
                      {slots.map((slot) => (
                        <option key={slot.time} value={slot.time}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 py-2 text-sm font-bold text-white transition hover:bg-rosewood disabled:opacity-60"
                    type="submit"
                    disabled={mutating || !tracking.canReschedule}
                  >
                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    Reschedule
                  </button>
                </form>
              </div>

              <div className="mt-6 rounded-lg bg-ink p-5 text-white">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-6 w-6 text-champagne" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-white/70">Estimated turn</p>
                    <p className="text-2xl font-bold">{formatDateTime(tracking.liveEstimatedStart)}</p>
                  </div>
                </div>
                {tracking.queuePosition ? (
                  <p className="mt-4 text-sm text-white/75">Queue position: #{tracking.queuePosition}</p>
                ) : null}
              </div>

              {tracking.notifications?.length ? (
                <div className="mt-6 rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blush" aria-hidden="true" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">Notifications</h3>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {tracking.notifications.slice(0, 5).map((notification) => (
                      <article className="rounded-md bg-mist p-3" key={notification.id}>
                        <p className="text-sm font-bold text-ink">{notification.title}</p>
                        <p className="mt-1 text-sm leading-6 text-neutral-700">{notification.message}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {tracking.canSelfCheckIn && !['arrived', 'waiting', 'in_service', 'completed'].includes(tracking.status) ? (
                <button
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blush px-5 py-3 text-sm font-bold text-white transition hover:bg-rosewood disabled:opacity-70"
                  type="button"
                  disabled={checkingIn}
                  onClick={handleSelfCheckIn}
                >
                  {checkingIn ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                  )}
                  {checkingIn ? 'Checking in...' : "I'm Here"}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <MapPin className="h-10 w-10 text-neutral-400" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-bold text-ink">Live booking updates appear here</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600">
                We only show information tied to your own booking ID and phone number.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default TrackBookingPage;
