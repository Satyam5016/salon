import { LoaderCircle } from 'lucide-react';

function LoadingState({ label = 'Loading dashboard' }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-lg bg-white ring-1 ring-neutral-200">
      <div className="flex items-center gap-3 text-sm font-semibold text-ink">
        <LoaderCircle className="h-5 w-5 animate-spin text-blush" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}

export default LoadingState;
