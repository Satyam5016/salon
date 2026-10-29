import { useEffect, useState } from 'react';
import { galleryImages as fallbackGallery } from '../data/gallery.js';
import { offers as fallbackOffers } from '../data/offers.js';
import { services as fallbackServices } from '../data/services.js';
import { stylists as fallbackStylists } from '../data/stylists.js';
import { galleryApi } from '../services/galleryApi.js';
import { offersApi } from '../services/offersApi.js';
import { servicesApi } from '../services/servicesApi.js';
import { staffApi } from '../services/staffApi.js';

export function usePublicContent() {
  const [content, setContent] = useState({
    services: [],
    staff: [],
    offers: [],
    gallery: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([servicesApi.listPublic(), staffApi.listPublic(), offersApi.listPublic(), galleryApi.listPublic()])
      .then(([servicesResponse, staffResponse, offersResponse, galleryResponse]) => {
        if (!active) return;
        setContent({
          services: servicesResponse.services,
          staff: staffResponse.staff,
          offers: offersResponse.offers,
          gallery: galleryResponse.images
        });
        setError('');
      })
      .catch(() => {
        if (!active) return;
        setContent({
          services: fallbackServices,
          staff: fallbackStylists,
          offers: fallbackOffers,
          gallery: fallbackGallery
        });
        setError('Showing sample salon content while live updates are unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { ...content, loading, error };
}
