import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSubjectsWithProgress } from "@/lib/queries/subjects";
import { getHistory, getContinueDeckId } from "@/lib/queries/attempts";
import { Mascot } from "@/components/ui/Mascot";
import { LinkButton } from "@/components/ui/LinkButton";
import { SubjectCard } from "@/components/subjects/SubjectCard";
import { SubjectRow } from "@/components/subjects/SubjectRow";
import { WeekChart } from "@/components/WeekChart";

export default async function HomePage() {
  const supabase = await createClient();

  const [subjects, { stats }, continueDeckId] = await Promise.all([
    getSubjectsWithProgress(supabase),
    getHistory(supabase),
    getContinueDeckId(supabase),
  ]);

  const schoolSubjects = subjects.filter((s) => s.category === "school");
  const otherSubjects = subjects.filter((s) => s.category !== "school");

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6 pb-10">
      <div className="flex items-center gap-4 flex-wrap mb-7">
        <Mascot size={68} priority />
        <div className="flex-1 min-w-[240px]">
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink">
            Chào bạn, học tiếp nhé!
          </h1>
          <p className="font-bold text-sm text-ink-muted mt-0.5">
            {stats.attemptCount} lần làm bài đã ghi lại · điểm trung bình {stats.averageScore.toFixed(1)}
          </p>
        </div>
        {continueDeckId && (
          <LinkButton size="lg" href={`/quiz/${continueDeckId}`}>
            Tiếp tục học
          </LinkButton>
        )}
      </div>

      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-1 min-w-[320px] flex flex-col gap-7">
          <section>
            <div className="flex items-baseline gap-2.5 mb-3.5">
              <h2 className="font-display font-extrabold text-[19px] text-ink">Môn học ở trường</h2>
            </div>
            {schoolSubjects.length === 0 ? (
              <EmptySubjects />
            ) : (
              <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {schoolSubjects.map((s) => (
                  <SubjectCard key={s.id} subject={s} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display font-extrabold text-[19px] text-ink mb-1">
              Data &amp; AI · TOEIC
            </h2>
            {otherSubjects.length === 0 ? (
              <EmptySubjects />
            ) : (
              <div>
                {otherSubjects.map((s) => (
                  <SubjectRow key={s.id} subject={s} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex-1 min-w-[230px] max-w-[320px] flex flex-col gap-6">
          <div>
            <div className="font-display font-extrabold text-[17px] text-ink mb-3">Tuần này</div>
            <WeekChart data={stats.weeklyMinutesByDay} />
          </div>
          <div className="border-t border-border pt-[18px]">
            <div className="font-display font-extrabold text-[17px] text-ink">Tải đề lên</div>
            <p className="font-bold text-[13px] leading-relaxed text-ink-muted mt-1 mb-3">
              Thêm PDF đề thi hoặc dán JSON câu hỏi để tạo bộ đề mới.
            </p>
            <LinkButton variant="ghost" size="sm" href="/upload">
              Đi tới trang tải đề
            </LinkButton>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptySubjects() {
  return (
    <p className="font-bold text-sm text-ink-muted border border-dashed border-border-dashed rounded-2xl p-5 text-center">
      Chưa có môn học nào. Vào{" "}
      <Link href="/upload" className="text-orange">
        trang tải đề
      </Link>{" "}
      để import bộ câu hỏi đầu tiên.
    </p>
  );
}
