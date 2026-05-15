const FIELDS = [
  ['station_name', 'text'],
  ['tagline', 'text'],
  ['contact_email', 'text'],
  ['contact_phone', 'text'],
  ['timezone', 'text'],
  ['locale', 'text'],
  ['media_kind', 'text'],
  ['brand_color', 'text'],
  ['logo_url', 'text'],
  ['hero_image_url', 'text'],
  ['live_stream_url', 'text'],
  ['live_stream_label', 'text'],
  ['announcement', 'text'],
  ['social_links', 'jsonb'],
  ['notifications_enabled', 'bool'],
];

async function main(data, { db }) {
  const sets = [];
  const values = [];
  let idx = 1;

  for (const [key, kind] of FIELDS) {
    if (data[key] === undefined) continue;
    let value = data[key];
    if (kind === 'bool') value = Boolean(value);
    else if (kind === 'jsonb') value = JSON.stringify(value && typeof value === 'object' ? value : {});
    else if (typeof value === 'string') {
      value = value.trim();
      if (value === '') value = null;
    }
    sets.push(key + ' = $' + idx + (kind === 'jsonb' ? '::jsonb' : ''));
    values.push(value);
    idx += 1;
  }

  if (sets.length === 0) {
    const rows = await db.query('SELECT * FROM public.settings WHERE id = 1');
    return { ok: true, settings: rows[0] || null };
  }

  const sql = 'UPDATE public.settings SET ' + sets.join(', ') + ' WHERE id = 1 RETURNING *';
  const rows = await db.query(sql, values);
  return { ok: true, settings: rows[0] };
}
