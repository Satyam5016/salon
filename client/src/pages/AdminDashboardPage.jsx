import { CalendarClock, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import CurrentServiceCard from '../components/admin/dashboard/CurrentServiceCard.jsx';
import EmptyState from '../components/admin/dashboard/EmptyState.jsx';
import LoadingState from '../components/admin/dashboard/LoadingState.jsx';
import QueueItemCard from '../components/admin/dashboard/QueueItemCard.jsx';
import StatCard from '../components/admin/dashboard/StatCard.jsx';
import { dashboardStats } from '../data/admin/dashboard.js';
import { appointmentsApi } from '../services/appointmentsApi.js';
import { notificationsApi } from '../services/notificationsApi.js';
import { queueApi } from '../services/queueApi.js';
import { socket } from '../services/socketClient.js';
import { useAdminAuthStore } from '../store/useAdminAuthStore.js';

function AdminDashboardPage() {
  const { admin } = useAdminAuthStore();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState({ currentServices: [], waitingQueue: [], totals: {} });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionId, setActionId] = useState('');

  async function loadQueue() {
    setLoading(true);
    setError('');

    try {
      const { queue: liveQueue } = await queueApi.live();
      setQueue(liveQueue);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load live queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
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

      if (!('Notification' in window)) return;

      if (Notification.permission === 'granted') {
        new Notification(notification.title || 'Bliss Beauty Salon', {
          body: notification.message
        });
        if (notification.id) notificationsApi.markBrowserSent(notification.id).catch(() => {});
      }
    }

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('notification', handleNotification);
      socket.disconnect();
    };
  }, []);

  async function handleCheckIn(item) {
    setActionId(item.id);
    setError('');

    try {
      await appointmentsApi.adminCheckIn(item.id);
      await loadQueue();
    } catch (checkInError) {
      setError(checkInError.response?.data?.message || 'Unable to check in customer.');
    } finally {
      setActionId('');
    }
  }

  async function handleStartService(item) {
    setActionId(item.id);
    setError('');

    try {
      await appointmentsApi.adminStartService(item.id);
      await loadQueue();
    } catch (startError) {
      setError(startError.response?.data?.message || 'Unable to start service.');
    } finally {
      setActionId('');
    }
  }

  async function handleCompleteService(item) {
    setActionId(item.id);
    setError('');
    setNotice('');

    try {
      const result = await appointmentsApi.adminCompleteService(item.id);
      setQueue(result.queue);
      if (result.nextCustomer) {
        setNotice(`${result.nextCustomer.customerName} is next for ${result.nextCustomer.service?.name || 'service'}.`);
      }
    } catch (completeError) {
      setError(completeError.response?.data?.message || 'Unable to complete service.');
    } finally {
      setActionId('');
    }
  }

  async function runQueueAction(item, action, fallbackMessage) {
    setActionId(item.id);
    setError('');
    setNotice('');

    try {
      const result = await action(item.id);
      setQueue(result.queue);
      setNotice(result.message);
    } catch (actionError) {
      setError(actionError.response?.data?.message || fallbackMessage);
    } finally {
      setActionId('');
    }
  }

  function handleMarkLate(item) {
    runQueueAction(item, appointmentsApi.adminMarkLate, 'Unable to mark customer late.');
  }

  function handleSkip(item) {
    runQueueAction(item, appointmentsApi.adminSkip, 'Unable to skip customer.');
  }

  function handleNoShow(item) {
    runQueueAction(item, appointmentsApi.adminNoShow, 'Unable to mark customer no-show.');
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto grid max-w-[100rem] gap-6">
      <section className="admin-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-sage">Good afternoon, {admin?.name}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Today’s salon floor</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Monitor chairs, arrivals, wait times, no-shows, and estimated revenue from one reception view.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rosewood"
          type="button"
          onClick={loadQueue}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </section>

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Current Service</p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Active chairs</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-neutral-600 ring-1 ring-neutral-200">
              <CalendarClock className="h-4 w-4 text-sage" aria-hidden="true" />
              Live floor view
            </span>
          </div>

          {queue.currentServices.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {queue.currentServices.map((service) => (
                <CurrentServiceCard
                  key={service.id}
                  service={service}
                  disabled={actionId === service.id}
                  onComplete={handleCompleteService}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No active services" text="Current chair activity will appear here when a service starts." />
          )}
        </div>

        <div className="grid gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Waiting Queue</p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Next customers</h2>
          </div>

          {queue.waitingQueue.length > 0 ? (
            <div className="grid gap-3">
              {queue.waitingQueue.map((item) => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  disabled={actionId === item.id}
                  onCheckIn={handleCheckIn}
                  onStartService={handleStartService}
                  onMarkLate={handleMarkLate}
                  onSkip={handleSkip}
                  onNoShow={handleNoShow}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Queue is clear" text="Arrived, waiting, and upcoming booked customers will appear here." />
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
