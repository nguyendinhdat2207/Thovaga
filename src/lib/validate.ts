// Kiểm tra dữ liệu do client gửi lên trước khi ghi vào DB.
//
// Mọi mốc thời gian của một phiên học (started_at/finished_at) đều do trình
// duyệt tự đặt, nên không thể tin: đồng hồ máy có thể sai, tab để mở qua đêm,
// hoặc ai đó gọi thẳng API với started_at 10 năm trước. Nếu ghi nguyên si thì
// "tổng thời gian học" hỏng vĩnh viễn và không có cách nào sửa lại. Vì vậy
// server luôn tự tính duration và chặn trong khoảng hợp lý.

/** Một phiên học dài nhất được ghi nhận — dài hơn coi như người dùng để tab mở. */
export const MAX_SESSION_SECONDS = 4 * 60 * 60;

/** Biên độ lệch đồng hồ cho phép giữa máy người dùng và server. */
const CLOCK_SKEW_MS = 60_000;

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Ép về số nguyên không âm. Chuỗi số ("12") vẫn chấp nhận vì client có thể gửi
 * qua JSON dạng string; mọi thứ khác (null, "abc", NaN, số âm) đều bị từ chối
 * thay vì âm thầm thành 0.
 */
export function toCount(value: unknown, field: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError(`${field} phải là số nguyên không âm.`);
  }
  return Math.floor(n);
}

export interface SessionWindow {
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
}

/**
 * Xác thực cặp started_at/finished_at rồi trả về duration server tự tính:
 * - hai mốc phải là ISO timestamp hợp lệ
 * - finished_at không được ở tương lai (trừ sai số đồng hồ)
 * - duration bị kẹp trong [0, MAX_SESSION_SECONDS]
 */
export function parseSessionWindow(startedAtRaw: unknown, finishedAtRaw: unknown): SessionWindow {
  if (typeof startedAtRaw !== "string" || typeof finishedAtRaw !== "string") {
    throw new ValidationError("started_at và finished_at là bắt buộc.");
  }

  const started = Date.parse(startedAtRaw);
  const finished = Date.parse(finishedAtRaw);
  if (!Number.isFinite(started) || !Number.isFinite(finished)) {
    throw new ValidationError("started_at hoặc finished_at không phải thời gian hợp lệ.");
  }
  if (finished > Date.now() + CLOCK_SKEW_MS) {
    throw new ValidationError("finished_at không thể ở tương lai.");
  }
  if (finished < started) {
    throw new ValidationError("finished_at phải sau started_at.");
  }

  const durationSeconds = Math.min(
    Math.round((finished - started) / 1000),
    MAX_SESSION_SECONDS
  );

  return {
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    durationSeconds,
  };
}
