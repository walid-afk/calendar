import { NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cal = await getCalendarClient();
    const res = await cal.calendarList.list({ maxResults: 250 });
    const items = (res.data.items || []).map(c => ({
      id: c.id, summary: c.summary, primary: !!c.primary, accessRole: c.accessRole
    }));
    return NextResponse.json({ ok:true, items });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'list_failed' }, { status: 500 });
  }
}
