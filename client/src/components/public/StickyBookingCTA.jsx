import { CalendarCheck, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSalonSettings } from '../../hooks/useSalonSettings.js';

function StickyBookingCTA() {
  const { contactDetails } = useSalonSettings();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-champagne/70 bg-white/95 px-3 py-2 shadow-[0_-12px_30px_rgba(33,31,34,0.12)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rosewood px-4 text-sm font-bold text-white shadow-soft"
          to="/book"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Book Appointment
        </Link>
        <a
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-soft"
          href={contactDetails.phoneHref}
          aria-label="Call Bliss Beauty Salon"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export default StickyBookingCTA;
