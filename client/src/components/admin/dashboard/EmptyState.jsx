import { Inbox } from 'lucide-react';

function EmptyState({ title, text }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
      <Inbox className="mx-auto h-10 w-10 text-neutral-400" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </div>
  );
}

export default EmptyState;
