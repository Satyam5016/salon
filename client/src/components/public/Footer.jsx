import { Instagram, Mail, MapPin, Phone, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { navLinks } from '../../data/navigation.js';
import { useSalonSettings } from '../../hooks/useSalonSettings.js';

function Footer() {
  const { contactDetails } = useSalonSettings();

  return (
    <footer className="bg-gradient-to-br from-plum via-ink to-rosewood text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-champagne ring-1 ring-white/15">
              <Scissors className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold">Bliss Beauty Salon</p>
              <p className="text-sm text-white/70">Modern beauty, thoughtful care.</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
            Premium hair, skin, and beauty services with seamless appointment booking and warm guest care.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-champagne">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            {navLinks.map((link) => (
              <Link className="transition hover:text-white" key={link.href} to={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-champagne">Contact</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            <a className="flex items-start gap-2 hover:text-white" href={contactDetails.phoneHref}>
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {contactDetails.phone}
            </a>
            <a className="flex items-start gap-2 hover:text-white" href={`mailto:${contactDetails.email}`}>
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {contactDetails.email}
            </a>
            <a className="flex items-start gap-2 hover:text-white" href={contactDetails.directionsHref}>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {contactDetails.address}
            </a>
            <a className="flex items-start gap-2 hover:text-white" href="https://www.instagram.com/">
              <Instagram className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              @blissbeautysalon
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/55">
        © 2026 Bliss Beauty Salon. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
