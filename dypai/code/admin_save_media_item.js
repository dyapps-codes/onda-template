const VALID_KINDS = ['audio', 'video', 'youtube', 'spotify', 'embed'];

async function main(data, { db }) {
  if (data.delete && data.id) {
    const r = await db.query('DELETE FROM public.media_items WHERE id = $1::uuid RETURNING id', [String(data.id)]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const title = String(data.title || '').trim();
  const url = String(data.url || '').trim();
  if (!title) throw new Error('Title required');
  if (!url) throw new Error('URL required');
  const kind = VALID_KINDS.includes(data.kind) ? data.kind : 'audio';
  const description = data.description ? String(data.description).trim() : null;
  const thumb = data.thumbnail_url ? String(data.thumbnail_url).trim() : null;
  const duration = data.duration_seconds ? Math.max(0, Math.floor(Number(data.duration_seconds))) : null;
  const programId = data.program_id ? String(data.program_id).trim() : null;
  const hostId = data.host_id ? String(data.host_id).trim() : null;
  const isFeatured = Boolean(data.is_featured);
  const sortOrder = Number.isFinite(Number(data.sort_order)) ? Math.floor(Number(data.sort_order)) : 0;
  const publishedAt = data.published_at ? new Date(String(data.published_at)) : new Date();

  if (data.id) {
    const rows = await db.query(
      'UPDATE public.media_items SET kind=$1, title=$2, description=$3, url=$4, thumbnail_url=$5, ' +
      'duration_seconds=$6, program_id=$7::uuid, host_id=$8::uuid, is_featured=$9, sort_order=$10, published_at=$11 ' +
      'WHERE id=$12::uuid RETURNING *',
      [kind, title, description, url, thumb, duration, programId, hostId, isFeatured, sortOrder, publishedAt.toISOString(), String(data.id)],
    );
    if (!rows[0]) throw new Error('Media item not found');
    return { ok: true, media: rows[0] };
  }

  const rows = await db.query(
    'INSERT INTO public.media_items (kind, title, description, url, thumbnail_url, duration_seconds, program_id, host_id, is_featured, sort_order, published_at) ' +
    'VALUES ($1,$2,$3,$4,$5,$6,$7::uuid,$8::uuid,$9,$10,$11) RETURNING *',
    [kind, title, description, url, thumb, duration, programId, hostId, isFeatured, sortOrder, publishedAt.toISOString()],
  );
  return { ok: true, media: rows[0] };
}
