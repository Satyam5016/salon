function PageHero({ eyebrow, image, title, text }) {
  return (
    <section className="relative overflow-hidden bg-plum text-white">
      <img className="absolute inset-0 h-full w-full object-cover opacity-50" src={image} alt="" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-plum/80 to-rosewood/25" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ivory to-transparent" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-[4.5rem] sm:px-6 sm:py-24 lg:px-8">
        <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-champagne ring-1 ring-white/15 backdrop-blur">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-normal sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{text}</p>
      </div>
    </section>
  );
}

export default PageHero;
