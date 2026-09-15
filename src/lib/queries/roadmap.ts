import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RoadmapDay } from "@/lib/database.types";

export const ROADMAP_TOTAL_DAYS = 48;
export const ROADMAP_DAYS_PER_WEEK = 6;

export interface RoadmapDayWithProgress extends RoadmapDay {
  completed: boolean;
  completedAt: string | null;
  note: string | null;
}

export interface RoadmapWeek {
  week: number;
  month: number;
  weekTitle: string;
  days: RoadmapDayWithProgress[];
  completedCount: number;
}

export interface RoadmapMonth {
  month: number;
  weeks: RoadmapWeek[];
  completedCount: number;
  totalCount: number;
}

export interface RoadmapOverview {
  months: RoadmapMonth[];
  totalCompleted: number;
  totalDays: number;
  /** Ngày đầu tiên (theo thứ tự 1..48) chưa tick — dùng để hiện trạng thái
   * "đang ở đây" trên đường zigzag. 49 nếu đã hoàn thành hết. */
  currentDay: number;
}

/**
 * Gom danh sách phẳng 48 ngày (kèm tiến trình) thành cấu trúc Tháng → Tuần để
 * hiển thị. Hàm thuần, không đụng Supabase — dùng lại được ở cả server (sau
 * khi fetch) lẫn client (sau khi tick lạc quan một ngày, không cần round-trip
 * server để tính lại tổng).
 */
export function buildRoadmapOverview(daysWithProgress: RoadmapDayWithProgress[]): RoadmapOverview {
  const sorted = [...daysWithProgress].sort((a, b) => a.day - b.day);

  // "Ngày hiện tại" = điểm xa nhất đã chạm tới (ngày lớn nhất đã tick) + 1 —
  // KHÔNG phải "ngày trống đầu tiên". Nếu dùng "ngày trống đầu tiên", theo
  // định nghĩa sẽ không bao giờ có ngày nào NHỎ HƠN nó mà còn trống, nên
  // trạng thái "đã qua lượt nhưng chưa tick" (học bù) sẽ không bao giờ xảy ra
  // — người dùng tick nhảy cóc ngày 10 xong quay lại ngày 3 vẫn cần thấy rõ
  // ngày 3 là "bỏ lỡ", không phải "chưa tới lượt" như ngày 11.
  const lastCompleted = [...sorted].reverse().find((d) => d.completed);
  const currentDay = lastCompleted ? lastCompleted.day + 1 : 1;

  const weekMap = new Map<number, RoadmapWeek>();
  for (const d of sorted) {
    let week = weekMap.get(d.week);
    if (!week) {
      week = { week: d.week, month: d.month, weekTitle: d.week_title, days: [], completedCount: 0 };
      weekMap.set(d.week, week);
    }
    week.days.push(d);
    if (d.completed) week.completedCount++;
  }
  const weeks = [...weekMap.values()].sort((a, b) => a.week - b.week);

  const monthMap = new Map<number, RoadmapMonth>();
  for (const w of weeks) {
    let month = monthMap.get(w.month);
    if (!month) {
      month = { month: w.month, weeks: [], completedCount: 0, totalCount: 0 };
      monthMap.set(w.month, month);
    }
    month.weeks.push(w);
    month.completedCount += w.completedCount;
    month.totalCount += w.days.length;
  }
  const months = [...monthMap.values()].sort((a, b) => a.month - b.month);

  return {
    months,
    totalCompleted: sorted.filter((d) => d.completed).length,
    totalDays: sorted.length,
    currentDay,
  };
}

// 48 ngày (bảng tĩnh) + tiến trình tick của người dùng (bảng riêng theo
// user_id) — join ở tầng ứng dụng vì chỉ 48 dòng, không đáng để làm 1 view SQL.
// Cả 2 câu query chạy song song vì độc lập nhau.
export async function getRoadmapOverview(
  supabase: SupabaseClient<Database>
): Promise<RoadmapOverview> {
  const [{ data: days, error: daysErr }, { data: progress, error: progressErr }] =
    await Promise.all([
      supabase.from("roadmap_days").select("*").order("day", { ascending: true }),
      supabase.from("roadmap_progress").select("day, completed, completed_at, note"),
    ]);
  if (daysErr) throw daysErr;
  if (progressErr) throw progressErr;

  const progressByDay = new Map(
    (progress ?? []).map((p) => [p.day, p] as const)
  );

  const daysWithProgress: RoadmapDayWithProgress[] = (days ?? []).map((d) => {
    const p = progressByDay.get(d.day);
    return {
      ...d,
      completed: p?.completed ?? false,
      completedAt: p?.completed_at ?? null,
      note: p?.note ?? null,
    };
  });

  return buildRoadmapOverview(daysWithProgress);
}

export class RoadmapError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface SetRoadmapProgressInput {
  day: number;
  completed: boolean;
  note?: string | null;
}

// Upsert theo (user_id, day) — user_id lấy mặc định từ auth.uid() ở tầng DB
// (cột roadmap_progress.user_id default auth.uid()), không cần truyền lên
// đây, và RLS đã đảm bảo không ghi được vào tiến trình của người khác.
export async function setRoadmapProgress(
  supabase: SupabaseClient<Database>,
  input: SetRoadmapProgressInput
): Promise<void> {
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > ROADMAP_TOTAL_DAYS) {
    throw new RoadmapError(`day phải là số nguyên từ 1 đến ${ROADMAP_TOTAL_DAYS}.`);
  }
  if (typeof input.completed !== "boolean") {
    throw new RoadmapError("completed phải là true/false.");
  }
  // Ghi chú ngắn (điểm TOEIC, số liệu benchmark...) — chặn độ dài để tránh
  // client gửi nguyên một đoạn văn dài vào 1 ô ghi chú nhỏ.
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 500) || null : null;

  const { error } = await supabase.from("roadmap_progress").upsert(
    {
      day: input.day,
      completed: input.completed,
      completed_at: input.completed ? new Date().toISOString() : null,
      note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" }
  );
  if (error) throw error;
}
