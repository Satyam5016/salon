function SkeletonCard({ image = false, lines = 3 }) {
  return (
    <div className="animate-pulse rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      {image ? <div className="mb-4 h-40 rounded-md bg-neutral-200" /> : null}
      <div className="h-4 w-24 rounded bg-neutral-200" />
      <div className="mt-4 h-6 w-3/4 rounded bg-neutral-200" />
      <div className="mt-4 grid gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div className="h-3 rounded bg-neutral-200" key={index} />
        ))}
      </div>
    </div>
  );
}

export default SkeletonCard;
