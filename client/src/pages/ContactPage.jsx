import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import ButtonLink from '../components/public/ButtonLink.jsx';
import CTAGroup from '../components/public/CTAGroup.jsx';
import PageHero from '../components/public/PageHero.jsx';
import SectionHeader from '../components/public/SectionHeader.jsx';
import { useSalonSettings } from '../hooks/useSalonSettings.js';

function ContactPage() {
  const { contactDetails } = useSalonSettings();

  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title="Reach the Bliss front desk"
        text="Book, call, message, or get directions. We are here to help you plan the right appointment."
        image="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1800&q=85"
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Visit us"
            title="Come in for a calm, polished salon experience"
            text="Use the quick actions below for the fastest way to connect with the salon."
          />
          <div className="mt-8">
            <CTAGroup compact />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <Phone className="h-7 w-7 text-blush" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Phone</h2>
            <a className="mt-2 block text-neutral-700" href={contactDetails.phoneHref}>
              {contactDetails.phone}
            </a>
          </article>
          <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <MessageCircle className="h-7 w-7 text-blush" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">WhatsApp</h2>
            <a className="mt-2 block text-neutral-700" href={contactDetails.whatsappHref}>
              Message the salon
            </a>
          </article>
          <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <Mail className="h-7 w-7 text-blush" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Email</h2>
            <a className="mt-2 block break-words text-neutral-700" href={`mailto:${contactDetails.email}`}>
              {contactDetails.email}
            </a>
          </article>
          <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <MapPin className="h-7 w-7 text-blush" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Address</h2>
            <p className="mt-2 text-neutral-700">{contactDetails.address}</p>
          </article>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-mist p-6">
          <h2 className="text-2xl font-bold text-ink">Opening hours</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {contactDetails.hours.map((item) => (
              <div className="rounded-md bg-white p-4" key={item.day}>
                <p className="font-bold text-ink">{item.day}</p>
                <p className="mt-1 text-neutral-700">{item.time}</p>
              </div>
            ))}
          </div>
          <ButtonLink className="mt-6" href={contactDetails.directionsHref} icon={MapPin} variant="ghost">
            Get Directions
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;
