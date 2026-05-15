async function main(data, { db }) {
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const subject = data.subject ? String(data.subject).trim() : null;
  const body = String(data.body || '').trim();

  if (!name) return { ok: false, error: 'Name is required' };
  if (!email || email.indexOf('@') < 0) return { ok: false, error: 'Valid email required' };
  if (!body || body.length < 5) return { ok: false, error: 'Message is too short' };

  const rows = await db.query(
    'INSERT INTO public.contact_messages (name, email, subject, body) ' +
    'VALUES ($1, $2, $3, $4) RETURNING id, created_at',
    [name, email, subject, body],
  );

  return { ok: true, message: 'Mensaje recibido — te contestamos pronto.', id: rows[0].id };
}
