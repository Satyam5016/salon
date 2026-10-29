import {
  BadgePercent,
  CalendarDays,
  ContactRound,
  GalleryHorizontalEnd,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Scissors,
  Settings,
  UserPlus,
  UsersRound
} from 'lucide-react';

export const adminNavItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Live Queue', href: '/admin/queue', icon: ListOrdered },
  { label: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
  { label: 'Walk-ins', href: '/admin/walk-ins', icon: UserPlus },
  { label: 'Services', href: '/admin/services', icon: Scissors },
  { label: 'Staff', href: '/admin/staff', icon: UsersRound },
  { label: 'Customers', href: '/admin/customers', icon: ContactRound },
  { label: 'Offers', href: '/admin/offers', icon: BadgePercent },
  { label: 'Gallery', href: '/admin/gallery', icon: GalleryHorizontalEnd },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Logout', action: 'logout', icon: LogOut }
];
