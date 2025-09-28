import { dayjs } from '@/lib/time';

export type Busy = { start: string; end: string };
export type Cell = { start: string; end: string; idx: number; busy: boolean };

export function buildDayCells(ymd: string, opening: string, stepMin: number, busies: Busy[]) {
  const [o,c] = opening.split('-');
  const start = dayjs.tz(`${ymd}T${o}:00`, process.env.DEFAULT_TZ || 'Europe/Paris');
  const end   = dayjs.tz(`${ymd}T${c}:00`, process.env.DEFAULT_TZ || 'Europe/Paris');
  const cells: Cell[] = [];
  let idx = 0;
  for (let t = start; t.add(stepMin,'minute').isBefore(end) || t.add(stepMin,'minute').isSame(end); t = t.add(stepMin,'minute')) {
    const s = t; const e = t.add(stepMin,'minute');
    if (e.isAfter(end)) break;
    const b = busies.some(b => s.isBefore(dayjs(b.end)) && e.isAfter(dayjs(b.start)));
    cells.push({ start: s.toISOString(), end: e.toISOString(), idx: idx++, busy: b });
  }
  return cells;
}

export function findValidStarts(
  cells: Cell[],
  totalMin: number,
  stepMin: number,
  leadMin: number,
  postBufferMin: number
) {
  const need = Math.ceil(totalMin / stepMin);
  const bufferCells = Math.ceil((postBufferMin || 0) / stepMin);
  const nowLead = dayjs().add(leadMin, 'minute');

  const valid: number[] = [];
  for (let i=0; i+need+bufferCells<=cells.length; i++) {
    if (dayjs(cells[i].start).isBefore(nowLead)) continue;
    let ok = true;
    for (let k=0; k<need; k++) {
      const c = cells[i+k];
      if (!c || c.busy) { ok=false; break; }
      if (k>0 && cells[i+k-1].end !== c.start) { ok=false; break; }
    }
    if (ok && bufferCells>0) {
      for (let b=0;b<bufferCells;b++) {
        const c = cells[i+need+b];
        if (!c || c.busy) { ok=false; break; }
      }
    }
    if (ok) valid.push(i);
  }
  return { valid, need, needWithBuffer: need+bufferCells };
}