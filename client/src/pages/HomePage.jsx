import { Award, CalendarCheck, Leaf, MapPin, ShieldCheck } from 'lucide-react';
import ButtonLink from '../components/public/ButtonLink.jsx';
import CTAGroup from '../components/public/CTAGroup.jsx';
import GalleryGrid from '../components/public/GalleryGrid.jsx';
import OfferCard from '../components/public/OfferCard.jsx';
import SectionHeader from '../components/public/SectionHeader.jsx';
import ServiceCard from '../components/public/ServiceCard.jsx';
import StylistCard from '../components/public/StylistCard.jsx';
import TestimonialCard from '../components/public/TestimonialCard.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { testimonials } from '../data/testimonials.js';
import { usePublicContent } from '../hooks/usePublicContent.js';
import { useSalonSettings } from '../hooks/useSalonSettings.js';

const whyChooseUs = [
  {
    icon: Award,
    title: 'Expert-led beauty',
    text: 'Senior stylists, colorists, and skin specialists guide every service with thoughtful consultation.'
  },
  {
    icon: Leaf,
    title: 'Healthy finish first',
    text: 'Premium formulas, gentle techniques, and aftercare advice help your results last beautifully.'
  },
  {
    icon: ShieldCheck,
    title: 'Smooth guest flow',
    text: 'Clear appointment timing, future queue visibility, and in-app updates keep visits calm and predictable.'
  }
];

function HomePage() {
  const { contactDetails } = useSalonSettings();
  const { services, staff, offers, gallery, loading, error } = usePublicContent();
  const popularServices = services.slice(0, 4);
  const featuredStaff = staff.slice(0, 3);
  const featuredOffers = offers.slice(0, 3);

  return (
    <main>
      <section className="relative overflow-hidden bg-plum text-white">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=85"
          alt="Stylist working in a premium salon"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-plum/82 to-rosewood/25" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ivory to-transparent" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl content-center px-4 py-16 sm:min-h-[calc(100vh-5rem)] sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-champagne shadow-sm ring-1 ring-white/15 backdrop-blur">
              Hair, skin, beauty, and bridal
            </p>
            <h1 className="max-w-4xl text-5xl font-bold tracking-normal sm:text-6xl lg:text-7xl">
              {contactDetails.salonName}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl">
              Premium salon care with polished styling, luminous color, restorative skin treatments, and an
              appointment experience designed around your day.
            </p>
            <div className="mt-8">
              <CTAGroup />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Popular services"
            title="Guest favorites for effortless polish"
            text="Choose a quick refresh, a complete transformation, or a calming skin ritual."
          />
          <ButtonLink className="sm:w-auto" href="/services" variant="ghost">
            View All Services
          </ButtonLink>
        </div>
        {error ? (
          <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
            {error}
          </div>
        ) : null}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} lines={2} />)
            : popularServices.map((service) => <ServiceCard key={service._id || service.id} service={service} />)}
        </div>
      </section>

      <section className="bg-mist/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Why choose us"
            title="Beauty care that feels considered"
            text="Every appointment balances technical skill, calm hospitality, and results you can maintain."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {whyChooseUs.map((item) => (
              <article className="salon-card salon-card-hover p-6" key={item.title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-pearl text-rosewood">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-700">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Special offers"
          title="Seasonal ways to glow"
          text="Limited salon packages for new guests, weekday refreshes, and event prep."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={2} />)
            : featuredOffers.map((offer) => <OfferCard key={offer._id || offer.id} offer={offer} />)}
        </div>
      </section>

      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              eyebrow="Meet our stylists"
              title="Artists with a soft touch"
              text="Our team brings technical excellence, warm consultation, and a polished eye for detail."
            />
            <ButtonLink href="/team" variant="ghost">
              Meet the Team
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard image key={index} lines={2} />)
              : featuredStaff.map((stylist) => <StylistCard key={stylist._id || stylist.id} stylist={stylist} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Gallery"
            title="A glimpse inside Bliss"
            text="Modern stations, restorative treatments, and finished looks from our salon floor."
          />
          <ButtonLink href="/gallery" variant="ghost">
            Open Gallery
          </ButtonLink>
        </div>
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard image key={index} lines={1} />
              ))}
            </div>
          ) : (
            <GalleryGrid images={gallery} limit={5} />
          )}
        </div>
      </section>

      <section className="bg-mist/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Testimonials"
            title="Guests leave glowing"
            text="A salon visit should feel easy, elevated, and worth looking forward to."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-rosewood via-plum to-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-champagne">Appointment CTA</p>
            <h2 className="mt-4 text-3xl font-bold tracking-normal sm:text-4xl">Ready for your next glow-up?</h2>
            <p className="mt-4 max-w-2xl text-white/80">
              Book your visit, call the desk, or message us on WhatsApp. We will help match you with the right service
              and stylist.
            </p>
          </div>
          <CTAGroup compact />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div className="salon-card p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-pearl text-rosewood">
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold text-ink">Location</h2>
          <p className="mt-3 text-neutral-700">{contactDetails.address}</p>
          <ButtonLink className="mt-6" href={contactDetails.directionsHref} icon={MapPin} variant="ghost">
            Get Directions
          </ButtonLink>
        </div>
        <div className="salon-card p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-mist text-sage">
            <CalendarCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold text-ink">Opening hours</h2>
          <div className="mt-4 grid gap-3">
            {contactDetails.hours.map((item) => (
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3" key={item.day}>
                <span className="font-semibold text-ink">{item.day}</span>
                <span className="text-right text-neutral-700">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
