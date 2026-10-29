import { Quote } from 'lucide-react';

function TestimonialCard({ testimonial }) {
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200">
      <Quote className="h-7 w-7 text-blush" aria-hidden="true" />
      <p className="mt-4 text-base leading-7 text-neutral-700">"{testimonial.quote}"</p>
      <div className="mt-5 border-t border-neutral-200 pt-4">
        <p className="font-bold text-ink">{testimonial.name}</p>
        <p className="text-sm text-neutral-500">{testimonial.service}</p>
      </div>
    </article>
  );
}

export default TestimonialCard;
