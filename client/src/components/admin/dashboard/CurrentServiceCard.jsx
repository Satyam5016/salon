import { CheckCircle2, Clock3, Scissors } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

function CurrentServiceCard({ service, disabled = false, onComplete }) {
  const serviceName = typeof service.service === 'string' ? service.service : service.service?.name;
  const stylistName = typeof service.stylist === 'string' ? service.stylist : service.staff?.name || service.stylist;
  const startedAt =
    service.startedAt ||
    (service.serviceStartTime
      ? new Date(service.serviceStartTime).toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : 'Not started');
  const elapsedMinutes =
    service.elapsedMinutes ??
    (service.serviceStartTime ? Math.max(0, Math.floor((Date.now() - new Date(service.serviceStartTime).getTime()) / 60000)) : 0);
  const chair = service.chair || `Chair ${service.queuePosition || 1}`;
  const customerName = service.customerName;

  return (
    <article className="admin-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-rosewood">{chair}</p>
          <h3 className="mt-2 text-2xl font-bold text-ink">{customerName}</h3>
        </div>
        <StatusBadge status={service.status} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-neutral-700">
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-sage" aria-hidden="true" />
          <span>{serviceName}</span>
        </div>
        <p>
          <span className="font-semibold text-ink">Stylist:</span> {stylistName || 'Assigned'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-mist p-3 ring-1 ring-neutral-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sage">Started</p>
            <p className="mt-1 font-bold text-ink">{startedAt}</p>
          </div>
          <div className="rounded-lg bg-mist p-3 ring-1 ring-neutral-200/70">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-sage">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Elapsed
            </p>
            <p className="mt-1 font-bold text-ink">{elapsedMinutes} min</p>
          </div>
        </div>
      </div>

      <button
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        type="button"
        disabled={disabled}
        onClick={() => onComplete?.(service)}
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Complete
      </button>
    </article>
  );
}

export default CurrentServiceCard;
