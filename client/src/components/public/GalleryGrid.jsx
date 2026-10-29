function GalleryGrid({ images, limit }) {
  const visibleImages = limit ? images.slice(0, limit) : images;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visibleImages.map((image, index) => (
        <figure
          className={`group overflow-hidden rounded-lg bg-neutral-200 ${
            index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''
          }`}
          key={image._id || image.id || image.src}
        >
          <img
            className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
              index === 0 ? 'h-80 sm:h-full' : 'h-64'
            }`}
            src={image.src}
            alt={image.alt || image.title}
          />
          <figcaption className="bg-white px-4 py-3 text-sm font-semibold text-neutral-700">{image.title}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default GalleryGrid;
