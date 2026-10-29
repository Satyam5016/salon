import { CalendarCheck, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSalonSettings } from '../../hooks/useSalonSettings.js';
import ButtonLink from './ButtonLink.jsx';

function CTAGroup({ compact = false }) {
  const { contactDetails } = useSalonSettings();

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2 lg:flex'}`}>
      <ButtonLink href="/book" icon={CalendarCheck}>
        Book Appointment
      </ButtonLink>
      <ButtonLink href={contactDetails.phoneHref} icon={Phone} variant="dark">
        Call Now
      </ButtonLink>
      <ButtonLink href={contactDetails.whatsappHref} icon={MessageCircle} variant="light">
        WhatsApp
      </ButtonLink>
      <ButtonLink href={contactDetails.directionsHref} icon={MapPin} variant="ghost">
        Get Directions
      </ButtonLink>
    </div>
  );
}

export default CTAGroup;
