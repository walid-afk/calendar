import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.headers.get('x-passcode') !== process.env.SHOP_PASSCODE) {
    return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });
  }
  const { searchParams } = new URL(req.url);
  const calendarId = String(searchParams.get('calendarId')||'').trim();
  const startYMD = String(searchParams.get('date')||'').trim();
  const duration = Number(searchParams.get('durationMinutes')||0);
  const horizon = Number(searchParams.get('days')||14);
  if (!calendarId || !startYMD || !(duration>0)) return NextResponse.json({ ok:false, error:'invalid_input' }, { status:400 });

  const headers = { 'Content-Type':'application/json', 'x-passcode': process.env.SHOP_PASSCODE! };
  let d = startYMD;
  for (let i=0;i<horizon;i++) {
    const r = await fetch(`http://localhost:3000/api/freebusy`, {
      method:'POST', headers, body: JSON.stringify({ calendarId, date: d, durationMinutes: duration })
    });
    if (r.ok) {
      const j = await r.json();
      if ((j.validStarts||[]).length > 0) {
        const i0 = j.validStarts[0];
        const start = j.cells[i0].start;
        const end = j.cells[i0 + j.need - 1].end;
        return NextResponse.json({ ok:true, date: d, start, end });
      }
    }
    const [y,m,day] = d.split('-').map(Number);
    const nd = new Date(y, m-1, day+1);
    d = nd.toISOString().slice(0,10);
  }
  return NextResponse.json({ ok:true, none:true });
}
