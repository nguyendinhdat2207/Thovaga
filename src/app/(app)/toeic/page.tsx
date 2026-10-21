import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getToeicOverview } from "@/lib/queries/toeic";
import { LessonPath } from "@/components/toeic/LessonPath";
import { Mascot } from "@/components/ui/Mascot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ToeicSkill } from "@/lib/toeic";

const SKILLS: { key: ToeicSkill; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
];

export default async function ToeicPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; book?: string }>;
}) {
  const sp = await searchParams;
  const skill: ToeicSkill = sp.skill === "reading" ? "reading" : "listening";
  const supabase = await createClient();
  const { books, selected } = await getToeicOverview(supabase, skill, sp.book ?? null);

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6 pb-16">
      <div className="flex items-center gap-4 flex-wrap mb-5">
        <Mascot size={56} />
        <div className="flex-1 min-w-[240px]">
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink">
            TOEIC theo sách Zenlish
          </h1>
          <p className="font-bold text-sm text-ink-muted mt-0.5">
            Lý thuyết học ở đây · đề làm trên zenlishtoeic.vn rồi quay lại ghi điểm
          </p>
        </div>
        <Link
          href="/vocab/inbox"
          className="font-display font-extrabold text-sm text-ink-muted hover:text-ink"
        >
          Sổ ghi nhanh từ mới →
        </Link>
      </div>

      <nav aria-label="Kỹ năng" className="flex gap-2.5 mb-6">
        {SKILLS.map((s) => (
          <Link
            key={s.key}
            href={`/toeic?skill=${s.key}`}
            aria-current={s.key === skill ? "page" : undefined}
            className={`font-display font-extrabold text-[15px] px-5 py-2.5 rounded-xl border-2 ${
              s.key === skill
                ? "bg-yellow border-yellow-shadow text-ink shadow-[0_4px_0_var(--color-yellow-shadow)]"
                : "bg-white border-border text-ink shadow-[0_4px_0_var(--color-border)]"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {!selected ? (
        <div className="border border-dashed border-border-dashed rounded-2xl p-5 text-center font-bold text-sm text-ink-muted">
          Chưa có dữ liệu TOEIC — chạy migration <code>0018_toeic.sql</code> và{" "}
          <code>0019_toeic_seed.sql</code>.
        </div>
      ) : (
        <div className="flex flex-wrap gap-7 items-start">
          <div className="flex-[999_1_520px] min-w-0 flex flex-col gap-5">
            <section className="border-2 border-yellow bg-yellow-pale rounded-[20px] px-5 py-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-baseline gap-3 flex-wrap">
                <div>
                  <div className="font-display font-extrabold text-xs text-yellow-shadow uppercase tracking-wide">
                    {selected.level}
                  </div>
                  <h2 className="font-display font-extrabold text-[20px] text-ink">
                    {selected.title}
                  </h2>
                </div>
                <span className="font-bold text-xs text-ink-muted">
                  {selected.completedCount}/{selected.lessonCount} bài · {selected.quizDoneCount}/
                  {selected.quizCount} đề Zenlish
                </span>
              </div>
              <ProgressBar
                percent={selected.lessonCount ? (selected.completedCount / selected.lessonCount) * 100 : 0}
                heightClassName="h-2.5"
              />
              <p className="font-bold text-sm text-ink">{selected.description}</p>
              <p className="font-bold text-xs text-ink-muted">Mục tiêu: {selected.target}</p>
            </section>
            <LessonPath lessons={selected.lessons} currentLessonNo={selected.currentLessonNo} />
          </div>

          <aside aria-label="Các sách" className="flex-[1_1_280px] min-w-0 flex flex-col gap-3">
            <div className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-wide">
              Bộ sách · {skill === "listening" ? "Nghe" : "Đọc"}
            </div>
            {books.map((b) => {
              const active = b.id === selected.id;
              return (
                <Link
                  key={b.id}
                  href={`/toeic?skill=${skill}&book=${b.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl px-4 py-3 flex flex-col gap-1.5 border-2 ${
                    active ? "border-yellow bg-yellow-pale" : "border-border bg-white"
                  }`}
                >
                  <span className="flex justify-between gap-2">
                    <span className="font-display font-extrabold text-[15px] text-ink">{b.title}</span>
                    <span className="font-bold text-xs text-ink-muted whitespace-nowrap">
                      {b.completedCount}/{b.lessonCount}
                    </span>
                  </span>
                  <ProgressBar
                    percent={b.lessonCount ? (b.completedCount / b.lessonCount) * 100 : 0}
                    heightClassName="h-1.5"
                    fillClassName="bg-orange"
                  />
                </Link>
              );
            })}
          </aside>
        </div>
      )}
    </div>
  );
}
