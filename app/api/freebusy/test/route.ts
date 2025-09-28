import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const calendarId = String(searchParams.get('calendarId') || '').trim();
  const date = String(searchParams.get('date') || '').trim(); // YYYY-MM-DD
  const duration = Number(searchParams.get('durationMinutes') || 30);
  if (!calendarId || !date) return NextResponse.json({ ok:false, error:'missing_params' }, { status:400 });

  const headers = { 'x-passcode': process.env.SHOP_PASSCODE!, 'Content-Type':'application/json' };
  const r = await fetch(`http://localhost:3000/api/freebusy`, {
    method:'POST', headers, cache:'no-store',
    body: JSON.stringify({ calendarId, date, durationMinutes: duration, leadMinutes: 15, postBufferMinutes: 0 })
  });
  const j = await r.json().catch(()=>null);
  return NextResponse.json({ ok: r.ok, status: r.status, body: j });
}
