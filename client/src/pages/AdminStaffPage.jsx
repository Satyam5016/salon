import {
  CheckCircle2,
  Clock3,
  ImagePlus,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  Save,
  Scissors,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { servicesApi } from '../services/servicesApi.js';
import { staffApi } from '../services/staffApi.js';

const workingDayOptions = [
  { label: 'Mon', value: 'monday' },
  { label: 'Tue', value: 'tuesday' },
  { label: 'Wed', value: 'wednesday' },
  { label: 'Thu', value: 'thursday' },
  { label: 'Fri', value: 'friday' },
  { label: 'Sat', value: 'saturday' },
  { label: 'Sun', value: 'sunday' }
];

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  photo: '',
  specialization: '',
  services: [],
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  workingHours: {
    start: '09:00',
    end: '18:00'
  },
  active: true
};

function serviceIds(member) {
  return (member.services || []).map((service) => (typeof service === 'string' ? service : service._id));
}

function staffToForm(member) {
  return {
    name: member.name || '',
    phone: member.phone || '',
    email: member.email || '',
    photo: member.photo || '',
    specialization: member.specialization || '',
    services: serviceIds(member),
    workingDays: member.workingDays || [],
    workingHours: {
      start: member.workingHours?.start || '09:00',
      end: member.workingHours?.end || '18:00'
    },
    active: Boolean(member.active)
  };
}

function AdminStaffPage() {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeServices = useMemo(() => services.filter((service) => service.active), [services]);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [staffResponse, servicesResponse] = await Promise.all([staffApi.listAdmin(), servicesApi.listAdmin()]);
      setStaff(staffResponse.staff);
      setServices(servicesResponse.services);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load staff.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setSuccess('');
  }

  function handleHoursChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      workingHours: {
        ...current.workingHours,
        [name]: value
      }
    }));
  }

  function toggleArrayValue(field, value) {
    setForm((current) => {
      const exists = current[field].includes(value);
      return {
        ...current,
        [field]: exists ? current[field].filter((item) => item !== value) : [...current[field], value]
      };
    });
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photo: reader.result }));
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function handleEdit(member) {
    setEditingId(member._id);
    setForm(staffToForm(member));
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validate() {
    if (!form.name.trim()) return 'Staff name is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email.';
    if (!form.specialization.trim()) return 'Specialization is required.';
    if (form.workingDays.length === 0) return 'Select at least one working day.';
    if (!form.workingHours.start || !form.workingHours.end) return 'Working hours are required.';
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
    setSuccess('');

    try {
      if (editingId) {
        await staffApi.update(editingId, form);
        setSuccess('Staff member updated successfully.');
      } else {
        await staffApi.create(form);
        setSuccess('Staff member added successfully.');
      }

      resetForm();
      await loadData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save staff member.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(member) {
    setActionId(member._id);
    setError('');

    try {
      await staffApi.updateStatus(member._id, !member.active);
      await loadData();
    } catch (statusError) {
      setError(statusError.response?.data?.message || 'Unable to update staff status.');
    } finally {
      setActionId('');
    }
  }

  async function handleDelete(member) {
    const confirmed = window.confirm(`Delete ${member.name}? This cannot be undone.`);
    if (!confirmed) return;

    setActionId(member._id);
    setError('');

    try {
      await staffApi.remove(member._id);
      await loadData();
      if (editingId === member._id) resetForm();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Unable to delete staff member.');
    } finally {
      setActionId('');
    }
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Staff Management</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Manage stylists and specialists</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Configure service eligibility, working days, hours, contact details, and active status.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-rosewood"
          type="button"
          onClick={resetForm}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Staff
        </button>
      </section>

      {error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
      {success ? (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200" onSubmit={handleSubmit}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-ink">{editingId ? 'Edit staff' : 'Add staff'}</h3>
              <p className="mt-1 text-sm text-neutral-500">Keep roster details ready for queue assignment.</p>
            </div>
            {editingId ? (
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mist text-ink"
                type="button"
                aria-label="Cancel edit"
                onClick={resetForm}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Name
              <input className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20" name="name" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Phone
              <input className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 90000 10001" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Email
              <input className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20" name="email" type="email" value={form.email} onChange={handleChange} placeholder="rahul@blissbeautysalon.com" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Specialization
              <input className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20" name="specialization" value={form.specialization} onChange={handleChange} placeholder="Haircuts and color" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
              Profile image URL
              <input className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20" name="photo" value={form.photo} onChange={handleChange} placeholder="https://..." />
            </label>
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-neutral-300 px-4 text-sm font-semibold text-neutral-600 sm:col-span-2">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Upload/select profile image
              <input className="sr-only" type="file" accept="image/*" onChange={handlePhotoUpload} />
            </label>
            {form.photo ? (
              <img className="h-44 w-full rounded-md object-cover sm:col-span-2" src={form.photo} alt="Staff preview" />
            ) : null}
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-ink">Services they can perform</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeServices.map((service) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-md bg-mist px-3 py-3 text-sm" key={service._id}>
                  <input className="mt-1 h-4 w-4 accent-blush" type="checkbox" checked={form.services.includes(service._id)} onChange={() => toggleArrayValue('services', service._id)} />
                  <span>
                    <span className="block font-bold text-ink">{service.name}</span>
                    <span className="block text-xs text-neutral-600">₹{service.price} · {service.durationMinutes} min</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-ink">Working days</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {workingDayOptions.map((day) => (
                <label className="cursor-pointer rounded-md bg-mist px-3 py-2 text-center text-sm font-bold text-ink" key={day.value}>
                  <input className="sr-only peer" type="checkbox" checked={form.workingDays.includes(day.value)} onChange={() => toggleArrayValue('workingDays', day.value)} />
                  <span className="peer-checked:text-blush">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Starting time
              <input className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20" name="start" type="time" value={form.workingHours.start} onChange={handleHoursChange} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Ending time
              <input className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20" name="end" type="time" value={form.workingHours.end} onChange={handleHoursChange} />
            </label>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-ink">
            <input className="h-4 w-4 accent-blush" type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
            Active staff member
          </label>

          <button className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blush px-4 py-2 text-sm font-semibold text-white transition hover:bg-rosewood disabled:opacity-70" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Staff'}
          </button>
        </form>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-ink">Staff roster</h3>
            <p className="mt-1 text-sm text-neutral-500">{staff.length} team members</p>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <LoaderCircle className="h-6 w-6 animate-spin text-blush" aria-label="Loading staff" />
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
              <p className="font-bold text-ink">No staff yet</p>
              <p className="mt-2 text-sm text-neutral-600">Add your first stylist using the form.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {staff.map((member) => (
                <article className="rounded-lg border border-neutral-200 p-4" key={member._id}>
                  <div className="grid gap-4 lg:grid-cols-[6rem_1fr_auto]">
                    <img className="h-24 w-full rounded-md object-cover lg:w-24" src={member.photo || 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=500&q=80'} alt={member.name} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-ink">{member.name}</h4>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${member.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {member.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-sage">{member.specialization}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-neutral-700">
                        <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4 text-sage" aria-hidden="true" />{member.phone}</span>
                        {member.email ? <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4 text-sage" aria-hidden="true" />{member.email}</span> : null}
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-sage" aria-hidden="true" />{member.workingHours?.start} - {member.workingHours?.end}</span>
                        <span className="inline-flex items-center gap-1"><Scissors className="h-4 w-4 text-sage" aria-hidden="true" />{(member.services || []).map((service) => service.name).join(', ') || 'No services'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mist text-ink transition hover:bg-white hover:ring-1 hover:ring-neutral-200" type="button" aria-label={`Edit ${member.name}`} onClick={() => handleEdit(member)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mist text-ink transition hover:bg-white hover:ring-1 hover:ring-neutral-200 disabled:opacity-60" type="button" aria-label={`${member.active ? 'Deactivate' : 'Activate'} ${member.name}`} disabled={actionId === member._id} onClick={() => handleStatus(member)}>
                        {member.active ? <Power className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      </button>
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-60" type="button" aria-label={`Delete ${member.name}`} disabled={actionId === member._id} onClick={() => handleDelete(member)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export default AdminStaffPage;
