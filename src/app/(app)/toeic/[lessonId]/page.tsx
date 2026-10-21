import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getToeicLesson } from "@/lib/queries/toeic";
import { TheoryMarkdown } from "@/components/toeic/TheoryMarkdown";
import { QuizPanel } from "@/components/toeic/QuizPanel";

const BOOK_SHORT: Record<string, string> = {
  foundation: "Fo",
  beginner: "Be",
  "campbomb-lc": "Ca LC",
  "campbomb-rc": "Ca RC",
  "submarine-lc": "Su LC",
  "submarine-rc": "Su RC",
};

export default async function ToeicLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const detail = await getToeicLesson(supabase, lessonId);
  if (!detail) notFound();
  const { book, lesson, completed, quizzes, prev, next } = detail;
  const backHref = `/toeic?skill=${book.skill}&book=${book.id}`;

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-5 pb-16">
      <Link href={backHref} className="font-bold text-[13px] text-ink-muted mb-3 inline-block">
        ← {book.title}
      </Link>
      <div className="mb-5">
        <div className="font-display font-extrabold text-xs text-yellow-shadow uppercase tracking-wide">
          {book.title} · Lesson {lesson.lesson_no}
          {lesson.part ? ` · Part ${lesson.part}` : ""}
        </div>
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-tight">
          {lesson.title}
        </h1>
      </div>

      <div className="flex flex-wrap gap-7 items-start">
        <article className="flex-[999_1_560px] min-w-0 flex flex-col gap-4">
          {lesson.theory_md ? (
            <div className="border border-border rounded-[20px] px-5 py-5">
              <TheoryMarkdown source={lesson.theory_md} />
            </div>
          ) : (
            <div className="border border-dashed border-border-dashed rounded-2xl p-5 text-center font-bold text-sm text-ink-muted">
              Bài này là luyện đề — làm các đề Zenlish bên cạnh rồi chữa bài.
            </div>
          )}
          {lesson.checkpoint && (
            <div className="border-2 border-yellow bg-yellow-pale rounded-2xl px-4 py-3.5">
              <div className="font-display font-extrabold text-xs text-yellow-shadow uppercase tracking-wide mb-1">
                Checkpoint qua bài
              </div>
              <p className="font-bold text-[15px] text-ink">{lesson.checkpoint}</p>
            </div>
          )}
          <nav aria-label="Bài trước, bài sau" className="flex justify-between gap-3 flex-wrap">
            {prev ? (
              <Link href={`/toeic/${prev.id}`} className="font-bold text-sm text-ink-muted hover:text-ink">
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/toeic/${next.id}`} className="font-bold text-sm text-ink-muted hover:text-ink">
                {next.title} →
              </Link>
            )}
          </nav>
        </article>

        <aside className="flex-[1_1_320px] min-w-0">
          <QuizPanel
            key={lesson.id}
            lessonId={lesson.id}
            sourceLabel={`${BOOK_SHORT[book.id] ?? book.title} L${lesson.lesson_no}`}
            initialCompleted={completed}
            quizzes={quizzes}
          />
        </aside>
      </div>
    </div>
  );
}
