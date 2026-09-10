import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { APP_TIMEZONE } from "@/lib/constants";

// Thống kê thời gian học gộp từ 2 nguồn: bộ đề trắc nghiệm (attempts) và phiên
// học từ vựng (vocab_sessions).
//
// Đặt ở module riêng thay vì nhét vào attempts.ts hay vocab.ts: nó cần cả hai,
// và trước đây attempts.ts phải import ngược sang vocab.ts khiến hai phần dính
// vào nhau. Việc cộng dồn nằm ở Postgres (migration 0008), tầng này chỉ đổi
// đơn vị và gắn nhãn hiển thị.

// Bọc cache(): trang chủ gọi hàm này hai lần trong cùng một request — một lần
// ở layout để hiện tổng giờ trên header, một lần bên trong getHistory. Không
// bọc thì cùng một phép cộng chạy hai lượt round-trip tới DB ở US.
export const getTotalStudiedMinutes = cache(async function getTotalStudiedMinutes(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const { data, error } = await supabase.rpc("study_total_seconds");
  if (error) throw error;
  return Math.round(Number(data ?? 0) / 60);
});

export interface DailyStudyMinutes {
  label: string;
  minutes: number;
}

const WEEKDAY_LABELS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export async function getWeeklyMinutesByDay(
  supabase: SupabaseClient<Database>
): Promise<DailyStudyMinutes[]> {
  const { data, error } = await supabase.rpc("study_seconds_by_day", { p_days: 7 });
  if (error) throw error;

  return (data ?? []).map((row) => {
    // row.day là chuỗi "YYYY-MM-DD" theo giờ Việt Nam; ghép "T00:00:00" để
    // Date không hiểu nhầm thành UTC rồi lùi mất một ngày khi lấy thứ.
    const date = new Date(`${row.day}T00:00:00`);
    return {
      label: WEEKDAY_LABELS_VI[date.getDay()],
      minutes: Math.round(Number(row.seconds) / 60),
    };
  });
}

/** Ngày "hôm nay" theo giờ ứng dụng, dạng YYYY-MM-DD. */
export function appToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date());
}
