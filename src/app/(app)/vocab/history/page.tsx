import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVocabSessions } from "@/lib/queries/vocab";
import { formatDuration } from "@/lib/format";
import { LinkButton } from "@/components/ui/LinkButton";

export default async function VocabHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const supabase = await createClient();
  const { sessions, hasMore } = await getVocabSessions(supabase, page);

  return (
    <div className="max-w-[720px] mx-auto px-5 py-6 pb-10">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink">
          Lịch sử từ vựng
        </h1>
        <p className="font-bold text-sm text-ink-muted mt-0.5">
          Mọi phiên Flashcard và Quiz đã hoàn thành — bấm vào một phiên để xem lại từng từ
        </p>
        <LinkButton href="/vocab" variant="ghost" size="sm" className="mt-3">
          Về trang từ vựng
        </LinkButton>
      </div>

      {sessions.length === 0 ? (
        <p className="font-bold text-sm text-ink-muted border border-dashed border-border-dashed rounded-2xl p-5 text-center">
          Chưa có phiên nào. Làm xong một phiên Flashcard hoặc Quiz là nó sẽ hiện ở đây.
        </p>
      ) : (
        sessions.map((s) => {
          const pct = s.word_count > 0 ? Math.round((s.correct_count / s.word_count) * 100) : 0;
          return (
            <Link
              key={s.id}
              href={`/vocab/history/${s.id}`}
              className="flex items-center gap-3 py-3 border-b border-border"
            >
              <div
                className={`w-[42px] h-[42px] shrink-0 rounded-xl grid place-items-center font-display font-extrabold text-[13px] ${
                  pct >= 80 ? "bg-yellow-pill text-yellow-shadow" : "bg-badge-bg text-ink-muted"
                }`}
              >
                {pct}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ink">
                  {s.title ?? (s.mode === "quiz" ? "Quiz" : "Flashcard")}
                  {!s.completed && !s.title?.includes("dở dang") && (
                    <span className="text-orange"> · dở dang</span>
                  )}
                </div>
                <div className="font-bold text-xs text-ink-muted">
                  {new Date(s.created_at).toLocaleString("vi-VN")} · {s.correct_count}/{s.word_count}{" "}
                  {s.mode === "quiz" ? "đúng" : "đã nhớ"} · {formatDuration(s.duration_seconds)}
                </div>
              </div>
            </Link>
          );
        })
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-between mt-4 font-display font-extrabold text-sm">
          {page > 1 ? (
            <Link href={`/vocab/history?page=${page - 1}`} className="text-orange">
              ← Mới hơn
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link href={`/vocab/history?page=${page + 1}`} className="text-orange">
              Cũ hơn →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
