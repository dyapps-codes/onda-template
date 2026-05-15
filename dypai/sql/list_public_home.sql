SELECT
  jsonb_build_object(
    'station_name', s.station_name,
    'tagline', s.tagline,
    'contact_email', s.contact_email,
    'contact_phone', s.contact_phone,
    'timezone', s.timezone,
    'locale', s.locale,
    'media_kind', s.media_kind,
    'brand_color', s.brand_color,
    'logo_url', s.logo_url,
    'hero_image_url', s.hero_image_url,
    'live_stream_url', s.live_stream_url,
    'live_stream_label', s.live_stream_label,
    'announcement', s.announcement,
    'social_links', s.social_links
  ) AS settings,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ss.id,
        'program_id', ss.program_id,
        'program_name', p.name,
        'program_slug', p.slug,
        'program_color', p.color,
        'program_image_url', p.image_url,
        'weekday', ss.weekday,
        'start_time', ss.start_time,
        'end_time', ss.end_time,
        'is_live', ss.is_live
      ) ORDER BY ss.start_time
    )
    FROM public.schedule_slots ss
    JOIN public.programs p ON p.id = ss.program_id AND p.is_active = true
    WHERE ss.weekday = (EXTRACT(ISODOW FROM (now() AT TIME ZONE s.timezone))::int % 7)
  ), '[]'::jsonb) AS today_schedule,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'slug', a.slug,
        'title', a.title,
        'excerpt', a.excerpt,
        'image_url', a.image_url,
        'author_name', COALESCE(a.author_name, h.name),
        'published_at', a.published_at,
        'tags', a.tags,
        'program_name', p.name
      ) ORDER BY a.is_featured DESC, a.published_at DESC
    )
    FROM (
      SELECT *
      FROM public.articles
      WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= now()
      ORDER BY is_featured DESC, published_at DESC
      LIMIT 6
    ) a
    LEFT JOIN public.hosts h ON h.id = a.author_host_id
    LEFT JOIN public.programs p ON p.id = a.program_id
  ), '[]'::jsonb) AS articles,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', mi.id,
        'kind', mi.kind,
        'title', mi.title,
        'description', mi.description,
        'url', mi.url,
        'thumbnail_url', mi.thumbnail_url,
        'duration_seconds', mi.duration_seconds,
        'program_name', p.name
      ) ORDER BY mi.is_featured DESC, mi.published_at DESC
    )
    FROM (
      SELECT *
      FROM public.media_items
      ORDER BY is_featured DESC, published_at DESC
      LIMIT 4
    ) mi
    LEFT JOIN public.programs p ON p.id = mi.program_id
  ), '[]'::jsonb) AS media,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'name', p.name,
        'description', p.description,
        'image_url', p.image_url,
        'color', p.color,
        'category', p.category,
        'duration_minutes', p.duration_minutes,
        'hosts', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name, 'slug', h.slug, 'photo_url', h.photo_url) ORDER BY h.sort_order)
          FROM public.program_hosts ph
          JOIN public.hosts h ON h.id = ph.host_id AND h.is_active = true
          WHERE ph.program_id = p.id
        ), '[]'::jsonb)
      )
      ORDER BY p.sort_order, p.name
    )
    FROM public.programs p
    WHERE p.is_active = true
    LIMIT 8
  ), '[]'::jsonb) AS programs,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', sp.id,
        'name', sp.name,
        'logo_url', sp.logo_url,
        'link_url', sp.link_url
      ) ORDER BY sp.sort_order, sp.name
    )
    FROM public.sponsors sp WHERE sp.is_active = true
  ), '[]'::jsonb) AS sponsors,
  (
    SELECT jsonb_build_object(
      'id', b.id,
      'title', b.title,
      'message', b.message,
      'link_url', b.link_url,
      'link_label', b.link_label,
      'image_url', b.image_url,
      'color', b.color
    )
    FROM public.banners b
    WHERE b.is_active = true
      AND (b.starts_at IS NULL OR b.starts_at <= now())
      AND (b.ends_at IS NULL OR b.ends_at > now())
    ORDER BY b.sort_order
    LIMIT 1
  ) AS banner
FROM public.settings s WHERE s.id = 1;
