import { NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cal = await getCalendarClient();
    const about = await cal.calendarList.list({ maxResults: 1 });
    // Pas d'endpoint simple "whoami" côté Calendar; on infère à partir du premier calendar "primary" s'il existe
    const items = about.data.items || [];
    const primary = items.find(i => i.primary);
    return NextResponse.json({ ok:true, primaryEmail: primary?.id || null, count: items.length });
  } catch (e:any) {
    const code = e?.code || e?.message;
    return NextResponse.json({ ok:false, error: code || 'whoami_failed' }, { status: 500 });
  }
}
