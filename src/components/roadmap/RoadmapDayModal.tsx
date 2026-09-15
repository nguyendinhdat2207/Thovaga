"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { RoadmapDayWithProgress } from "@/lib/queries/roadmap";

export function RoadmapDayModal({
  day,
  saving,
  onClose,
  onToggleComplete,
}: {
  day: RoadmapDayWithProgress;
  saving: boolean;
  onClose: () => void;
  onToggleComplete: (completed: boolean, note: string) => void;
}) {
  const [note, setNote] = useState(day.note ?? "");

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-[480px] sm:rounded-[24px] rounded-t-[24px] max-h-[88vh] overflow-y-auto"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-ink-muted uppercase tracking-wide">
              Ngày {day.day} · Tuần {day.week}
            </div>
            <div className="font-display font-extrabold text-lg text-ink leading-tight truncate">
              {day.memo}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-display font-extrabold text-xl text-ink-faint px-1 shrink-0"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          <div>
            <div className="font-display font-extrabold text-sm text-ink-muted uppercase tracking-wide mb-2.5">
              Công việc
            </div>
            <div className="flex flex-col gap-2">
              {day.tasks.map((t, i) => (
                <div
                  key={i}
                  className="font-bold text-[15px] leading-relaxed text-ink bg-badge-bg rounded-xl px-3.5 py-3"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-yellow rounded-2xl px-4 py-3.5 bg-yellow-pale">
            <div className="font-display font-extrabold text-xs text-yellow-shadow uppercase tracking-wide mb-1">
              Checkpoint
            </div>
            <p className="font-bold text-[15px] leading-relaxed text-ink">{day.checkpoint}</p>
          </div>

          <div>
            <label className="font-bold text-xs text-ink-muted mb-1.5 block">
              Ghi chú (điểm TOEIC, số liệu benchmark...)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Vd: điểm chuẩn đoán 550, query nhanh hơn 3 lần sau khi thêm index..."
              className="w-full border border-border rounded-xl px-3.5 py-3 font-bold text-sm text-ink outline-none focus:border-yellow resize-none"
            />
          </div>

          <div className="flex gap-3">
            {day.completed && (
              <Button variant="ghost" className="flex-1" disabled={saving} onClick={onClose}>
                Đóng
              </Button>
            )}
            <Button
              variant={day.completed ? "danger" : "solid"}
              className="flex-1"
              disabled={saving}
              onClick={() => onToggleComplete(!day.completed, note)}
            >
              {saving ? "Đang lưu..." : day.completed ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
