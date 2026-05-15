async function main(data, { db }) {
  if (data.delete && data.id) {
    const r = await db.query('DELETE FROM public.schedule_slots WHERE id = $1::uuid RETURNING id', [String(data.id)]);
    return { ok: true, deleted: Boolean(r[0]) };
  }

  const programId = String(data.program_id || '').trim();
  const weekday = Math.max(0, Math.min(6, Math.floor(Number(data.weekday) || 0)));
  const startTime = String(data.start_time || '').trim();
  const endTime = String(data.end_time || '').trim();
  const isLive = data.is_live === undefined ? true : Boolean(data.is_live);
  const notes = data.notes ? String(data.notes).trim() : null;

  if (!programId) throw new Error('program_id required');
  if (!startTime || !endTime) throw new Error('start_time and end_time required (HH:MM)');

  if (data.id) {
    const rows = await db.query(
      'UPDATE public.schedule_slots SET program_id=$1::uuid, weekday=$2, start_time=$3::time, end_time=$4::time, is_live=$5, notes=$6 ' +
      'WHERE id=$7::uuid RETURNING *',
      [programId, weekday, startTime, endTime, isLive, notes, String(data.id)],
    );
    if (!rows[0]) throw new Error('Slot not found');
    return { ok: true, slot: rows[0] };
  }

  const rows = await db.query(
    'INSERT INTO public.schedule_slots (program_id, weekday, start_time, end_time, is_live, notes) ' +
    'VALUES ($1::uuid, $2, $3::time, $4::time, $5, $6) RETURNING *',
    [programId, weekday, startTime, endTime, isLive, notes],
  );
  return { ok: true, slot: rows[0] };
}
