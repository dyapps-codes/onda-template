function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

async function main(data, { db }) {
  if (data.delete && data.id) {
    const r = await db.query('DELETE FROM public.hosts WHERE id = $1::uuid RETURNING id', [String(data.id)]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const name = String(data.name || '').trim();
  if (!name) throw new Error('Host name is required');
  const slug = slugify(data.slug || name);
  const role = data.role ? String(data.role).trim() : null;
  const bio = data.bio ? String(data.bio).trim() : null;
  const photoUrl = data.photo_url ? String(data.photo_url).trim() : null;
  const social = data.social_links && typeof data.social_links === 'object' ? data.social_links : {};
  const sortOrder = Number.isFinite(Number(data.sort_order)) ? Math.floor(Number(data.sort_order)) : 0;
  const isActive = data.is_active === undefined ? true : Boolean(data.is_active);

  if (data.id) {
    const rows = await db.query(
      'UPDATE public.hosts SET name=$1, slug=$2, role=$3, bio=$4, photo_url=$5, social_links=$6::jsonb, sort_order=$7, is_active=$8 ' +
      'WHERE id=$9::uuid RETURNING *',
      [name, slug, role, bio, photoUrl, JSON.stringify(social), sortOrder, isActive, String(data.id)],
    );
    if (!rows[0]) throw new Error('Host not found');
    return { ok: true, host: rows[0] };
  }

  const rows = await db.query(
    'INSERT INTO public.hosts (name, slug, role, bio, photo_url, social_links, sort_order, is_active) ' +
    'VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8) RETURNING *',
    [name, slug, role, bio, photoUrl, JSON.stringify(social), sortOrder, isActive],
  );
  return { ok: true, host: rows[0] };
}
