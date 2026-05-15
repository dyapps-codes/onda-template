function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

const VALID_STATUSES = ['draft', 'published', 'archived'];

async function main(data, { db }) {
  if (data.delete && data.id) {
    const r = await db.query('DELETE FROM public.articles WHERE id = $1::uuid RETURNING id', [String(data.id)]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const title = String(data.title || '').trim();
  if (!title) throw new Error('Title is required');
  const slug = slugify(data.slug || title);
  const status = VALID_STATUSES.includes(data.status) ? data.status : 'draft';
  const excerpt = data.excerpt ? String(data.excerpt).trim() : null;
  const body = String(data.body || '').trim();
  const imageUrl = data.image_url ? String(data.image_url).trim() : null;
  const hostId = data.author_host_id ? String(data.author_host_id).trim() : null;
  const authorName = data.author_name ? String(data.author_name).trim() : null;
  const programId = data.program_id ? String(data.program_id).trim() : null;
  const isFeatured = Boolean(data.is_featured);
  const tags = Array.isArray(data.tags) ? data.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean) : [];
  let publishedAt = data.published_at ? new Date(String(data.published_at)) : null;
  if (publishedAt && isNaN(publishedAt.getTime())) publishedAt = null;
  if (status === 'published' && !publishedAt) publishedAt = new Date();

  if (data.id) {
    const rows = await db.query(
      'UPDATE public.articles SET title=$1, slug=$2, excerpt=$3, body=$4, image_url=$5, ' +
      'author_host_id=$6::uuid, author_name=$7, program_id=$8::uuid, status=$9, is_featured=$10, ' +
      'published_at=$11, tags=$12::jsonb WHERE id=$13::uuid RETURNING *',
      [title, slug, excerpt, body, imageUrl, hostId, authorName, programId, status, isFeatured, publishedAt ? publishedAt.toISOString() : null, JSON.stringify(tags), String(data.id)],
    );
    if (!rows[0]) throw new Error('Article not found');
    return { ok: true, article: rows[0] };
  }

  const rows = await db.query(
    'INSERT INTO public.articles (title, slug, excerpt, body, image_url, author_host_id, author_name, program_id, status, is_featured, published_at, tags) ' +
    'VALUES ($1,$2,$3,$4,$5,$6::uuid,$7,$8::uuid,$9,$10,$11,$12::jsonb) RETURNING *',
    [title, slug, excerpt, body, imageUrl, hostId, authorName, programId, status, isFeatured, publishedAt ? publishedAt.toISOString() : null, JSON.stringify(tags)],
  );
  return { ok: true, article: rows[0] };
}
