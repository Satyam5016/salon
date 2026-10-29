import { Clock3, LoaderCircle, Save, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { settingsApi } from '../services/settingsApi.js';

const initialForm = {
  salonName: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  openingTime: '09:00',
  closingTime: '20:00',
  bookingIntervalMinutes: 15,
  gracePeriodMinutes: 10,
  notificationThresholdMinutes: 15,
  numberOfChairs: 3,
  timezone: 'Asia/Kolkata',
  maxAdvanceBookingDays: 30,
  selfCheckInWindowMinutes: 30,
  cancellationCutoffMinutes: 60
};

const numericFields = [
  'bookingIntervalMinutes',
  'gracePeriodMinutes',
  'notificationThresholdMinutes',
  'numberOfChairs',
  'maxAdvanceBookingDays',
  'selfCheckInWindowMinutes',
  'cancellationCutoffMinutes'
];

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}

function TextInput({ name, value, onChange, type = 'text', min }) {
  return (
    <input
      className="min-h-12 rounded-md border border-neutral-300 px-4 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
      name={name}
      type={type}
      min={min}
      value={value}
      onChange={onChange}
    />
  );
}

function AdminSettingsPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    settingsApi
      .getAdmin()
      .then(({ settings }) => {
        if (!active) return;
        setForm({ ...initialForm, ...settings });
      })
      .catch(() => {
        if (active) setError('Unable to load salon settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: numericFields.includes(name) ? Number(value) : value
    }));
    setError('');
    setNotice('');
  }

  function validate() {
    if (!form.salonName.trim()) return 'Salon name is required.';
    if (!form.phone.trim()) return 'Phone is required.';
    if (!form.whatsapp.trim()) return 'WhatsApp number is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.address.trim()) return 'Address is required.';
    if (!form.openingTime || !form.closingTime) return 'Opening and closing times are required.';
    if (form.bookingIntervalMinutes < 5) return 'Booking interval must be at least 5 minutes.';
    if (form.numberOfChairs < 1) return 'Number of chairs must be at least 1.';
    if (form.maxAdvanceBookingDays < 1) return 'Maximum advance booking days must be at least 1.';
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
    setNotice('');

    try {
      const { message, settings: updatedSettings } = await settingsApi.update(form);
      setForm({ ...initialForm, ...updatedSettings });
      setNotice(message);
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save salon settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blush" aria-label="Loading settings" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Settings</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Salon configuration</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Control booking limits, queue behavior, chair capacity, and customer-facing contact details.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md bg-mist px-4 py-3 text-sm font-semibold text-sage">
          <Settings className="h-4 w-4" aria-hidden="true" />
          MongoDB backed
        </span>
      </section>

      {error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div> : null}
      {notice ? (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
          {notice}
        </div>
      ) : null}

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h3 className="text-xl font-bold text-ink">Salon Details</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Salon name">
              <TextInput name="salonName" value={form.salonName} onChange={handleChange} />
            </Field>
            <Field label="Email">
              <TextInput name="email" type="email" value={form.email} onChange={handleChange} />
            </Field>
            <Field label="Phone">
              <TextInput name="phone" value={form.phone} onChange={handleChange} />
            </Field>
            <Field label="WhatsApp">
              <TextInput name="whatsapp" value={form.whatsapp} onChange={handleChange} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea
                  className="min-h-28 rounded-md border border-neutral-300 px-4 py-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-blush" aria-hidden="true" />
            <h3 className="text-xl font-bold text-ink">Hours And Queue Rules</h3>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Opening time">
              <TextInput name="openingTime" type="time" value={form.openingTime} onChange={handleChange} />
            </Field>
            <Field label="Closing time">
              <TextInput name="closingTime" type="time" value={form.closingTime} onChange={handleChange} />
            </Field>
            <Field label="Default timezone">
              <TextInput name="timezone" value={form.timezone} onChange={handleChange} />
            </Field>
            <Field label="Booking interval">
              <TextInput name="bookingIntervalMinutes" type="number" min="5" value={form.bookingIntervalMinutes} onChange={handleChange} />
            </Field>
            <Field label="Grace period">
              <TextInput name="gracePeriodMinutes" type="number" min="0" value={form.gracePeriodMinutes} onChange={handleChange} />
            </Field>
            <Field label="Notification threshold">
              <TextInput
                name="notificationThresholdMinutes"
                type="number"
                min="0"
                value={form.notificationThresholdMinutes}
                onChange={handleChange}
              />
            </Field>
            <Field label="Number of chairs">
              <TextInput name="numberOfChairs" type="number" min="1" value={form.numberOfChairs} onChange={handleChange} />
            </Field>
            <Field label="Max advance booking days">
              <TextInput name="maxAdvanceBookingDays" type="number" min="1" value={form.maxAdvanceBookingDays} onChange={handleChange} />
            </Field>
            <Field label="Self check-in window">
              <TextInput
                name="selfCheckInWindowMinutes"
                type="number"
                min="0"
                value={form.selfCheckInWindowMinutes}
                onChange={handleChange}
              />
            </Field>
            <Field label="Cancellation cutoff">
              <TextInput
                name="cancellationCutoffMinutes"
                type="number"
                min="0"
                value={form.cancellationCutoffMinutes}
                onChange={handleChange}
              />
            </Field>
          </div>
        </section>

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blush px-5 py-3 text-sm font-bold text-white transition hover:bg-rosewood disabled:opacity-70 sm:w-fit"
          type="submit"
          disabled={saving}
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default AdminSettingsPage;
