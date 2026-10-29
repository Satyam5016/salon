import { useEffect, useState } from 'react';
import { contactDetails as fallbackContactDetails } from '../data/contact.js';
import { settingsApi } from '../services/settingsApi.js';

function phoneHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function whatsappHref(phone, salonName) {
  const digits = phone.replace(/\D/g, '');
  const text = encodeURIComponent(`Hi ${salonName}, I'd like to book an appointment.`);
  return `https://wa.me/${digits}?text=${text}`;
}

function directionsHref(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function contactFromSettings(settings) {
  if (!settings) return fallbackContactDetails;

  return {
    salonName: settings.salonName,
    phone: settings.phone,
    phoneHref: phoneHref(settings.phone),
    whatsappHref: whatsappHref(settings.whatsapp, settings.salonName),
    directionsHref: directionsHref(settings.address),
    email: settings.email,
    address: settings.address,
    hours: [{ day: 'Daily', time: `${formatTime(settings.openingTime)} - ${formatTime(settings.closingTime)}` }]
  };
}

export function useSalonSettings() {
  const [contactDetails, setContactDetails] = useState(fallbackContactDetails);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;

    settingsApi
      .getPublic()
      .then(({ settings: salonSettings }) => {
        if (!active) return;
        setSettings(salonSettings);
        setContactDetails(contactFromSettings(salonSettings));
      })
      .catch(() => {
        if (active) setContactDetails(fallbackContactDetails);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    settings,
    contactDetails
  };
}
