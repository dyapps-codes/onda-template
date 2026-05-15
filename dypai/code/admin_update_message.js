const VALID = ['new', 'read', 'replied', 'archived'];

async function main(data, { db }) {
  const id = String(data.id || '').trim();
  if (!id) throw new Error('id required');

  if (data.delete) {
    const r = await db.query('DELETE FROM public.contact_messages WHERE id = $1::uuid RETURNING id', [id]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const status = data.status && VALID.includes(data.status) ? data.status : null;
  const notes = data.internal_notes !== undefined ? String(data.internal_notes || '').trim() || null : undefined;

  const sets = [];
  const values = [id];
  let idx = 2;
  if (status) {
    sets.push('status = $' + idx);
    values.push(status);
    idx += 1;
    if (status === 'replied') {
      sets.push('replied_at = COALESCE(replied_at, now())');
    }
  }
  if (notes !== undefined) {
    sets.push('internal_notes = $' + idx);
    values.push(notes);
    idx += 1;
  }
  if (sets.length === 0) throw new Error('Nothing to update');

  const rows = await db.query(
    'UPDATE public.contact_messages SET ' + sets.join(', ') + ' WHERE id = $1::uuid RETURNING *',
    values,
  );
  if (!rows[0]) throw new Error('Message not found');
  return { ok: true, message: rows[0] };
}
