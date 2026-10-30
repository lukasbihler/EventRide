// Gibt den UTC-Offset für Wien zurück (CEST=2 im Sommer, CET=1 im Winter).
// Umschaltung: letzter Sonntag im März 01:00 UTC → letzter Sonntag im Oktober 01:00 UTC.
export function getViennaOffsetHours(date: Date): number {
  const y = date.getUTCFullYear();
  const lastSundayOf = (month: number) => {
    const lastDay = new Date(Date.UTC(y, month + 1, 0));
    return new Date(Date.UTC(y, month, lastDay.getUTCDate() - lastDay.getUTCDay(), 1, 0, 0));
  };
  const cstStart = lastSundayOf(2);  // letzter Sonntag März  01:00 UTC
  const cstEnd   = lastSundayOf(9);  // letzter Sonntag Okt.  01:00 UTC
  return (date >= cstStart && date < cstEnd) ? 2 : 1;
}
