function SectionHeader({ align = 'left', eyebrow, title, text }) {
  const centered = align === 'center';

  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blush">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-bold tracking-normal text-ink sm:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-neutral-700 sm:text-lg">{text}</p> : null}
    </div>
  );
}

export default SectionHeader;
