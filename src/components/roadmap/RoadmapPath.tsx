"use client";

import { useState } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  buildRoadmapOverview,
  ROADMAP_TOTAL_DAYS,
  type RoadmapDayWithProgress,
  type RoadmapOverview,
  type RoadmapWeek,
} from "@/lib/queries/roadmap";
import { RoadmapDayModal } from "./RoadmapDayModal";

const MONTH_LABELS: Record<number, string> = { 1: "Tháng 1", 2: "Tháng 2" };

// Lệch trái/phải quanh trục giữa, lặp theo chu kỳ 6 (đúng 1 tuần/chu kỳ) —
// tạo hiệu ứng đường zigzag kiểu Duolingo mà không cần vẽ SVG. Đơn vị %, tính
// theo bề rộng cột đường đi nên co giãn tốt trên mọi khổ màn hình.
const ZIGZAG_PATTERN = [0, 32, 46, 32, 0, -32];

function offsetForIndex(indexInPath: number): number {
  return ZIGZAG_PATTERN[indexInPath % ZIGZAG_PATTERN.length];
}

function dayNodeStyle(day: RoadmapDayWithProgress, currentDay: number) {
  if (day.completed) {
    return "bg-green border-2 border-green-shadow text-white";
  }
  if (day.day === currentDay) {
    return "bg-yellow border-2 border-yellow-shadow text-ink shadow-[0_4px_0_var(--color-yellow-shadow)]";
  }
  if (day.day < currentDay) {
    // Đã qua "lượt" nhưng chưa tick — không khoá, chỉ đánh dấu để dễ nhận ra
    // ngày cần học bù.
    return "bg-white border-2 border-orange text-orange";
  }
  // Chưa tới lượt — mờ đi, vẫn bấm được (không khoá cứng, cho phép học trước).
  return "bg-track border border-border text-ink-faint opacity-60";
}

function WeekBadge({ week }: { week: RoadmapWeek }) {
  const done = week.completedCount >= week.days.length;
  return (
    <span
      className={`font-display font-extrabold text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
        done ? "bg-green-badge text-green-shadow" : "bg-badge-bg text-ink-muted"
      }`}
    >
      {done ? "✓ Xong tuần" : `${week.completedCount}/${week.days.length}`}
    </span>
  );
}

export function RoadmapPath({ initialOverview }: { initialOverview: RoadmapOverview }) {
  const [overview, setOverview] = useState(initialOverview);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const allDays = overview.months.flatMap((m) => m.weeks.flatMap((w) => w.days));
  const current = allDays.find((d) => d.day === selectedDay) ?? null;

  function updateLocalDay(day: number, completed: boolean, note: string | null) {
    const nextDays = allDays.map((d) =>
      d.day === day
        ? { ...d, completed, note, completedAt: completed ? new Date().toISOString() : null }
        : d
    );
    setOverview(buildRoadmapOverview(nextDays));
  }

  async function handleToggle(day: number, completed: boolean, note: string) {
    setSaving(true);
    // Cập nhật giao diện ngay — không đợi mạng, giống cách flashcard/quiz từ
    // vựng đã làm. Lỗi mạng chỉ làm mất lần ghi này, không chặn thao tác.
    updateLocalDay(day, completed, note || null);
    setSelectedDay(null);
    try {
      const res = await fetch("/api/roadmap/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, completed, note }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Không lưu được — âm thầm bỏ qua theo đúng quy ước đã dùng ở phần từ
      // vựng; người dùng vẫn thấy trạng thái đã tick, có thể tick lại nếu
      // load lại trang thấy mất (hiếm khi xảy ra, chỉ khi mất mạng đúng lúc).
    } finally {
      setSaving(false);
    }
  }

  const overallPct = (overview.totalCompleted / overview.totalDays) * 100;

  return (
    <div className="max-w-[720px] mx-auto px-5 py-6 pb-16">
      <div className="flex items-center gap-4 flex-wrap mb-6">
        <Mascot size={56} />
        <div className="flex-1 min-w-[240px]">
          <h1 className="font-display font-extrabold text-[26px] tracking-tight text-ink">
            Lộ trình 2 tháng đầu
          </h1>
          <p className="font-bold text-sm text-ink-muted mt-0.5">
            Đã hoàn thành {overview.totalCompleted}/{ROADMAP_TOTAL_DAYS} ngày
          </p>
        </div>
      </div>

      <div className="mb-8">
        <ProgressBar percent={overallPct} heightClassName="h-3" />
      </div>

      {overview.months.map((month) => {
        const monthPct = (month.completedCount / month.totalCount) * 100;
        return (
          <section key={month.month} className="mb-10">
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <h2 className="font-display font-extrabold text-[19px] text-ink">
                {MONTH_LABELS[month.month] ?? `Tháng ${month.month}`}
              </h2>
              <span className="font-bold text-xs text-ink-muted whitespace-nowrap">
                {month.completedCount}/{month.totalCount} ngày
              </span>
            </div>
            <ProgressBar percent={monthPct} heightClassName="h-1.5" fillClassName="bg-orange" />

            <div className="mt-7 flex flex-col gap-9">
              {month.weeks.map((week) => (
                <div key={week.week}>
                  <div className="flex items-center justify-between gap-3 mb-5 px-2">
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-ink-faint uppercase tracking-wide">
                        Tuần {week.week}
                      </div>
                      <div className="font-display font-extrabold text-[15px] text-ink truncate">
                        {week.weekTitle}
                      </div>
                    </div>
                    <WeekBadge week={week} />
                  </div>

                  <div className="relative flex flex-col items-center gap-5 py-1">
                    {week.days.map((day, i) => (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        style={{ transform: `translateX(${offsetForIndex(i)}%)` }}
                        className={`w-16 h-16 shrink-0 rounded-full grid place-items-center font-display font-extrabold text-lg transition-transform active:scale-95 ${dayNodeStyle(
                          day,
                          overview.currentDay
                        )}`}
                        aria-label={`Ngày ${day.day}: ${day.memo}`}
                      >
                        {day.completed ? "✓" : day.day}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {current && (
        <RoadmapDayModal
          day={current}
          saving={saving}
          onClose={() => setSelectedDay(null)}
          onToggleComplete={(completed, note) => handleToggle(current.day, completed, note)}
        />
      )}
    </div>
  );
}
