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

/** Nhãn lựa chọn của câu trắc nghiệm: 0 → "A", 1 → "B", ...
 *
 * Trước đây là mảng cứng 6 phần tử, trong khi trình đọc markdown chấp nhận
 * tới chữ Z — đề nào có hơn 6 lựa chọn thì nhãn hiện ra "undefined". */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
