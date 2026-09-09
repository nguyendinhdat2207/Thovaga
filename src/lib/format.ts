export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatHours(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function computeScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100) / 10;
}

const WEEKDAY_LABELS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function weekdayLabelVi(date: Date): string {
  return WEEKDAY_LABELS_VI[date.getDay()];
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}
