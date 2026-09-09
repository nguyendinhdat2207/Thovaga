import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubjectDetail } from "@/lib/queries/subjects";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatDuration, formatScore } from "@/lib/format";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const detail = await getSubjectDetail(supabase, id);
  if (!detail) notFound();

  const { subject, decks, recentAttempts } = detail;
  const totalDecks = decks.length;
  const completedDecks = decks.filter((d) => d.attemptCount > 0).length;
  const progressPct = totalDecks ? Math.round((completedDecks / totalDecks) * 100) : 0;
  const docs = decks.filter((d) => d.source_file_url);

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-5 pb-10">
      <Link href="/" className="font-bold text-[13px] text-ink-muted mb-3 inline-block">
        ← Tất cả môn học
      </Link>

      <div className="flex flex-wrap gap-5 items-end justify-between mb-2">
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-[32px] tracking-tight text-ink">
            {subject.name}
          </h1>
          <p className="font-bold text-sm text-ink-muted mt-0.5">
            {totalDecks} bộ đề · {recentAttempts.length} lần làm gần đây
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 flex-wrap my-5">
        <div className="flex-1 min-w-[240px]">
          <ProgressBar percent={progressPct} heightClassName="h-2.5" />
        </div>
        <span className="font-display font-extrabold text-lg text-ink">{progressPct}%</span>
      </div>

      <div className="flex flex-wrap gap-7 items-start">
        <div className="flex-1 min-w-[340px]">
          <h2 className="font-display font-extrabold text-lg text-ink mb-1.5">Bộ đề / chương</h2>
          {decks.length === 0 && (
            <p className="font-bold text-sm text-ink-muted border border-dashed border-border-dashed rounded-2xl p-5 text-center">
              Môn này chưa có bộ đề nào. Vào{" "}
              <Link href="/upload" className="text-orange">
                trang tải đề
              </Link>{" "}
              để import.
            </p>
          )}
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="flex items-center gap-3.5 flex-wrap py-3.5 px-1 border-b border-border"
            >
              <div
                className={`w-[38px] h-[38px] shrink-0 rounded-full grid place-items-center font-display font-extrabold text-sm ${
                  deck.attemptCount > 0 ? "bg-yellow text-ink" : "bg-track text-ink-muted"
                }`}
              >
                {deck.attemptCount > 0 ? "✓" : "•"}
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="font-display font-extrabold text-[17px] text-ink">{deck.title}</div>
                <div className="font-bold text-xs text-ink-muted">
                  {deck.attemptCount > 0
                    ? `làm ${deck.attemptCount} lần · cao nhất ${formatScore(deck.bestScore ?? 0)}`
                    : "chưa làm bài"}
                </div>
              </div>
              <LinkButton
                href={`/quiz/${deck.id}`}
                variant={deck.attemptCount > 0 ? "ghost" : "solid"}
                size="sm"
              >
                {deck.attemptCount > 0 ? "Làm lại" : "Bắt đầu"}
              </LinkButton>
            </div>
          ))}
        </div>

        <aside className="flex-1 min-w-[250px] max-w-[320px] flex flex-col gap-6">
          <div>
            <div className="font-display font-extrabold text-[17px] text-ink mb-1.5">
              Lần làm gần đây
            </div>
            {recentAttempts.length === 0 ? (
              <p className="font-bold text-[13px] leading-relaxed text-ink-muted">
                Chưa có lần làm nào cho môn này.
              </p>
            ) : (
              recentAttempts.map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink">{a.deckTitle}</div>
                    <div className="font-bold text-xs text-ink-muted">
                      {new Date(a.created_at).toLocaleDateString("vi-VN")} ·{" "}
                      {formatDuration(a.duration_seconds)}
                    </div>
                  </div>
                  <span
                    className={`font-display font-extrabold text-[17px] ${
                      a.score >= 8 ? "text-yellow-shadow" : "text-ink-muted"
                    }`}
                  >
                    {formatScore(a.score)}
                  </span>
                </div>
              ))
            )}
          </div>

          {docs.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="font-display font-extrabold text-[17px] text-ink mb-2.5">
                Tài liệu của môn
              </div>
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-[26px] h-8 rounded shrink-0 bg-orange" />
                  <div className="min-w-0 font-bold text-[13px] text-ink overflow-hidden text-ellipsis">
                    {d.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
