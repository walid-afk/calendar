import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
dayjs.extend(utc); dayjs.extend(tz);

export const DEFAULT_TZ = process.env.DEFAULT_TZ || 'Europe/Paris';

export function parseYMD(ymd: string) {
  return dayjs.tz(`${ymd}T00:00:00`, DEFAULT_TZ);
}
export function ymdWith(ymd: string, hhmm: string) {
  const [h,m] = hhmm.split(':').map(Number);
  return parseYMD(ymd).hour(h).minute(m).second(0).millisecond(0);
}
export function isoZ(d: dayjs.Dayjs) { 
  return d.toISOString(); 
}
export { dayjs };
