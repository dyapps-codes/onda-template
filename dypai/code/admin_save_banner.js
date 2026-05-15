async function main(data, { db }) {
  if (data.delete && data.id) {
    const r = await db.query('DELETE FROM public.banners WHERE id = $1::uuid RETURNING id', [String(data.id)]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const title = String(data.title || '').trim();
  if (!title) throw new Error('Banner title required');
  const message = data.message ? String(data.message).trim() : null;
  const linkUrl = data.link_url ? String(data.link_url).trim() : null;
  const linkLabel = data.link_label ? String(data.link_label).trim() : null;
  const imageUrl = data.image_url ? String(data.image_url).trim() : null;
  const color = data.color ? String(data.color).trim() : '#0ea5e9';
  const startsAt = data.starts_at ? new Date(String(data.starts_at)) : null;
  const endsAt = data.ends_at ? new Date(String(data.ends_at)) : null;
  const isActive = data.is_active === undefined ? true : Boolean(data.is_active);
  const sortOrder = Number.isFinite(Number(data.sort_order)) ? Math.floor(Number(data.sort_order)) : 0;

  if (data.id) {
    const rows = await db.query(
      'UPDATE public.banners SET title=$1, message=$2, link_url=$3, link_label=$4, image_url=$5, color=$6, ' +
      'starts_at=$7, ends_at=$8, is_active=$9, sort_order=$10 WHERE id=$11::uuid RETURNING *',
      [title, message, linkUrl, linkLabel, imageUrl, color, startsAt ? startsAt.toISOString() : null, endsAt ? endsAt.toISOString() : null, isActive, sortOrder, String(data.id)],
    );
    if (!rows[0]) throw new Error('Banner not found');
    return { ok: true, banner: rows[0] };
  }

  const rows = await db.query(
    'INSERT INTO public.banners (title, message, link_url, link_label, image_url, color, starts_at, ends_at, is_active, sort_order) ' +
    'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [title, message, linkUrl, linkLabel, imageUrl, color, startsAt ? startsAt.toISOString() : null, endsAt ? endsAt.toISOString() : null, isActive, sortOrder],
  );
  return { ok: true, banner: rows[0] };
}
