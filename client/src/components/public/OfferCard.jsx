function OfferCard({ offer }) {
  return (
    <article className="salon-card salon-card-hover overflow-hidden bg-plum text-white ring-champagne/25">
      {offer.image ? <img className="h-44 w-full object-cover opacity-90" src={offer.image} alt="" /> : null}
      <div className="p-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-champagne">{offer.value}</p>
        <h3 className="mt-3 text-2xl font-bold">{offer.title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/75">{offer.detail}</p>
        <p className="mt-5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
          {offer.expires}
        </p>
      </div>
    </article>
  );
}

export default OfferCard;
