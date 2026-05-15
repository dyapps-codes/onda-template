function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

async function main(data, { db }) {
  if (data.delete && data.id) {
    const r = await db.query('DELETE FROM public.programs WHERE id = $1::uuid RETURNING id', [String(data.id)]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const name = String(data.name || '').trim();
  if (!name) throw new Error('Program name is required');
  const slug = slugify(data.slug || name);
  if (!slug) throw new Error('Program slug is required');

  const description = data.description ? String(data.description).trim() : null;
  const imageUrl = data.image_url ? String(data.image_url).trim() : null;
  const color = data.color ? String(data.color).trim() : '#0ea5e9';
  const category = data.category ? String(data.category).trim() : null;
  const duration = Math.max(1, Math.floor(Number(data.duration_minutes) || 60));
  const externalUrl = data.external_url ? String(data.external_url).trim() : null;
  const sortOrder = Number.isFinite(Number(data.sort_order)) ? Math.floor(Number(data.sort_order)) : 0;
  const isActive = data.is_active === undefined ? true : Boolean(data.is_active);
  const hostIds = Array.isArray(data.host_ids) ? data.host_ids.filter(Boolean).map(String) : null;

  await db.query('BEGIN');
  try {
    let row;
    if (data.id) {
      const rows = await db.query(
        'UPDATE public.programs SET name=$1, slug=$2, description=$3, image_url=$4, color=$5, category=$6, ' +
        'duration_minutes=$7, external_url=$8, sort_order=$9, is_active=$10 ' +
        'WHERE id=$11::uuid RETURNING *',
        [name, slug, description, imageUrl, color, category, duration, externalUrl, sortOrder, isActive, String(data.id)],
      );
      if (!rows[0]) throw new Error('Program not found');
      row = rows[0];
    } else {
      const rows = await db.query(
        'INSERT INTO public.programs (name, slug, description, image_url, color, category, duration_minutes, external_url, sort_order, is_active) ' +
        'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
        [name, slug, description, imageUrl, color, category, duration, externalUrl, sortOrder, isActive],
      );
      row = rows[0];
    }

    if (hostIds !== null) {
      await db.query('DELETE FROM public.program_hosts WHERE program_id = $1::uuid', [row.id]);
      for (const hid of hostIds) {
        await db.query(
          'INSERT INTO public.program_hosts (program_id, host_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING',
          [row.id, hid],
        );
      }
    }

    await db.query('COMMIT');
    return { ok: true, program: row };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
