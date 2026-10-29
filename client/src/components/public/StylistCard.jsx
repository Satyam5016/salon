function StylistCard({ stylist }) {
  const image = stylist.image || stylist.photo;
  const role = stylist.role || stylist.specialization;
  const specialties =
    stylist.specialties || (stylist.services || []).filter((service) => service.active !== false).map((service) => service.name);
  const bio = stylist.bio || `${stylist.name} specializes in ${role?.toLowerCase() || 'salon services'}.`;

  return (
    <article className="salon-card salon-card-hover overflow-hidden">
      <div className="relative">
        <img className="h-72 w-full object-cover" src={image} alt={stylist.name} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/55 to-transparent" aria-hidden="true" />
      </div>
      <div className="p-5">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-rosewood">{role}</p>
        <h3 className="mt-2 text-xl font-bold text-ink">{stylist.name}</h3>
        <p className="mt-3 text-sm leading-6 text-neutral-700">{bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {specialties.map((specialty) => (
            <span className="rounded-full bg-pearl px-3 py-1 text-xs font-semibold text-rosewood" key={specialty}>
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default StylistCard;
