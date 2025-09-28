import dayjs from 'dayjs';
import type { Employee, SlotOption } from '@/types';

export async function getDaySlots(
  ymd: string,
  employees: Employee[],
  durationMinutes: number,
  selected: string, // 'any' or employeeId
  headers: Record<string,string>
): Promise<SlotOption[]> {
  if (durationMinutes <= 0) return [];

  async function fetchFor(calendarId: string) {
    const r = await fetch('/api/freebusy', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        calendarId, 
        date: ymd, 
        durationMinutes,
        postBufferMinutes: 0 // Pas de buffer
      })
    });
    if (!r.ok) return null;
    const data = await r.json();
    const { cells, validStarts, step, need } = data;
    
    // Transformer en slots simples (une box par créneau de 15min)
    const slots: SlotOption[] = validStarts.map((i: number) => {
      const start = cells[i].start;
      const end = cells[i + need - 1].end;
      return { 
        start, 
        end, 
        display: dayjs(start).format('HH:mm'),
        employeeId: calendarId
      };
    });
    return { step, slots };
  }

  if (selected !== 'any') {
    const out = await fetchFor(selected);
    return out?.slots || [];
  }

  // Agrégation pour "Sans préférence" - fusionner les horaires de tous les employés
  const results = await Promise.all(
    employees.map(async (e) => ({ e, resp: await fetchFor(e.id) }))
  );

  const mapByTime = new Map<string, SlotOption>(); // "HH:mm" -> slot
  for (const { e, resp } of results) {
    if (!resp) continue;
    for (const s of resp.slots) {
      const key = s.display; // ex: "11:15"
      if (!mapByTime.has(key)) {
        mapByTime.set(key, { ...s, employeeId: e.id });
      }
    }
  }
  
  return Array.from(mapByTime.values()).sort((a, b) => a.start.localeCompare(b.start));
}
