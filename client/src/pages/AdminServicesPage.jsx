import {
  CheckCircle2,
  Clock3,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  Save,
  Trash2,
  UsersRound,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { servicesApi } from '../services/servicesApi.js';
import { staffApi } from '../services/staffApi.js';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  category: 'Hair',
  price: '',
  durationMinutes: '',
  image: '',
  active: true,
  availableStaff: []
};

const categories = ['Hair', 'Color', 'Skin', 'Makeup', 'Styling', 'Beauty'];

function staffIds(service) {
  return (service.availableStaff || []).map((member) => (typeof member === 'string' ? member : member._id));
}

function serviceToForm(service) {
  return {
    name: service.name || '',
    slug: service.slug || '',
    description: service.description || '',
    category: service.category || 'Hair',
    price: service.price?.toString() || '',
    durationMinutes: service.durationMinutes?.toString() || '',
    image: service.image || '',
    active: Boolean(service.active),
    availableStaff: staffIds(service)
  };
}

function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeStaff = useMemo(() => staff.filter((member) => member.active), [staff]);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [servicesResponse, staffResponse] = await Promise.all([servicesApi.listAdmin(), staffApi.listAdmin()]);
      setServices(servicesResponse.services);
      setStaff(staffResponse.staff);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load services.');
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

  function handleStaffToggle(staffId) {
    setForm((current) => {
      const exists = current.availableStaff.includes(staffId);
      return {
        ...current,
        availableStaff: exists
          ? current.availableStaff.filter((id) => id !== staffId)
          : [...current.availableStaff, staffId]
      };
    });
  }

  function handleEdit(service) {
    setEditingId(service._id);
    setForm(serviceToForm(service));
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    if (!form.name.trim()) return 'Service name is required.';
    if (!form.description.trim()) return 'Service description is required.';
    if (!form.price || Number(form.price) < 0) return 'Enter a valid price.';
    if (!form.durationMinutes || Number(form.durationMinutes) < 5) return 'Duration must be at least 5 minutes.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes)
    };

    if (!payload.slug.trim()) delete payload.slug;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await servicesApi.update(editingId, payload);
        setSuccess('Service updated successfully.');
      } else {
        await servicesApi.create(payload);
        setSuccess('Service added successfully.');
      }

      resetForm();
      await loadData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save service.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(service) {
    setActionId(service._id);
    setError('');

    try {
      await servicesApi.updateStatus(service._id, !service.active);
      await loadData();
    } catch (statusError) {
      setError(statusError.response?.data?.message || 'Unable to update service status.');
    } finally {
      setActionId('');
    }
  }

  async function handleDelete(service) {
    const confirmed = window.confirm(`Delete ${service.name}? This cannot be undone.`);
    if (!confirmed) return;

    setActionId(service._id);
    setError('');

    try {
      await servicesApi.remove(service._id);
      await loadData();
      if (editingId === service._id) resetForm();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Unable to delete service.');
    } finally {
      setActionId('');
    }
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Service Management</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Manage salon services</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Add, edit, price, deactivate, delete, and assign eligible staff for each service.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-rosewood"
          type="button"
          onClick={resetForm}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Service
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
              <h3 className="text-xl font-bold text-ink">{editingId ? 'Edit service' : 'Add service'}</h3>
              <p className="mt-1 text-sm text-neutral-500">Keep public service details accurate.</p>
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
            <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
              Service name
              <input
                className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Haircut"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Price
              <input
                className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="300"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Duration
              <input
                className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="durationMinutes"
                type="number"
                min="5"
                value={form.durationMinutes}
                onChange={handleChange}
                placeholder="20"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Category
              <select
                className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Slug
              <input
                className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="auto-generated"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
              Description
              <textarea
                className="min-h-28 rounded-md border border-neutral-300 px-3 py-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Consultation, wash, precision cut, and finish."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
              Image URL
              <input
                className="min-h-11 rounded-md border border-neutral-300 px-3 font-normal outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>

            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-neutral-300 px-4 text-sm font-semibold text-neutral-600 sm:col-span-2">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Upload/select image
              <input className="sr-only" type="file" accept="image/*" onChange={handleImageUpload} />
            </label>

            {form.image ? (
              <img className="h-40 w-full rounded-md object-cover sm:col-span-2" src={form.image} alt="Service preview" />
            ) : null}
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-ink">Eligible staff</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeStaff.map((member) => (
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-md bg-mist px-3 py-3 text-sm"
                  key={member._id}
                >
                  <input
                    className="mt-1 h-4 w-4 accent-blush"
                    type="checkbox"
                    checked={form.availableStaff.includes(member._id)}
                    onChange={() => handleStaffToggle(member._id)}
                  />
                  <span>
                    <span className="block font-bold text-ink">{member.name}</span>
                    <span className="block text-xs text-neutral-600">{member.specialization}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-ink">
            <input
              className="h-4 w-4 accent-blush"
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
            Active service
          </label>

          <button
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blush px-4 py-2 text-sm font-semibold text-white transition hover:bg-rosewood disabled:opacity-70"
            type="submit"
            disabled={saving}
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Service'}
          </button>
        </form>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-ink">Services</h3>
              <p className="mt-1 text-sm text-neutral-500">{services.length} services in catalog</p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <LoaderCircle className="h-6 w-6 animate-spin text-blush" aria-label="Loading services" />
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
              <p className="font-bold text-ink">No services yet</p>
              <p className="mt-2 text-sm text-neutral-600">Add your first salon service using the form.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => (
                <article className="rounded-lg border border-neutral-200 p-4" key={service._id}>
                  <div className="grid gap-4 lg:grid-cols-[7rem_1fr_auto]">
                    <img
                      className="h-28 w-full rounded-md object-cover lg:w-28"
                      src={service.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=500&q=80'}
                      alt={service.name}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-ink">{service.name}</h4>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            service.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {service.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">{service.description}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-neutral-700">
                        <span>₹{service.price}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-4 w-4 text-sage" aria-hidden="true" />
                          {service.durationMinutes} min
                        </span>
                        <span>{service.category}</span>
                        <span className="inline-flex items-center gap-1">
                          <UsersRound className="h-4 w-4 text-sage" aria-hidden="true" />
                          {(service.availableStaff || []).map((member) => member.name).join(', ') || 'No staff'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mist text-ink transition hover:bg-white hover:ring-1 hover:ring-neutral-200"
                        type="button"
                        aria-label={`Edit ${service.name}`}
                        onClick={() => handleEdit(service)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mist text-ink transition hover:bg-white hover:ring-1 hover:ring-neutral-200 disabled:opacity-60"
                        type="button"
                        aria-label={`${service.active ? 'Deactivate' : 'Activate'} ${service.name}`}
                        disabled={actionId === service._id}
                        onClick={() => handleStatus(service)}
                      >
                        {service.active ? <Power className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      </button>
                      <button
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        type="button"
                        aria-label={`Delete ${service.name}`}
                        disabled={actionId === service._id}
                        onClick={() => handleDelete(service)}
                      >
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

export default AdminServicesPage;
