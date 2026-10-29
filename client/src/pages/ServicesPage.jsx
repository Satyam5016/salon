import { useEffect, useState } from 'react';
import CTAGroup from '../components/public/CTAGroup.jsx';
import PageHero from '../components/public/PageHero.jsx';
import SectionHeader from '../components/public/SectionHeader.jsx';
import ServiceCard from '../components/public/ServiceCard.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { services as fallbackServices } from '../data/services.js';
import { servicesApi } from '../services/servicesApi.js';

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    servicesApi
      .listPublic()
      .then(({ services: apiServices }) => {
        if (active) setServices(apiServices);
      })
      .catch(() => {
        if (active) {
          setServices(fallbackServices);
          setError('Showing sample services while the API is unavailable.');
        }
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
        eyebrow="Services"
        title="Salon services for every kind of refresh"
        text="Explore hair, color, skin, beauty, and event styling services designed for modern routines."
        image="https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1800&q=85"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Service menu"
          title="Choose your appointment"
          text="Each service begins with a consultation so the timing, finish, and aftercare feel clear."
        />
        {error ? (
          <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} lines={3} />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service._id || service.id} service={service} />
            ))}
          </div>
        )}
        {!loading && services.length === 0 ? (
          <div className="mt-10 rounded-lg bg-white p-6 text-center text-sm font-semibold text-neutral-600 ring-1 ring-neutral-200">
            The service menu is being updated.
          </div>
        ) : null}
        <div className="mt-12 rounded-lg bg-mist p-6">
          <h2 className="text-2xl font-bold text-ink">Need help choosing?</h2>
          <p className="mt-3 max-w-2xl text-neutral-700">
            Call or message us and we will recommend the best service length, stylist, and timing for your goal.
          </p>
          <div className="mt-6">
            <CTAGroup />
          </div>
        </div>
      </section>
    </main>
  );
}

export default ServicesPage;
