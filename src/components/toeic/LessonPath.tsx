import Link from "next/link";
import type { LessonSummary } from "@/lib/queries/toeic";
import { lessonState, type LessonState } from "@/lib/toeic";

// Cùng kiểu zigzag với /roadmap (RoadmapPath): lệch % theo bề rộng cột nên co
// giãn được trên mọi khổ màn hình, không cần vẽ SVG.
const ZIGZAG_PATTERN = [0, 32, 46, 32, 0, -32];

const NODE_STYLE: Record<LessonState, string> = {
  done: "bg-green border-2 border-green-shadow text-white",
  current:
    "bg-yellow border-2 border-yellow-shadow text-ink shadow-[0_4px_0_var(--color-yellow-shadow)]",
  missed: "bg-white border-2 border-orange text-orange",
  upcoming: "bg-track border border-border text-ink-faint",
};

export function LessonPath({
  lessons,
  currentLessonNo,
}: {
  lessons: LessonSummary[];
  currentLessonNo: number;
}) {
  return (
    <div className="relative flex flex-col items-center gap-5 py-2">
      {lessons.map((l, i) => {
        const state = lessonState(l.lessonNo, l.completed, currentLessonNo);
        const offset = ZIGZAG_PATTERN[i % ZIGZAG_PATTERN.length];
        return (
          <Link
            key={l.id}
            href={`/toeic/${l.id}`}
            className="flex items-center gap-3.5 w-[300px] max-w-full"
            style={{ transform: `translateX(${offset}%)` }}
          >
            <span
              className={`w-16 h-16 shrink-0 rounded-full grid place-items-center font-display font-extrabold text-lg transition-transform active:scale-95 ${NODE_STYLE[state]}`}
            >
              {state === "done" ? "✓" : l.lessonNo}
            </span>
            <span className={`min-w-0 ${state === "upcoming" ? "opacity-70" : ""}`}>
              <span className="block font-display font-extrabold text-[15px] text-ink leading-tight">
                L{l.lessonNo} · {l.title}
              </span>
              <span className="flex flex-wrap gap-1.5 mt-1">
                {l.kind === "theory" && (
                  <span className="font-display font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-yellow-pill text-ink">
                    Lý thuyết
                  </span>
                )}
                {l.quizCount > 0 && (
                  <span className="font-display font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-badge-bg text-ink-muted">
                    {l.quizDoneCount}/{l.quizCount} đề Zenlish
                  </span>
                )}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
