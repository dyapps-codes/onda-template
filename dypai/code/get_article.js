async function main(data, { db }) {
  const slug = String(data.slug || '').trim();
  if (!slug) return { ok: false, error: 'slug required' };

  const rows = await db.query(
    'SELECT a.id, a.slug, a.title, a.excerpt, a.body, a.image_url, a.author_name, a.tags, ' +
    'a.published_at, a.view_count, a.program_id, ' +
    'p.slug AS program_slug, p.name AS program_name, p.color AS program_color, ' +
    'h.name AS host_name, h.photo_url AS host_photo, h.slug AS host_slug, h.role AS host_role ' +
    'FROM public.articles a ' +
    'LEFT JOIN public.programs p ON p.id = a.program_id ' +
    'LEFT JOIN public.hosts h ON h.id = a.author_host_id ' +
    "WHERE a.slug = $1 AND a.status = 'published' AND a.published_at <= now() LIMIT 1",
    [slug],
  );
  const article = rows[0];
  if (!article) return { ok: false, error: 'Article not found' };

  await db.query('UPDATE public.articles SET view_count = view_count + 1 WHERE id = $1::uuid', [article.id]);

  const related = await db.query(
    'SELECT id, slug, title, excerpt, image_url, published_at FROM public.articles ' +
    "WHERE status = 'published' AND id <> $1::uuid AND published_at <= now() " +
    'AND (program_id = $2::uuid OR ($2::uuid IS NULL AND tags ?| ' +
    '   COALESCE((SELECT array_agg(t)::text[] FROM jsonb_array_elements_text($3::jsonb) t), ARRAY[]::text[]))) ' +
    'ORDER BY published_at DESC LIMIT 4',
    [article.id, article.program_id, JSON.stringify(article.tags || [])],
  );

  return { ok: true, article: article, related: related };
}
