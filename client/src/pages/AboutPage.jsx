import { Heart, Sparkles, Star } from 'lucide-react';
import ButtonLink from '../components/public/ButtonLink.jsx';
import PageHero from '../components/public/PageHero.jsx';
import SectionHeader from '../components/public/SectionHeader.jsx';

const values = [
  {
    icon: Heart,
    title: 'Warm consultation',
    text: 'We begin with your routine, comfort level, and goals so every recommendation has a reason.'
  },
  {
    icon: Sparkles,
    title: 'Premium products',
    text: 'Our shelves are chosen for shine, strength, skin comfort, and reliable professional results.'
  },
  {
    icon: Star,
    title: 'Reliable finish',
    text: 'Appointments are planned with clear timing, polished styling, and practical aftercare.'
  }
];

function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About"
        title="A modern salon built around ease"
        text="Bliss Beauty Salon pairs technical beauty services with a calmer, more transparent guest experience."
        image="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1800&q=85"
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Our philosophy"
            title="Beauty should feel personal, polished, and easy to maintain"
            text="From the first consultation to the final mirror check, our goal is to make guests feel understood and cared for."
          />
          <div className="mt-8">
            <ButtonLink href="/book">Book Appointment</ButtonLink>
          </div>
        </div>
        <div className="grid gap-5">
          {values.map((value) => (
            <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200" key={value.title}>
              <value.icon className="h-7 w-7 text-blush" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-ink">{value.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">{value.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default AboutPage;
