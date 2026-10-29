import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LoaderCircle,
  Scissors,
  UserRound
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageHero from '../components/public/PageHero.jsx';
import { services as fallbackServices } from '../data/services.js';
import { stylists as fallbackStylists } from '../data/stylists.js';
import { appointmentsApi } from '../services/appointmentsApi.js';
import { bookingApi } from '../services/bookingApi.js';
import { servicesApi } from '../services/servicesApi.js';
import { staffApi } from '../services/staffApi.js';

const steps = ['Service', 'Stylist', 'Date', 'Time', 'Details', 'Confirm'];

const initialBooking = {
  serviceId: '',
  stylistId: 'any',
  date: '',
  slotTime: '',
  customerName: '',
  customerPhone: '',
  customerEmail: ''
};

function getId(record) {
  return record?._id || record?.id || '';
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function priceLabel(service) {
  return typeof service?.price === 'number' ? `₹${service.price}` : service?.price || '₹0';
}

function durationLabel(service) {
  const duration = service?.durationMinutes || Number.parseInt(service?.duration, 10) || 0;
  return `${duration} min`;
}

function serviceStaffIds(service) {
  return (service?.availableStaff || []).map((member) => (typeof member === 'string' ? member : getId(member)));
}

function BookAppointmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [booking, setBooking] = useState(initialBooking);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([servicesApi.listPublic(), staffApi.listPublic()])
      .then(([servicesResponse, staffResponse]) => {
        if (!active) return;
        setServices(servicesResponse.services);
        setStaff(staffResponse.staff);
        setBooking((current) => ({ ...current, serviceId: getId(servicesResponse.services[0]) || '' }));
      })
      .catch(() => {
        if (!active) return;
        setServices(fallbackServices);
        setStaff(fallbackStylists);
        setBooking((current) => ({ ...current, serviceId: getId(fallbackServices[0]) || '' }));
        setError('Showing sample booking data while the API is unavailable.');
      })
      .finally(() => {
        if (active) setLoadingInitial(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedService = useMemo(
    () => services.find((service) => getId(service) === booking.serviceId),
    [booking.serviceId, services]
  );

  const eligibleStaff = useMemo(() => {
    if (!selectedService) return [];

    if (selectedService.availableStaff) {
      const ids = serviceStaffIds(selectedService);
      return staff.filter((member) => member.active !== false && ids.includes(getId(member)));
    }

    return staff;
  }, [selectedService, staff]);

  const selectedStylist = useMemo(
    () => eligibleStaff.find((member) => getId(member) === booking.stylistId),
    [eligibleStaff, booking.stylistId]
  );

  const selectedSlot = useMemo(() => slots.find((slot) => slot.time === booking.slotTime), [slots, booking.slotTime]);

  function updateBooking(nextValues) {
    setBooking((current) => ({ ...current, ...nextValues }));
    setError('');
  }

  async function loadSlots(date = booking.date) {
    if (!booking.serviceId || !date) return false;

    setLoadingSlots(true);
    setError('');

    try {
      const data = await bookingApi.availableSlots({
        serviceId: booking.serviceId,
        staffId: booking.stylistId,
        date
      });

      setSlots(data.slots || []);
      setBooking((current) => ({ ...current, slotTime: '' }));

      if (data.closed || data.slots.length === 0) {
        setError(data.reason || 'No slots are available for this date.');
        return false;
      }

      return true;
    } catch (slotError) {
      setSlots([]);
      setError(slotError.response?.data?.message || 'Unable to load available slots.');
      return false;
    } finally {
      setLoadingSlots(false);
    }
  }

  function validateStep() {
    if (currentStep === 0 && !booking.serviceId) return 'Choose a service to continue.';
    if (currentStep === 1 && !booking.stylistId) return 'Choose a stylist option to continue.';
    if (currentStep === 2) {
      if (!booking.date) return 'Choose a date to continue.';
      if (booking.date < todayIso()) return 'Past dates cannot be booked.';
    }
    if (currentStep === 3 && !booking.slotTime) return 'Choose an estimated slot to continue.';
    if (currentStep === 4) {
      if (!booking.customerName.trim()) return 'Enter your name.';
      if (!booking.customerPhone.trim()) return 'Enter your phone number.';
      if (booking.customerEmail && !/^\S+@\S+\.\S+$/.test(booking.customerEmail)) return 'Enter a valid email.';
    }
    return '';
  }

  async function goNext() {
    const validationError = validateStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep === 2) {
      const hasSlots = await loadSlots();
      if (!hasSlots) return;
    }

    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    setError('');
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
    setError('');
  }

  async function confirmBooking() {
    const validationError = validateStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { appointment } = await appointmentsApi.create({
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        serviceId: booking.serviceId,
        staffId: booking.stylistId,
        bookingDate: booking.date,
        slotTime: booking.slotTime
      });

      setConfirmedAppointment(appointment);
    } catch (bookingError) {
      setError(bookingError.response?.data?.message || 'Unable to confirm booking. Please choose another slot.');
      if (bookingError.response?.status === 409) {
        await loadSlots();
        setCurrentStep(3);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatTime(value) {
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function renderServiceStep() {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const id = getId(service);
          const selected = booking.serviceId === id;

          return (
            <button
              className={`salon-card salon-card-hover overflow-hidden text-left ring-2 ${
                selected ? 'ring-rosewood' : 'ring-neutral-200/80'
              }`}
              key={id}
              type="button"
              onClick={() => updateBooking({ serviceId: id, stylistId: 'any', slotTime: '' })}
            >
              <img
                className="h-40 w-full object-cover"
                src={
                  service.image ||
                  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80'
                }
                alt={service.name}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink">{service.name}</h3>
                  {selected ? <CheckCircle2 className="h-5 w-5 text-blush" aria-hidden="true" /> : null}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">{service.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-champagne/70 pt-3 text-sm font-bold">
                  <span className="text-rosewood">{priceLabel(service)}</span>
                  <span className="inline-flex items-center gap-1 text-neutral-600">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {durationLabel(service)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  function renderStylistStep() {
    return (
      <div className="grid gap-4">
        <button
          className={`salon-card p-4 text-left ring-2 transition ${
            booking.stylistId === 'any' ? 'ring-rosewood' : 'ring-neutral-200/80 hover:ring-champagne'
          }`}
          type="button"
          onClick={() => updateBooking({ stylistId: 'any', slotTime: '' })}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-pearl text-rosewood">
              <UserRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-bold text-ink">Any available stylist</h3>
              <p className="mt-1 text-sm text-neutral-600">Fastest option from eligible staff.</p>
            </div>
          </div>
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          {eligibleStaff.map((member) => {
            const id = getId(member);
            const selected = booking.stylistId === id;

            return (
              <button
                className={`salon-card salon-card-hover p-4 text-left ring-2 ${
                  selected ? 'ring-rosewood' : 'ring-neutral-200/80'
                }`}
                key={id}
                type="button"
                onClick={() => updateBooking({ stylistId: id, slotTime: '' })}
              >
                <div className="flex items-center gap-3">
                  <img
                    className="h-14 w-14 rounded-lg object-cover shadow-sm"
                    src={
                      member.photo ||
                      member.image ||
                      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={member.name}
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ink">{member.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{member.specialization || member.role}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderDateStep() {
    return (
      <div className="salon-card p-5">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Choose date
          <input
            className="salon-input"
            min={todayIso()}
            type="date"
            value={booking.date}
            onChange={(event) => updateBooking({ date: event.target.value, slotTime: '' })}
          />
        </label>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Closed days and fully booked days are checked before you choose a time.
        </p>
      </div>
    );
  }

  function renderTimeStep() {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-600">{booking.date}</p>
          <button className="text-sm font-bold text-blush" type="button" onClick={() => loadSlots()}>
            Refresh slots
          </button>
        </div>
        {loadingSlots ? (
          <div className="salon-card flex min-h-40 items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-blush" aria-label="Loading slots" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {slots.map((slot) => (
              <button
                className={`min-h-12 rounded-lg px-4 text-sm font-bold transition ${
                  booking.slotTime === slot.time
                    ? 'bg-rosewood text-white shadow-soft'
                    : 'bg-white text-ink ring-1 ring-neutral-200 hover:bg-pearl'
                }`}
                key={slot.time}
                type="button"
                onClick={() => updateBooking({ slotTime: slot.time })}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDetailsStep() {
    return (
      <div className="salon-card grid gap-4 p-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Name
          <input
            className="salon-input"
            value={booking.customerName}
            onChange={(event) => updateBooking({ customerName: event.target.value })}
            placeholder="Your name"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Phone
          <input
            className="salon-input"
            value={booking.customerPhone}
            onChange={(event) => updateBooking({ customerPhone: event.target.value })}
            placeholder="+91 98765 43210"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
          Email optional
          <input
            className="salon-input"
            type="email"
            value={booking.customerEmail}
            onChange={(event) => updateBooking({ customerEmail: event.target.value })}
            placeholder="you@example.com"
          />
        </label>
      </div>
    );
  }

  function renderReviewStep() {
    const rows = [
      ['Service', selectedService?.name],
      ['Stylist', booking.stylistId === 'any' ? 'Any available stylist' : selectedStylist?.name],
      ['Date', booking.date],
      ['Estimated time', selectedSlot?.label || booking.slotTime],
      ['Duration', durationLabel(selectedService)],
      ['Price', priceLabel(selectedService)]
    ];

    return (
      <div className="salon-card p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-pearl text-rosewood">
            <CalendarCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-ink">Review booking</h3>
            <p className="text-sm text-neutral-600">Confirm the details before submitting.</p>
          </div>
        </div>
        <div className="grid gap-3">
          {rows.map(([label, value]) => (
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3" key={label}>
              <span className="text-sm font-semibold text-neutral-500">{label}</span>
              <span className="text-right text-sm font-bold text-ink">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg bg-pearl p-4 ring-1 ring-champagne/70">
          <p className="font-bold text-ink">{booking.customerName}</p>
          <p className="mt-1 text-sm text-neutral-600">{booking.customerPhone}</p>
          {booking.customerEmail ? <p className="mt-1 text-sm text-neutral-600">{booking.customerEmail}</p> : null}
        </div>
      </div>
    );
  }

  function renderCurrentStep() {
    if (loadingInitial) {
      return (
        <div className="salon-card flex min-h-72 items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-blush" aria-label="Loading booking options" />
        </div>
      );
    }

    if (currentStep === 0) return renderServiceStep();
    if (currentStep === 1) return renderStylistStep();
    if (currentStep === 2) return renderDateStep();
    if (currentStep === 3) return renderTimeStep();
    if (currentStep === 4) return renderDetailsStep();
    return renderReviewStep();
  }

  return (
    <main>
      <PageHero
        eyebrow="Book appointment"
        title="Reserve your Bliss visit"
        text="Choose your service, stylist, date, and estimated time in a focused mobile-first booking flow."
        image="https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=1800&q=85"
      />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {confirmedAppointment ? (
          <div className="salon-card p-6 sm:p-10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
            <div className="text-center">
              <h2 className="mt-4 text-3xl font-bold text-ink">Appointment Confirmed</h2>
              <p className="mt-3 text-sm font-semibold text-neutral-500">Booking ID:</p>
              <p className="mt-1 text-2xl font-bold text-blush">{confirmedAppointment.bookingReference}</p>
            </div>

            <div className="mx-auto mt-8 max-w-xl rounded-lg bg-pearl p-5 ring-1 ring-champagne/70">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Service</span>
                  <span className="text-right font-bold text-ink">{confirmedAppointment.service.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Stylist</span>
                  <span className="text-right font-bold text-ink">{confirmedAppointment.staff.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Date</span>
                  <span className="text-right font-bold text-ink">{formatDate(confirmedAppointment.bookingDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Time</span>
                  <span className="text-right font-bold text-ink">{formatTime(confirmedAppointment.slotTime)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-neutral-200 pt-3">
                  <span className="font-semibold text-neutral-600">Estimated duration</span>
                  <span className="text-right font-bold text-ink">{confirmedAppointment.estimatedDuration} minutes</span>
                </div>
              </div>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-6 text-neutral-600">
              We'll update your live queue position as your appointment approaches.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="salon-card p-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {steps.map((step, index) => (
                  <div
                    className={`rounded-lg px-2 py-3 text-center text-xs font-bold ${
                      index <= currentStep ? 'bg-rosewood text-white shadow-sm' : 'bg-mist text-neutral-600'
                    }`}
                    key={step}
                  >
                    <span className="block">{index + 1}</span>
                    <span className="mt-1 block">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-rosewood text-white shadow-soft">
                <Scissors className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Step {currentStep + 1}</p>
                <h2 className="text-2xl font-bold text-ink">{steps[currentStep]}</h2>
              </div>
            </div>

            {error ? (
              <div className="rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
                {error}
              </div>
            ) : null}

            {renderCurrentStep()}

            <div className="sticky bottom-0 z-20 -mx-4 border-t border-champagne/70 bg-ivory/92 px-4 py-4 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink shadow-sm ring-1 ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  disabled={currentStep === 0}
                  onClick={goBack}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rosewood px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-ink disabled:opacity-70"
                  type="button"
                  disabled={loadingSlots || loadingInitial || submitting}
                  onClick={currentStep === steps.length - 1 ? confirmBooking : goNext}
                >
                  {loadingSlots || submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {currentStep === steps.length - 1 ? (submitting ? 'Confirming...' : 'Confirm Booking') : 'Next'}
                  {currentStep === steps.length - 1 ? null : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default BookAppointmentPage;
