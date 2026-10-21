// Hàm thuần cho module TOEIC (không I/O) — dùng được cả server lẫn client, có
// test ở toeic.test.ts.

/** Gốc link đề Zenlish. DB chỉ lưu slug để Zenlish đổi tên miền thì sửa 1 chỗ. */
export const ZENLISH_QUIZ_BASE = "https://zenlishtoeic.vn/stm-quizzes/";

/** Trần số câu 1 đề (Reading full = 100, để dư) — khớp check ở 0018_toeic.sql. */
export const TOEIC_MAX_QUESTIONS = 200;
export const TOEIC_NOTE_MAX = 500;
/** Sổ ghi nhanh: trần độ dài — khớp check ở bảng vocab_inbox (0018). */
export const INBOX_TEXT_MAX = 300;
export const INBOX_CONTEXT_MAX = 500;
export const INBOX_SOURCE_MAX = 80;
/** Số mục tối đa 1 lần đánh dấu đã xử lý / 1 lần copy. */
export const INBOX_BATCH_MAX = 500;

export type ToeicSkill = "listening" | "reading";

export const MISTAKE_TYPES = {
  listening: "Không nghe ra",
  vocabulary: "Thiếu từ vựng",
  grammar: "Thiếu ngữ pháp",
  trap: "Dính bẫy",
  misread: "Hiểu sai câu hỏi",
  time: "Thiếu thời gian",
} as const;
export type MistakeType = keyof typeof MISTAKE_TYPES;

export function isMistakeType(v: unknown): v is MistakeType {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(MISTAKE_TYPES, v);
}

export function zenlishQuizUrl(slug: string): string {
  return `${ZENLISH_QUIZ_BASE}${encodeURIComponent(slug)}/`;
}

/** "3/6" → tỉ lệ 0..1; tổng ≤ 0 → 0. */
export function ratio(correct: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.max(0, Math.min(1, correct / total));
}

/** Màu điểm: ≥ 80% xanh, ≥ 50% vàng, còn lại cam — chỉ để hiển thị. */
export function scoreTone(correct: number, total: number): "good" | "ok" | "low" {
  const r = ratio(correct, total);
  if (r >= 0.8) return "good";
  if (r >= 0.5) return "ok";
  return "low";
}

/**
 * "Bài hiện tại" trên lộ trình sách = bài lớn nhất đã đánh dấu học xong + 1
 * (giống quy tắc roadmap, SPEC 8.3): nếu lấy "bài trống đầu tiên" thì không bao
 * giờ có trạng thái "bỏ lỡ" cho bài đã qua mà chưa tick.
 */
export function currentLessonNo(lessons: { lesson_no: number; completed: boolean }[]): number {
  let max = 0;
  for (const l of lessons) if (l.completed && l.lesson_no > max) max = l.lesson_no;
  return max + 1;
}

export type LessonState = "done" | "current" | "missed" | "upcoming";

export function lessonState(lessonNo: number, completed: boolean, current: number): LessonState {
  if (completed) return "done";
  if (lessonNo === current) return "current";
  if (lessonNo < current) return "missed";
  return "upcoming";
}

export interface InboxItemForExport {
  raw_text: string;
  context: string | null;
  source: string | null;
}

/**
 * Gom các mục Sổ ghi nhanh thành 1 đoạn để dán sang Claude chuẩn hoá thành bộ
 * từ (skill "chuan-hoa-so-tu-zenlish"). Định dạng đầu ra mà Claude cần trả về
 * khớp parser ở /vocab/import (`từ | nghĩa | ví dụ`).
 */
export function formatInboxForClaude(items: InboxItemForExport[], weekLabel: string): string {
  const lines = items.map((it, i) => {
    const parts = [`${i + 1}. ${it.raw_text.trim()}`];
    if (it.source?.trim()) parts.push(`[${it.source.trim()}]`);
    if (it.context?.trim()) parts.push(it.context.trim());
    return parts.join(" — ");
  });
  return [
    `Chuẩn hoá sổ từ Zenlish ${weekLabel} thành bộ từ cho Thỏ & Gà`,
    "(định dạng: từ /phiên âm/ | (loại từ) nghĩa | [nguồn] câu ví dụ; ưu tiên collocation;",
    "bỏ từ đã có trong claude/toeic-vocab-decks.md).",
    "",
    ...lines,
  ].join("\n");
}

/** Số tuần ISO-8601 của 1 ngày `YYYY-MM-DD` (theo lịch, không theo giờ). */
export function isoWeekNumber(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
