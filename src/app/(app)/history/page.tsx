import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getHistory } from "@/lib/queries/attempts";
import { formatDuration, formatHours, formatMinutesShort, formatScore } from "@/lib/format";
import { WeekChart } from "@/components/WeekChart";
import { LinkButton } from "@/components/ui/LinkButton";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const supabase = await createClient();
  const { attempts, stats, hasMore } = await getHistory(supabase, page);

  const weekMinutes = stats.weeklyMinutesByDay.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6 pb-11">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-[clamp(24px,4.6vw,32px)] tracking-tight text-ink">
          Lịch sử học tập
        </h1>
        <p className="font-bold text-sm text-ink-muted mt-0.5">Toàn bộ các lần làm bài đã ghi lại — bấm vào một lần để xem lại</p>
        <LinkButton href="/vocab/history" variant="ghost" size="sm" className="mt-3">
          Lịch sử từ vựng
        </LinkButton>
      </div>

      <div
        className="grid border border-border rounded-2xl overflow-hidden mb-7"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
      >
        <StatCell value={formatHours(stats.totalMinutes)} label="tổng thời gian học" />
        <StatCell value={String(stats.attemptCount)} label="lần làm bài" />
        <StatCell value={stats.averageScore.toFixed(1)} label="điểm trung bình" />
      </div>

      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-1 min-w-[340px]">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <div className="font-display font-extrabold text-lg text-ink">7 ngày gần đây</div>
            <div className="font-bold text-xs text-ink-muted">
              tổng {formatHours(weekMinutes)} · trung bình {formatMinutesShort(Math.round(weekMinutes / 7))}/ngày
            </div>
          </div>
          <WeekChart data={stats.weeklyMinutesByDay} size="lg" />
        </div>

        <div className="flex-1 min-w-[280px]">
          <div className="font-display font-extrabold text-lg text-ink mb-1.5">Mọi lần làm bài</div>
          {attempts.length === 0 ? (
            <p className="font-bold text-sm text-ink-muted mt-3">Chưa có lần làm bài nào.</p>
          ) : (
            attempts.map((a) => (
              <Link
                key={a.id}
                href={`/quiz/${a.deck_id}/result/${a.id}`}
                className="flex items-center gap-3 py-3 border-b border-border"
              >
                <div
                  className={`w-[42px] h-[42px] shrink-0 rounded-xl grid place-items-center font-display font-extrabold text-[15px] ${
                    a.score >= 8 ? "bg-yellow-pill text-yellow-shadow" : "bg-badge-bg text-ink-muted"
                  }`}
                >
                  {formatScore(a.score)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-ink">
                    {a.subjectName} · {a.deckTitle}
                    {!a.completed && <span className="text-orange"> · làm dở</span>}
                  </div>
                  <div className="font-bold text-xs text-ink-muted">
                    {new Date(a.created_at).toLocaleDateString("vi-VN")} ·{" "}
                    {formatDuration(a.duration_seconds)}
                  </div>
                </div>
              </Link>
            ))
          )}
          {(page > 1 || hasMore) && (
            <div className="flex justify-between mt-4 font-display font-extrabold text-sm">
              {page > 1 ? (
                <Link href={`/history?page=${page - 1}`} className="text-orange">
                  ← Mới hơn
                </Link>
              ) : (
                <span />
              )}
              {hasMore && (
                <Link href={`/history?page=${page + 1}`} className="text-orange">
                  Cũ hơn →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-[18px] border-r border-border last:border-r-0">
      <div className="font-display font-extrabold text-[clamp(22px,3.4vw,30px)] leading-tight text-ink">
        {value}
      </div>
      <div className="font-bold text-xs text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
