import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SubjectWithProgress } from "@/lib/queries/subjects";

export function SubjectRow({ subject }: { subject: SubjectWithProgress }) {
  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="flex items-center gap-4 flex-wrap py-3.5 px-1 border-b border-border hover:bg-bg-accent transition-colors"
    >
      <div className="flex-1 min-w-[190px]">
        <div className="font-display font-extrabold text-[17px] text-ink">{subject.name}</div>
        <div className="font-bold text-xs text-ink-muted">
          {subject.completedDeckCount}/{subject.deckCount} bộ đề
        </div>
      </div>
      <div className="flex-1 min-w-[120px]">
        <ProgressBar percent={subject.progressPct} />
      </div>
      <span className="font-display font-extrabold text-base text-ink w-[54px] text-right">
        {subject.progressPct}%
      </span>
    </Link>
  );
}
