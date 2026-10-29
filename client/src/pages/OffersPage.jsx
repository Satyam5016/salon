import { useEffect, useState } from 'react';
import CTAGroup from '../components/public/CTAGroup.jsx';
import OfferCard from '../components/public/OfferCard.jsx';
import PageHero from '../components/public/PageHero.jsx';
import SectionHeader from '../components/public/SectionHeader.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { offers as fallbackOffers } from '../data/offers.js';
import { offersApi } from '../services/offersApi.js';

function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    offersApi
      .listPublic()
      .then(({ offers: apiOffers }) => {
        if (active) setOffers(apiOffers);
      })
      .catch(() => {
        if (!active) return;
        setOffers(fallbackOffers);
        setError('Showing sample offers while live salon offers are unavailable.');
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
        eyebrow="Offers"
        title="Premium beauty, thoughtfully bundled"
        text="Seasonal offers for first visits, weekday appointments, and event-ready preparation."
        image="https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=85"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Current specials"
          title="Reserve a limited offer"
          text="Availability changes quickly, so contact the salon to confirm offer timing before your visit."
        />
        {error ? (
          <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
            {error}
          </div>
        ) : null}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard image key={index} lines={2} />)
            : offers.map((offer) => <OfferCard key={offer._id || offer.id} offer={offer} />)}
        </div>
        {!loading && offers.length === 0 ? (
          <div className="mt-10 rounded-lg bg-white p-6 text-center text-sm font-semibold text-neutral-600 ring-1 ring-neutral-200">
            No offers are active right now.
          </div>
        ) : null}
        <div className="mt-12 rounded-lg bg-mist p-6">
          <CTAGroup />
        </div>
      </section>
    </main>
  );
}

export default OffersPage;
