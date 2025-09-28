import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google';
import { ymdWith, isoZ, DEFAULT_TZ } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const pass = req.headers.get('x-passcode');
  if (!process.env.SHOP_PASSCODE || pass !== process.env.SHOP_PASSCODE) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const calendarId = String(searchParams.get('calendarId') || '');
  const date = String(searchParams.get('date') || '');
  const opening = String(process.env.DEFAULT_OPENING || '09:00-19:00');
  if (!calendarId || !date) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });

  const [openHH, closeHH] = opening.split('-');
  const timeMin = isoZ(ymdWith(date, openHH));
  const timeMax = isoZ(ymdWith(date, closeHH));

  const cal = await getCalendarClient();
  const fb = await cal.freebusy.query({ requestBody: { timeMin, timeMax, items: [{ id: calendarId }] } });
  const busy = (fb.data.calendars?.[calendarId]?.busy || []);

  return NextResponse.json({ ok: true, tz: DEFAULT_TZ, date, opening, timeMin, timeMax, busy });
}
