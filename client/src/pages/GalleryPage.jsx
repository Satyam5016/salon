import { useEffect, useState } from 'react';
import ButtonLink from '../components/public/ButtonLink.jsx';
import GalleryGrid from '../components/public/GalleryGrid.jsx';
import PageHero from '../components/public/PageHero.jsx';
import SectionHeader from '../components/public/SectionHeader.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { galleryImages as fallbackGallery } from '../data/gallery.js';
import { galleryApi } from '../services/galleryApi.js';

function GalleryPage() {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    galleryApi
      .listPublic()
      .then(({ images }) => {
        if (active) setGalleryImages(images);
      })
      .catch(() => {
        if (!active) return;
        setGalleryImages(fallbackGallery);
        setError('Showing sample gallery images while the live gallery is unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <PageHero
        eyebrow="Gallery"
        title="Inside the Bliss experience"
        text="Salon details, beauty rituals, and finished looks from our everyday guest work."
        image="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1800&q=85"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Salon moments"
          title="Details worth lingering over"
          text="A visual preview of the care, color, and calm that define Bliss Beauty Salon."
        />
        {error ? (
          <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
            {error}
          </div>
        ) : null}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard image key={index} lines={1} />
              ))}
            </div>
          ) : (
            <GalleryGrid images={galleryImages} />
          )}
        </div>
        {!loading && galleryImages.length === 0 ? (
          <div className="mt-10 rounded-lg bg-white p-6 text-center text-sm font-semibold text-neutral-600 ring-1 ring-neutral-200">
            The gallery is being refreshed.
          </div>
        ) : null}
        <div className="mt-10">
          <ButtonLink href="/book">Book Appointment</ButtonLink>
        </div>
      </section>
    </main>
  );
}

export default GalleryPage;
