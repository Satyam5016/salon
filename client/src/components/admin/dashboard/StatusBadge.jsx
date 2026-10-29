const statusStyles = {
  arrived: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  not_arrived: 'bg-amber-50 text-amber-700 ring-amber-100',
  booked: 'bg-sky-50 text-sky-700 ring-sky-100',
  confirmed: 'bg-violet-50 text-violet-700 ring-violet-100',
  in_service: 'bg-mist text-sage ring-green-100',
  completed: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  cancelled: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  late: 'bg-amber-50 text-amber-800 ring-amber-100',
  skipped: 'bg-orange-50 text-orange-700 ring-orange-100',
  no_show: 'bg-red-50 text-red-700 ring-red-100',
  notified: 'bg-indigo-50 text-indigo-700 ring-indigo-100'
};

const statusLabels = {
  arrived: 'ARRIVED',
  not_arrived: 'NOT ARRIVED',
  booked: 'BOOKED',
  confirmed: 'CONFIRMED',
  in_service: 'IN SERVICE',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  late: 'LATE',
  skipped: 'SKIPPED',
  no_show: 'NO SHOW',
  notified: 'NOTIFIED'
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
        statusStyles[status] || statusStyles.booked
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
}

export default StatusBadge;
