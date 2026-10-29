import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Play,
  RefreshCw,
  SkipForward,
  UserCheck,
  UserX
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/admin/dashboard/EmptyState.jsx';
import StatusBadge from '../components/admin/dashboard/StatusBadge.jsx';
import { appointmentsApi } from '../services/appointmentsApi.js';
import { notificationsApi } from '../services/notificationsApi.js';
import { queueApi } from '../services/queueApi.js';
import { socket } from '../services/socketClient.js';

function formatTime(value) {
  if (!value) return 'Not set';

  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatSlot(value) {
  if (!value) return 'Not set';

  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return formatTime(date);
}

function elapsedMinutes(startTime, now) {
  if (!startTime) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(startTime).getTime()) / 60000));
}

function serviceName(item) {
  return typeof item.service === 'string' ? item.service : item.service?.name;
}

function stylistName(item) {
  return item.staff?.name || item.stylist || 'Any stylist';
}

function QueueActionButton({ children, icon, tone = 'dark', disabled, onClick }) {
  const ActionIcon = icon;
  const tones = {
    dark: 'bg-ink text-white hover:bg-rosewood shadow-sm',
    blush: 'bg-rosewood text-white hover:bg-ink shadow-sm',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100 hover:bg-amber-100',
    mist: 'bg-mist text-sage ring-1 ring-neutral-200 hover:bg-white',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-100 hover:bg-red-100'
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <ActionIcon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function InServiceCard({ item, now, busy, onComplete }) {
  return (
    <article className="admin-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-rosewood">
            {stylistName(item)} - Chair {item.queuePosition || 1}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-ink">{item.customerName}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral-600">{serviceName(item)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-mist p-3 ring-1 ring-neutral-200/70">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sage">Started</p>
          <p className="mt-1 font-bold text-ink">{formatTime(item.serviceStartTime)}</p>
        </div>
        <div className="rounded-lg bg-mist p-3 ring-1 ring-neutral-200/70">
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-sage">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Elapsed
          </p>
          <p className="mt-1 font-bold text-ink">{elapsedMinutes(item.serviceStartTime, now)} min</p>
        </div>
        <div className="rounded-lg bg-mist p-3 ring-1 ring-neutral-200/70">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sage">Remaining</p>
          <p className="mt-1 font-bold text-ink">{item.expectedRemainingMinutes ?? 0} min</p>
        </div>
      </div>

      <QueueActionButton icon={CheckCircle2} disabled={busy} onClick={() => onComplete(item)}>
        Complete
      </QueueActionButton>
    </article>
  );
}

function WaitingCard({ item, busy, onStart }) {
  return (
    <article className="admin-panel p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-blush">#{item.queuePosition}</p>
          <h3 className="mt-1 truncate text-xl font-bold text-ink">{item.customerName}</h3>
          <p className="mt-1 text-sm text-neutral-600">{serviceName(item)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4">
        <QueueActionButton icon={Play} disabled={busy} onClick={() => onStart(item)}>
          Start
        </QueueActionButton>
      </div>
    </article>
  );
}

function UpcomingCard({ item, busy, onCheckIn, onMarkLate, onSkip, onNoShow }) {
  return (
    <article className="admin-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">{item.customerName}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral-700">{formatSlot(item.slotTime)}</p>
          <p className="mt-1 text-sm text-neutral-600">{serviceName(item)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <QueueActionButton icon={UserCheck} tone="blush" disabled={busy} onClick={() => onCheckIn(item)}>
          Check In
        </QueueActionButton>
        <QueueActionButton icon={AlertTriangle} tone="amber" disabled={busy} onClick={() => onMarkLate(item)}>
          Late
        </QueueActionButton>
        <QueueActionButton icon={SkipForward} tone="mist" disabled={busy} onClick={() => onSkip(item)}>
          Skip
        </QueueActionButton>
        <QueueActionButton icon={UserX} tone="red" disabled={busy} onClick={() => onNoShow(item)}>
          No Show
        </QueueActionButton>
      </div>
    </article>
  );
}

function CompactIssueCard({ item, busy, onCheckIn, onSkip, onNoShow }) {
  return (
    <article className="admin-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink">{item.customerName}</h3>
          <p className="mt-1 text-xs text-neutral-600">
            #{item.queuePosition} · {serviceName(item)} · {item.estimatedWaitMinutes} min
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <QueueActionButton icon={UserCheck} tone="blush" disabled={busy} onClick={() => onCheckIn(item)}>
          Check In
        </QueueActionButton>
        <QueueActionButton icon={SkipForward} tone="mist" disabled={busy} onClick={() => onSkip(item)}>
          Skip
        </QueueActionButton>
        <QueueActionButton icon={UserX} tone="red" disabled={busy} onClick={() => onNoShow(item)}>
          No Show
        </QueueActionButton>
      </div>
    </article>
  );
}

function AdminQueuePage() {
  const [queue, setQueue] = useState({ currentServices: [], waitingQueue: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(new Date());

  const groupedQueue = useMemo(() => {
    const waitingAtSalon = queue.waitingQueue.filter((item) => ['arrived', 'waiting'].includes(item.status));
    const upcomingOnline = queue.waitingQueue.filter(
      (item) => ['booked', 'confirmed', 'notified'].includes(item.status) && item.source === 'online'
    );
    const lateSkipped = queue.waitingQueue.filter((item) => ['late', 'skipped'].includes(item.status));

    return { waitingAtSalon, upcomingOnline, lateSkipped };
  }, [queue.waitingQueue]);

  async function loadQueue({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    setError('');

    try {
      const { queue: liveQueue } = await queueApi.live();
      setQueue(liveQueue);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load live queue.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    socket.connect();
    socket.emit('join:admin');

    function handleQueueUpdated({ queue: liveQueue }) {
      setQueue(liveQueue);
    }

    function handleNotification(notification) {
      if (notification.type !== 'queue_next') return;

      setNotice(notification.message);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'Bliss Beauty Salon', {
          body: notification.message
        });
        if (notification.id) notificationsApi.markBrowserSent(notification.id).catch(() => {});
      }
    }

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('staff:availability', handleQueueUpdated);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('staff:availability', handleQueueUpdated);
      socket.off('notification', handleNotification);
      socket.disconnect();
    };
  }, []);

  async function runAction(item, action, fallbackMessage) {
    setActionId(item.id);
    setError('');
    setNotice('');

    try {
      const result = await action(item.id);
      if (result.queue) setQueue(result.queue);
      setNotice(result.message);
      if (result.nextCustomer) {
        setNotice(`${result.nextCustomer.customerName} is next for ${serviceName(result.nextCustomer)}.`);
      }
    } catch (actionError) {
      setError(actionError.response?.data?.message || fallbackMessage);
    } finally {
      setActionId('');
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blush" aria-label="Loading live queue" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="admin-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Live Queue</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Reception floor control</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Manage active chairs, physically waiting guests, upcoming bookings, and late arrivals from one live view.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rosewood"
          type="button"
          onClick={() => loadQueue()}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </section>

      {error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div> : null}
      {notice ? (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <section className="grid gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">In Service</p>
              <h3 className="mt-1 text-xl font-bold text-ink">{queue.currentServices.length} active chair(s)</h3>
            </div>
            {queue.currentServices.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {queue.currentServices.map((item) => (
                  <InServiceCard
                    key={item.id}
                    item={item}
                    now={now}
                    busy={actionId === item.id}
                    onComplete={(selected) => runAction(selected, appointmentsApi.adminCompleteService, 'Unable to complete service.')}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No services in progress" text="Started services will appear here with live elapsed timers." />
            )}
          </section>

          <section className="grid gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Waiting At Salon</p>
              <h3 className="mt-1 text-xl font-bold text-ink">{groupedQueue.waitingAtSalon.length} checked-in customer(s)</h3>
            </div>
            {groupedQueue.waitingAtSalon.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {groupedQueue.waitingAtSalon.map((item) => (
                  <WaitingCard
                    key={item.id}
                    item={item}
                    busy={actionId === item.id}
                    onStart={(selected) => runAction(selected, appointmentsApi.adminStartService, 'Unable to start service.')}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No one waiting at salon" text="Checked-in customers appear here before they move to a chair." />
            )}
          </section>
        </div>

        <div className="grid gap-6 content-start">
          <section className="grid gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Upcoming Online</p>
              <h3 className="mt-1 text-xl font-bold text-ink">{groupedQueue.upcomingOnline.length} scheduled booking(s)</h3>
            </div>
            {groupedQueue.upcomingOnline.length ? (
              <div className="grid gap-3">
                {groupedQueue.upcomingOnline.map((item) => (
                  <UpcomingCard
                    key={item.id}
                    item={item}
                    busy={actionId === item.id}
                    onCheckIn={(selected) => runAction(selected, appointmentsApi.adminCheckIn, 'Unable to check in customer.')}
                    onMarkLate={(selected) => runAction(selected, appointmentsApi.adminMarkLate, 'Unable to mark customer late.')}
                    onSkip={(selected) => runAction(selected, appointmentsApi.adminSkip, 'Unable to skip customer.')}
                    onNoShow={(selected) => runAction(selected, appointmentsApi.adminNoShow, 'Unable to mark customer no-show.')}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming online bookings" text="Upcoming booked customers will appear here before arrival." />
            )}
          </section>

          <section className="grid gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Late / Skipped</p>
              <h3 className="mt-1 text-xl font-bold text-ink">{groupedQueue.lateSkipped.length} needs attention</h3>
            </div>
            {groupedQueue.lateSkipped.length ? (
              <div className="grid gap-3">
                {groupedQueue.lateSkipped.map((item) => (
                  <CompactIssueCard
                    key={item.id}
                    item={item}
                    busy={actionId === item.id}
                    onCheckIn={(selected) => runAction(selected, appointmentsApi.adminCheckIn, 'Unable to check in customer.')}
                    onSkip={(selected) => runAction(selected, appointmentsApi.adminSkip, 'Unable to skip customer.')}
                    onNoShow={(selected) => runAction(selected, appointmentsApi.adminNoShow, 'Unable to mark customer no-show.')}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No late or skipped customers" text="Exceptions stay compactly separated here." />
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default AdminQueuePage;
