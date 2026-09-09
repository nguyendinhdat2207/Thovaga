import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SubjectWithProgress } from "@/lib/queries/subjects";
import { formatScore } from "@/lib/format";

export function SubjectCard({ subject }: { subject: SubjectWithProgress }) {
  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="block border border-border rounded-[20px] p-[18px] hover:border-yellow transition-colors"
    >
      <div className="flex justify-between items-start gap-3 mb-3.5">
        <div className="min-w-0">
          <div className="font-display font-extrabold text-lg text-ink leading-tight">
            {subject.name}
          </div>
          <div className="font-bold text-[13px] text-ink-muted mt-0.5">
            {subject.completedDeckCount}/{subject.deckCount} bộ đề hoàn thành
          </div>
        </div>
        <span className="font-display font-extrabold text-[22px] text-ink shrink-0">
          {subject.progressPct}%
        </span>
      </div>
      <ProgressBar percent={subject.progressPct} />
      <div className="flex items-center justify-between gap-3 mt-4">
        <span className="font-bold text-xs text-ink-muted">
          {subject.lastScore !== null ? `Điểm gần nhất ${formatScore(subject.lastScore)}` : "Chưa làm bài"}
        </span>
        <span className="font-display font-extrabold text-sm text-ink bg-yellow border-2 border-yellow-shadow rounded-xl shadow-[0_4px_0_var(--color-yellow-shadow)] px-[18px] py-2.5">
          Mở môn
        </span>
      </div>
    </Link>
  );
}
