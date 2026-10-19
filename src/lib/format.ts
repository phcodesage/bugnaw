export const peso = (n: number) =>
  "₱" + new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(n);

export function minutesLabel(m: number) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h} hr ${r} min`;
  if (h) return `${h} hr${h > 1 ? "s" : ""}`;
  return `${r} min`;
}

export function timeLabel(t: string) {
  const [hRaw, m] = t.split(":");
  let h = Number(hRaw);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

export function dateLabel(iso: string, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", opts ?? { weekday: "short", month: "short", day: "numeric" });
}

export function isValidPhMobile(v: string) {
  return /^09\d{9}$/.test(v.replace(/\s|-/g, ""));
}
