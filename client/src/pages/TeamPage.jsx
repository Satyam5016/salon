import { useEffect, useState } from 'react';
import ButtonLink from '../components/public/ButtonLink.jsx';
import PageHero from '../components/public/PageHero.jsx';
import SectionHeader from '../components/public/SectionHeader.jsx';
import StylistCard from '../components/public/StylistCard.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { stylists as fallbackStylists } from '../data/stylists.js';
import { staffApi } from '../services/staffApi.js';

function TeamPage() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    staffApi
      .listPublic()
      .then(({ staff }) => {
        if (active) setStylists(staff);
      })
      .catch(() => {
        if (active) {
          setStylists(fallbackStylists);
          setError('Showing sample team members while the API is unavailable.');
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
        eyebrow="Our team"
        title="Stylists who listen before they create"
        text="Meet the artists behind our color, cuts, skin rituals, and event-ready finishes."
        image="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1800&q=85"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Meet the artists"
          title="A calm chair, a polished result"
          text="Each stylist has a focused specialty, but the same guest-first approach."
        />
        {error ? (
          <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard image key={index} lines={2} />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {stylists.map((stylist) => (
              <StylistCard key={stylist._id || stylist.id} stylist={stylist} />
            ))}
          </div>
        )}
        {!loading && stylists.length === 0 ? (
          <div className="mt-10 rounded-lg bg-white p-6 text-center text-sm font-semibold text-neutral-600 ring-1 ring-neutral-200">
            Stylist profiles are being updated.
          </div>
        ) : null}
        <div className="mt-10">
          <ButtonLink href="/book">Book With a Stylist</ButtonLink>
        </div>
      </section>
    </main>
  );
}

export default TeamPage;
