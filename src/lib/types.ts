export type Settings = {
  station_name: string
  tagline: string
  contact_email: string
  contact_phone?: string | null
  timezone: string
  locale: string
  media_kind: 'radio' | 'podcast' | 'tv' | 'news'
  brand_color: string
  logo_url?: string | null
  hero_image_url?: string | null
  live_stream_url?: string | null
  live_stream_label?: string | null
  announcement?: string | null
  social_links?: Record<string, string>
  notifications_enabled?: boolean
}

export type Program = {
  id: string
  slug: string
  name: string
  description?: string | null
  image_url?: string | null
  color: string
  category?: string | null
  duration_minutes: number
  external_url?: string | null
  sort_order: number
  is_active: boolean
  hosts?: Host[]
  next_slot?: { weekday: number; start_time: string; end_time: string } | null
  slots_count?: number
}

export type Host = {
  id: string
  slug: string
  name: string
  role?: string | null
  bio?: string | null
  photo_url?: string | null
  social_links?: Record<string, string>
  sort_order: number
  is_active: boolean
  programs?: { id: string; name: string; slug: string; color?: string }[]
}

export type ScheduleSlot = {
  id: string
  program_id: string
  program_name: string
  program_slug: string
  program_color: string
  program_image_url?: string | null
  category?: string | null
  weekday: number
  start_time: string
  end_time: string
  is_live: boolean
  notes?: string | null
  hosts?: { name: string; photo_url?: string | null }[]
}

export type Article = {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  body: string
  image_url?: string | null
  author_name?: string | null
  author_host_id?: string | null
  program_id?: string | null
  program_name?: string | null
  program_slug?: string | null
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  published_at?: string | null
  view_count: number
  tags: string[]
  created_at?: string
  updated_at?: string
}

export type MediaItem = {
  id: string
  kind: 'audio' | 'video' | 'youtube' | 'spotify' | 'embed'
  title: string
  description?: string | null
  url: string
  thumbnail_url?: string | null
  duration_seconds?: number | null
  program_id?: string | null
  program_name?: string | null
  program_color?: string | null
  host_id?: string | null
  host_name?: string | null
  is_featured: boolean
  sort_order: number
  published_at?: string | null
}

export type Sponsor = {
  id: string
  name: string
  logo_url?: string | null
  link_url?: string | null
  description?: string | null
  sort_order: number
  is_active: boolean
}

export type Banner = {
  id: string
  title: string
  message?: string | null
  link_url?: string | null
  link_label?: string | null
  image_url?: string | null
  color: string
  starts_at?: string | null
  ends_at?: string | null
  is_active: boolean
  sort_order: number
}

export type ContactMessage = {
  id: string
  name: string
  email: string
  subject?: string | null
  body: string
  status: 'new' | 'read' | 'replied' | 'archived'
  internal_notes?: string | null
  replied_at?: string | null
  created_at: string
  updated_at?: string
}
