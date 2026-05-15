import {
  CalendarDays,
  Image,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Radio,
  Settings,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface AppNavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

export const adminNav: AppNavItem[] = [
  { label: 'Dashboard',   href: '/admin',           icon: LayoutDashboard },
  { label: 'Programas',   href: '/admin/programs',  icon: Radio },
  { label: 'Programación',href: '/admin/schedule',  icon: CalendarDays },
  { label: 'Noticias',    href: '/admin/articles',  icon: Newspaper },
  { label: 'Multimedia',  href: '/admin/media',     icon: Image },
  { label: 'Equipo',      href: '/admin/hosts',     icon: Users },
  { label: 'Banners',     href: '/admin/banners',   icon: Sparkles },
  { label: 'Sponsors',    href: '/admin/sponsors',  icon: Star },
  { label: 'Mensajes',    href: '/admin/messages',  icon: MessageSquare },
  { label: 'Ajustes',     href: '/admin/settings',  icon: Settings },
]

export function getPageTitle(pathname: string) {
  const item = adminNav.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))
  return item?.label || 'Admin'
}
