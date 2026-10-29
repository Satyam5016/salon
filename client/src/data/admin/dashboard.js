export const dashboardStats = [
  {
    id: 'today-appointments',
    label: "Today's appointments",
    value: 18,
    helper: '6 online, 12 confirmed',
    tone: 'blush'
  },
  {
    id: 'waiting-customers',
    label: 'Waiting customers',
    value: 4,
    helper: 'Average wait 18 min',
    tone: 'amber'
  },
  {
    id: 'in-service',
    label: 'In-service customers',
    value: 3,
    helper: 'All chairs occupied',
    tone: 'sage'
  },
  {
    id: 'completed-today',
    label: 'Completed today',
    value: 11,
    helper: '₹14,750 billed',
    tone: 'emerald'
  },
  {
    id: 'no-shows',
    label: 'No-shows',
    value: 1,
    helper: 'Grace period applied',
    tone: 'red'
  },
  {
    id: 'revenue-estimate',
    label: 'Revenue estimate',
    value: '₹24,300',
    helper: 'Projected for today',
    tone: 'ink'
  }
];

export const currentServices = [
  {
    id: 'chair-1',
    chair: 'Chair 1',
    customerName: 'Anuj',
    service: 'Haircut',
    stylist: 'Rahul',
    startedAt: '12:02 PM',
    elapsedMinutes: 14,
    status: 'in_service'
  },
  {
    id: 'chair-2',
    chair: 'Chair 2',
    customerName: 'Meera',
    service: 'Radiance Facial',
    stylist: 'Nora',
    startedAt: '11:42 AM',
    elapsedMinutes: 34,
    status: 'in_service'
  },
  {
    id: 'chair-3',
    chair: 'Chair 3',
    customerName: 'Ishaan',
    service: 'Global Hair Color',
    stylist: 'Maya',
    startedAt: '10:55 AM',
    elapsedMinutes: 81,
    status: 'in_service'
  }
];

export const waitingQueue = [
  {
    id: 'queue-1',
    position: 1,
    customerName: 'Shivam',
    service: 'Blow Dry Styling',
    bookingLabel: 'Walk-in',
    status: 'arrived',
    waitMinutes: 8
  },
  {
    id: 'queue-2',
    position: 2,
    customerName: 'Satyam',
    service: 'Signature Haircut',
    bookingLabel: '12:30 booking',
    status: 'not_arrived',
    waitMinutes: 0
  },
  {
    id: 'queue-3',
    position: 3,
    customerName: 'Rohan',
    service: 'Haircut',
    bookingLabel: '12:50 booking',
    status: 'booked',
    waitMinutes: 0
  },
  {
    id: 'queue-4',
    position: 4,
    customerName: 'Priya',
    service: 'Brow & Lash Detail',
    bookingLabel: '1:10 booking',
    status: 'confirmed',
    waitMinutes: 0
  }
];
