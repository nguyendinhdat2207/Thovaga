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

/**
 * Số phút viết gọn để đặt trên đầu cột biểu đồ: 0 → "0", 45 → "45", 90 → "1h30".
 *
 * Cột chỉ rộng khoảng 40px trên điện thoại nên không đủ chỗ cho "90 phút";
 * đổi sang giờ khi vượt 60 để chuỗi luôn ngắn mà vẫn đọc được ngay.
 */
export function formatMinutesShort(totalMinutes: number): string {
  if (totalMinutes < 60) return String(totalMinutes);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
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
