import { CheckCircle2, LoaderCircle, Plus, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { appointmentsApi } from '../services/appointmentsApi.js';
import { servicesApi } from '../services/servicesApi.js';
import { staffApi } from '../services/staffApi.js';

const initialForm = {
  customerName: '',
  customerPhone: '',
  serviceId: '',
  staffId: 'any'
};

function getId(record) {
  return record?._id || record?.id || '';
}

function staffIdsForService(service) {
  return (service?.availableStaff || []).map((member) => (typeof member === 'string' ? member : getId(member)));
}

function AdminWalkInsPage() {
  const [form, setForm] = useState(initialForm);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [addedAppointment, setAddedAppointment] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([servicesApi.listAdmin(), staffApi.listAdmin()])
      .then(([servicesResponse, staffResponse]) => {
        if (!active) return;
        const activeServices = servicesResponse.services.filter((service) => service.active);
        setServices(activeServices);
        setStaff(staffResponse.staff.filter((member) => member.active));
        setForm((current) => ({ ...current, serviceId: getId(activeServices[0]) || '' }));
      })
      .catch(() => {
        if (active) setError('Unable to load walk-in options.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedService = useMemo(
    () => services.find((service) => getId(service) === form.serviceId),
    [form.serviceId, services]
  );

  const eligibleStaff = useMemo(() => {
    if (!selectedService) return [];
    const ids = staffIdsForService(selectedService);
    return staff.filter((member) => ids.includes(getId(member)));
  }, [selectedService, staff]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'serviceId') next.staffId = 'any';
      return next;
    });
    setError('');
    setAddedAppointment(null);
  }

  function validate() {
    if (!form.customerName.trim()) return 'Customer name is required.';
    if (!form.customerPhone.trim()) return 'Phone number is required.';
    if (!form.serviceId) return 'Choose a service.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    setAddedAppointment(null);

    try {
      const { appointment } = await appointmentsApi.createWalkIn(form);
      setAddedAppointment(appointment);
      setForm((current) => ({
        ...initialForm,
        serviceId: current.serviceId,
        staffId: 'any'
      }));
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to add walk-in customer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Walk-ins</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Add customer to live queue</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Walk-ins are stored as appointments with source walk-in and join the same queue as online bookings.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md bg-mist px-4 py-3 text-sm font-semibold text-sage">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Reception entry
        </span>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6" onSubmit={handleSubmit}>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink">Walk-in details</h3>
            <p className="mt-1 text-sm text-neutral-500">Add the guest as arrived immediately.</p>
          </div>

          {error ? (
            <div className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <LoaderCircle className="h-6 w-6 animate-spin text-blush" aria-label="Loading walk-in form" />
            </div>
          ) : (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Customer Name
                <input
                  className="min-h-12 rounded-md border border-neutral-300 px-4 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Customer name"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Phone
                <input
                  className="min-h-12 rounded-md border border-neutral-300 px-4 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Service
                <select
                  className="min-h-12 rounded-md border border-neutral-300 px-4 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                  name="serviceId"
                  value={form.serviceId}
                  onChange={handleChange}
                >
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name} · ₹{service.price} · {service.durationMinutes} min
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Preferred Stylist
                <select
                  className="min-h-12 rounded-md border border-neutral-300 px-4 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                  name="staffId"
                  value={form.staffId}
                  onChange={handleChange}
                >
                  <option value="any">Any available stylist</option>
                  {eligibleStaff.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blush px-5 py-3 text-sm font-bold text-white transition hover:bg-rosewood disabled:opacity-70"
                type="submit"
                disabled={saving}
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                {saving ? 'Adding...' : 'Add to Queue'}
              </button>
            </div>
          )}
        </form>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          {addedAppointment ? (
            <div>
              <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden="true" />
              <h3 className="mt-4 text-2xl font-bold text-ink">Added to queue</h3>
              <p className="mt-2 text-sm text-neutral-600">This walk-in now shares the same queue as online bookings.</p>

              <div className="mt-6 grid gap-3 rounded-lg bg-mist p-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Booking ID</span>
                  <span className="text-right font-bold text-blush">{addedAppointment.bookingReference}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Customer</span>
                  <span className="text-right font-bold text-ink">{addedAppointment.customerName}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Service</span>
                  <span className="text-right font-bold text-ink">{addedAppointment.service.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Status</span>
                  <span className="text-right font-bold uppercase text-ink">{addedAppointment.status}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-neutral-600">Queue position</span>
                  <span className="text-right font-bold text-ink">#{addedAppointment.queuePosition}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <UserPlus className="h-10 w-10 text-neutral-400" aria-hidden="true" />
              <h3 className="mt-4 text-2xl font-bold text-ink">Ready for walk-ins</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600">
                Once added, the customer is marked arrived and appears in the unified appointment queue.
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export default AdminWalkInsPage;
