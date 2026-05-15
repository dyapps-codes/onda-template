async function main(data, { db }) {
  if (data.delete && data.id) {
    const r = await db.query('DELETE FROM public.sponsors WHERE id = $1::uuid RETURNING id', [String(data.id)]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const name = String(data.name || '').trim();
  if (!name) throw new Error('Sponsor name required');
  const logoUrl = data.logo_url ? String(data.logo_url).trim() : null;
  const linkUrl = data.link_url ? String(data.link_url).trim() : null;
  const description = data.description ? String(data.description).trim() : null;
  const sortOrder = Number.isFinite(Number(data.sort_order)) ? Math.floor(Number(data.sort_order)) : 0;
  const isActive = data.is_active === undefined ? true : Boolean(data.is_active);

  if (data.id) {
    const rows = await db.query(
      'UPDATE public.sponsors SET name=$1, logo_url=$2, link_url=$3, description=$4, sort_order=$5, is_active=$6 WHERE id=$7::uuid RETURNING *',
      [name, logoUrl, linkUrl, description, sortOrder, isActive, String(data.id)],
    );
    if (!rows[0]) throw new Error('Sponsor not found');
    return { ok: true, sponsor: rows[0] };
  }

  const rows = await db.query(
    'INSERT INTO public.sponsors (name, logo_url, link_url, description, sort_order, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, logoUrl, linkUrl, description, sortOrder, isActive],
  );
  return { ok: true, sponsor: rows[0] };
}
