import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google';
import { buildDayCells, findValidStarts } from '@/lib/slots';
import { ymdWith, isoZ, dayjs, DEFAULT_TZ } from '@/lib/time';

export const dynamic = 'force-dynamic';

function bad(m:string){return NextResponse.json({ok:false,error:'invalid_input',message:m},{status:400});}

export async function POST(req: NextRequest) {
  // simple auth
  if (req.headers.get('x-passcode') !== process.env.SHOP_PASSCODE) {
    return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });
  }

  let body:any={}; try { body = await req.json(); } catch { return bad('JSON invalide'); }
  const calendarId = String(body.calendarId || '').trim();
  const date = String(body.date || '').trim();
  const total = Number(body.durationMinutes || 0);

  const opening = String(body.opening || process.env.DEFAULT_OPENING || '09:00-19:00');
  const step = Number(body.slotStepMinutes || process.env.SLOT_STEP_MINUTES || 15);
  const lead = Number(body.leadMinutes || process.env.MIN_LEAD_MINUTES || 15);
  const buffer = Number(body.postBufferMinutes || 0); // Pas de buffer par défaut

  if (!calendarId) return bad('calendarId requis');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad('date YYYY-MM-DD requise');
  if (!(total>0)) return bad('durationMinutes > 0 requis');

  const [o,c] = opening.split('-');
  const timeMin = isoZ(ymdWith(date, o));
  const timeMax = isoZ(ymdWith(date, c));

  const reasons:string[] = [];
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), 8000);

  try {
    const cal = await getCalendarClient();

    // Récupérer les événements avec détails pour avoir les titres
    const eventsResponse = await cal.events.list({ 
      calendarId, 
      timeMin, 
      timeMax, 
      singleEvents: true, 
      orderBy: 'startTime' 
    }, { signal: ctrl.signal } as any);
    
    const events = ((eventsResponse.data as any).items || []);
    
    // Construire la liste des busy avec titres
    let busyWithTitles: Array<{start:string,end:string,title?:string,summary?:string}> = [];
    
    for (const event of events) {
      // Gérer les événements all-day
      if (event.start?.date || event.end?.date) {
        busyWithTitles.push({ 
          start: timeMin, 
          end: timeMax,
          title: event.summary || 'Événement toute la journée',
          summary: event.summary
        });
        reasons.push('all_day_event');
      } else if (event.start?.dateTime && event.end?.dateTime) {
        // Événements normaux avec heures
        busyWithTitles.push({
          start: event.start.dateTime,
          end: event.end.dateTime,
          title: event.summary || 'Rendez-vous',
          summary: event.summary
        });
      }
    }

    const openDur = dayjs(timeMax).diff(dayjs(timeMin), 'minute');
    if (total > openDur) reasons.push('duration_exceeds_open_hours');

    const cells = buildDayCells(date, opening, step, busyWithTitles);
    
    // Enrichir les cellules avec les titres des événements
    const enrichedCells = cells.map(cell => {
      if (cell.busy) {
        // Trouver l'événement qui correspond à cette cellule
        const matchingEvent = busyWithTitles.find(event => {
          const cellStart = dayjs(cell.start);
          const cellEnd = dayjs(cell.end);
          const eventStart = dayjs(event.start);
          const eventEnd = dayjs(event.end);
          
          return cellStart.isBefore(eventEnd) && cellEnd.isAfter(eventStart);
        });
        
        return {
          ...cell,
          title: matchingEvent?.title || matchingEvent?.summary || 'Occupé',
          summary: matchingEvent?.summary
        };
      }
      return cell;
    });
    
    const { valid, need, needWithBuffer } = findValidStarts(enrichedCells, total, step, lead, buffer);

    if (enrichedCells.length === 0) reasons.push('no_cells_generated');
    if (busyWithTitles.length > 0 && valid.length === 0) reasons.push('all_cells_conflict');
    if (valid.length === 0) {
      // Diagnostics fins
      const nowLead = dayjs().add(lead,'minute').toISOString();
      const firstAfterLeadIdx = enrichedCells.findIndex(c => c.start >= nowLead);
      if (firstAfterLeadIdx < 0) reasons.push('lead_filters_all');
      if (buffer > 0) reasons.push('buffer_filters_all');
    }

    console.log(JSON.stringify({ msg:'freebusy.debug', date, opening, step, lead, buffer, tz: DEFAULT_TZ, timeMin, timeMax, busyCount: busyWithTitles.length, cells: enrichedCells.length, validStarts: valid.length }));

    return NextResponse.json({
      ok:true, 
      cells: enrichedCells, 
      validStarts: valid, 
      need, 
      needWithBuffer, 
      step,
      busyEvents: busyWithTitles, // Retourner les événements groupés
      meta:{ tz:DEFAULT_TZ, reasons, openMinutes: openDur }
    });
  } catch (e:any) {
    if (e?.code === 'NO_GOOGLE_TOKENS') return NextResponse.json({ ok:false, error:'google_not_connected' }, { status:401 });
    if (e?.name === 'AbortError') return NextResponse.json({ ok:false, error:'google_timeout' }, { status:504 });
    return NextResponse.json({ ok:false, error:'freebusy_failed', reason:e?.message }, { status:502 });
  } finally { clearTimeout(t); }
}