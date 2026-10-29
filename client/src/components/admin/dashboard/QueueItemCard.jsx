import { AlertTriangle, Bell, Clock3, MoreHorizontal, Play, SkipForward, UserCheck, UserX } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

function QueueItemCard({ item, disabled = false, onCheckIn, onStartService, onMarkLate, onSkip, onNoShow }) {
  const position = item.position || item.queuePosition;
  const bookingLabel = item.bookingLabel || (item.source === 'walk-in' ? 'Walk-in' : `${item.slotTime} booking`);
  const serviceName = typeof item.service === 'string' ? item.service : item.service?.name;
  const waitMinutes = item.waitMinutes ?? item.estimatedWaitMinutes ?? 0;
  const canCheckIn = ['booked', 'not_arrived', 'confirmed', 'notified', 'late', 'skipped'].includes(item.status);
  const canStartService = ['arrived', 'waiting'].includes(item.status);
  const canMarkLate = ['booked', 'confirmed', 'notified'].includes(item.status);
  const canSkip = ['booked', 'confirmed', 'notified', 'late', 'skipped'].includes(item.status) && !item.arrivalTime;
  const canNoShow = ['booked', 'confirmed', 'notified', 'late', 'skipped'].includes(item.status) && !item.arrivalTime;

  return (
    <article className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-neutral-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
            #{position}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-ink">{item.customerName}</h3>
            <p className="mt-1 text-sm text-neutral-600">{bookingLabel}</p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{serviceName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {waitMinutes > 0 ? `${waitMinutes} min waiting` : 'Not waiting yet'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {canCheckIn ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blush px-3 text-sm font-semibold text-white transition hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={disabled}
              onClick={() => onCheckIn?.(item)}
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              Check In
            </button>
          ) : null}
          {canStartService ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={disabled}
              onClick={() => onStartService?.(item)}
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Start Service
            </button>
          ) : null}
          {canMarkLate ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-50 px-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={disabled}
              onClick={() => onMarkLate?.(item)}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Mark Late
            </button>
          ) : null}
          {canSkip ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-mist px-3 text-sm font-semibold text-sage ring-1 ring-neutral-200 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={disabled}
              onClick={() => onSkip?.(item)}
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              Skip
            </button>
          ) : null}
          {canNoShow ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-50 px-3 text-sm font-semibold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={disabled}
              onClick={() => onNoShow?.(item)}
            >
              <UserX className="h-4 w-4" aria-hidden="true" />
              No Show
            </button>
          ) : null}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mist text-sage transition hover:bg-white hover:ring-1 hover:ring-neutral-200"
            type="button"
            aria-label={`Notify ${item.customerName}`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mist text-sage transition hover:bg-white hover:ring-1 hover:ring-neutral-200"
            type="button"
            aria-label={`Open actions for ${item.customerName}`}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default QueueItemCard;
