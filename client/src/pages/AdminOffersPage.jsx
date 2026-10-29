import { ImagePlus, LoaderCircle, Pencil, Plus, Power, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '../components/admin/dashboard/EmptyState.jsx';
import { useToast } from '../components/ui/toastContext.js';
import { offersApi } from '../services/offersApi.js';

const emptyForm = {
  title: '',
  value: '',
  detail: '',
  expires: '',
  image: '',
  sortOrder: 0,
  active: true
};

function AdminOffersPage() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadOffers() {
    setLoading(true);
    setError('');
    try {
      const response = await offersApi.listAdmin();
      setOffers(response.offers);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load offers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  function resetForm() {
    setEditingId('');
    setForm(emptyForm);
    setError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'sortOrder' ? Number(value) : value }));
  }

  function editOffer(offer) {
    setEditingId(offer._id);
    setForm({
      title: offer.title || '',
      value: offer.value || '',
      detail: offer.detail || '',
      expires: offer.expires || '',
      image: offer.image || '',
      sortOrder: offer.sortOrder || 0,
      active: offer.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveOffer(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.value.trim() || !form.detail.trim() || !form.expires.trim()) {
      setError('Title, value, detail, and expiry are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = editingId ? await offersApi.update(editingId, form) : await offersApi.create(form);
      showToast(response.message);
      resetForm();
      await loadOffers();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save offer.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleOffer(offer) {
    const response = await offersApi.updateStatus(offer._id, !offer.active);
    showToast(response.message);
    await loadOffers();
  }

  async function deleteOffer(offer) {
    if (!window.confirm(`Delete ${offer.title}?`)) return;
    const response = await offersApi.remove(offer._id);
    showToast(response.message);
    await loadOffers();
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Offers</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Manage public specials</h2>
        </div>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white" type="button" onClick={resetForm}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Offer
        </button>
      </section>

      {error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form className="grid gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200" onSubmit={saveOffer}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-ink">{editingId ? 'Edit offer' : 'Add offer'}</h3>
            {editingId ? (
              <button className="rounded-md bg-mist p-2 text-ink" type="button" aria-label="Cancel edit" onClick={resetForm}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="title" value={form.title} onChange={handleChange} placeholder="Offer title" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="value" value={form.value} onChange={handleChange} placeholder="20% off" />
          <textarea className="min-h-24 rounded-md border border-neutral-300 px-3 py-3" name="detail" value={form.detail} onChange={handleChange} placeholder="Offer details" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="expires" value={form.expires} onChange={handleChange} placeholder="Available this month" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="image" value={form.image} onChange={handleChange} placeholder="Image URL" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blush px-4 text-sm font-bold text-white" disabled={saving} type="submit">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save Offer
          </button>
        </form>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-lg bg-white p-6 text-sm font-semibold text-neutral-600 ring-1 ring-neutral-200">Loading offers...</div>
          ) : offers.length === 0 ? (
            <EmptyState title="No offers yet" message="Create the first public offer." />
          ) : (
            offers.map((offer) => (
              <article className="grid gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-neutral-200 md:grid-cols-[8rem_1fr_auto]" key={offer._id}>
                <div className="h-28 overflow-hidden rounded-md bg-mist">
                  {offer.image ? <img className="h-full w-full object-cover" src={offer.image} alt="" /> : <ImagePlus className="m-10 h-8 w-8 text-neutral-400" />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blush">{offer.value}</p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{offer.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{offer.detail}</p>
                  <p className="mt-2 text-xs font-bold text-neutral-500">{offer.expires}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-col">
                  <button className="rounded-md bg-mist p-3 text-ink" type="button" aria-label="Edit offer" onClick={() => editOffer(offer)}><Pencil className="h-4 w-4" /></button>
                  <button className="rounded-md bg-mist p-3 text-sage" type="button" aria-label="Toggle offer" onClick={() => toggleOffer(offer)}><Power className="h-4 w-4" /></button>
                  <button className="rounded-md bg-red-50 p-3 text-red-700" type="button" aria-label="Delete offer" onClick={() => deleteOffer(offer)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminOffersPage;
