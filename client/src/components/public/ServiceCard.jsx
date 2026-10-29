import { Clock, Sparkles } from 'lucide-react';

function ServiceCard({ service }) {
  const price = typeof service.price === 'number' ? `₹${service.price}` : service.price;
  const duration = service.durationMinutes ? `${service.durationMinutes} min` : service.duration;

  return (
    <article className="salon-card salon-card-hover overflow-hidden">
      {service.image ? <img className="h-44 w-full object-cover" src={service.image} alt={service.name} /> : null}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-pearl px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rosewood">
            {service.category}
          </span>
          {service.popular ? <Sparkles className="h-5 w-5 text-gold" aria-label="Popular service" /> : null}
        </div>
        <h3 className="text-xl font-bold text-ink">{service.name}</h3>
        <p className="mt-3 min-h-20 text-sm leading-6 text-neutral-700">{service.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-champagne/70 pt-4">
          <span className="text-lg font-bold text-rosewood">{price}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-sm font-semibold text-sage">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {duration}
          </span>
        </div>
      </div>
    </article>
  );
}

export default ServiceCard;
