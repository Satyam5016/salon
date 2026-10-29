import { BadgeIndianRupee, CalendarDays, CheckCircle2, Clock3, Scissors, UserX } from 'lucide-react';

const statIcons = {
  'today-appointments': CalendarDays,
  'waiting-customers': Clock3,
  'in-service': Scissors,
  'completed-today': CheckCircle2,
  'no-shows': UserX,
  'revenue-estimate': BadgeIndianRupee
};

const toneStyles = {
  blush: 'bg-rose-50 text-blush',
  amber: 'bg-amber-50 text-amber-700',
  sage: 'bg-mist text-sage',
  emerald: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  ink: 'bg-neutral-100 text-ink'
};

function StatCard({ stat }) {
  const Icon = statIcons[stat.id] || CalendarDays;

  return (
    <article className="admin-panel p-4 transition hover:-translate-y-0.5 hover:shadow-salon sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-neutral-500">{stat.label}</p>
          <p className="mt-3 text-2xl font-bold tracking-normal text-ink sm:text-3xl">{stat.value}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneStyles[stat.tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-neutral-500">{stat.helper}</p>
    </article>
  );
}

export default StatCard;
