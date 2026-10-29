import { ImagePlus, LoaderCircle, Pencil, Plus, Power, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '../components/admin/dashboard/EmptyState.jsx';
import { useToast } from '../components/ui/toastContext.js';
import { galleryApi } from '../services/galleryApi.js';

const emptyForm = {
  title: '',
  src: '',
  alt: '',
  category: 'Salon',
  sortOrder: 0,
  active: true
};

function AdminGalleryPage() {
  const { showToast } = useToast();
  const [images, setImages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadImages() {
    setLoading(true);
    setError('');
    try {
      const response = await galleryApi.listAdmin();
      setImages(response.images);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load gallery.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
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

  function editImage(image) {
    setEditingId(image._id);
    setForm({
      title: image.title || '',
      src: image.src || '',
      alt: image.alt || '',
      category: image.category || 'Salon',
      sortOrder: image.sortOrder || 0,
      active: image.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveImage(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.src.trim()) {
      setError('Title and image URL are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = editingId ? await galleryApi.update(editingId, form) : await galleryApi.create(form);
      showToast(response.message);
      resetForm();
      await loadImages();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save gallery image.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleImage(image) {
    const response = await galleryApi.updateStatus(image._id, !image.active);
    showToast(response.message);
    await loadImages();
  }

  async function deleteImage(image) {
    if (!window.confirm(`Delete ${image.title}?`)) return;
    const response = await galleryApi.remove(image._id);
    showToast(response.message);
    await loadImages();
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Gallery</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Manage public images</h2>
        </div>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white" type="button" onClick={resetForm}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Image
        </button>
      </section>

      {error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form className="grid gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200" onSubmit={saveImage}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-ink">{editingId ? 'Edit image' : 'Add image'}</h3>
            {editingId ? (
              <button className="rounded-md bg-mist p-2 text-ink" type="button" aria-label="Cancel edit" onClick={resetForm}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="title" value={form.title} onChange={handleChange} placeholder="Image title" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="src" value={form.src} onChange={handleChange} placeholder="Image URL" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="alt" value={form.alt} onChange={handleChange} placeholder="Alt text" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="category" value={form.category} onChange={handleChange} placeholder="Category" />
          <input className="min-h-11 rounded-md border border-neutral-300 px-3" name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blush px-4 text-sm font-bold text-white" disabled={saving} type="submit">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save Image
          </button>
        </form>

        <div className="grid gap-3 md:grid-cols-2">
          {loading ? (
            <div className="rounded-lg bg-white p-6 text-sm font-semibold text-neutral-600 ring-1 ring-neutral-200 md:col-span-2">Loading gallery...</div>
          ) : images.length === 0 ? (
            <EmptyState title="No gallery images yet" message="Add salon photos for the public gallery." />
          ) : (
            images.map((image) => (
              <article className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200" key={image._id}>
                <div className="h-52 bg-mist">
                  {image.src ? <img className="h-full w-full object-cover" src={image.src} alt={image.alt || image.title} /> : <ImagePlus className="m-16 h-8 w-8 text-neutral-400" />}
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blush">{image.category}</p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{image.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-neutral-500">{image.active ? 'Active' : 'Inactive'} · Sort {image.sortOrder}</p>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-md bg-mist p-3 text-ink" type="button" aria-label="Edit image" onClick={() => editImage(image)}><Pencil className="h-4 w-4" /></button>
                    <button className="rounded-md bg-mist p-3 text-sage" type="button" aria-label="Toggle image" onClick={() => toggleImage(image)}><Power className="h-4 w-4" /></button>
                    <button className="rounded-md bg-red-50 p-3 text-red-700" type="button" aria-label="Delete image" onClick={() => deleteImage(image)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminGalleryPage;
