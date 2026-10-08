import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVocabSession } from "@/lib/queries/vocab";
import { formatDuration } from "@/lib/format";
import { LinkButton } from "@/components/ui/LinkButton";

export default async function VocabSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const session = await getVocabSession(supabase, id);
  if (!session) notFound();

  const isQuiz = session.mode === "quiz";
  const answers = session.answers;
  const wrong = answers.filter((a) => !a.correct);
  const right = answers.filter((a) => a.correct);

  return (
    <div className="max-w-[640px] mx-auto px-5 py-6 pb-11">
      <h1 className="font-display font-extrabold text-[26px] tracking-tight text-ink">
        {session.title ?? (isQuiz ? "Quiz" : "Flashcard")}
      </h1>
      <p className="font-bold text-sm text-ink-muted mt-0.5 mb-5">
        {new Date(session.created_at).toLocaleString("vi-VN")} ·{" "}
        {formatDuration(session.duration_seconds)}
      </p>

      <div className="grid grid-cols-3 border border-border rounded-2xl overflow-hidden mb-6 text-center">
        <Stat value={session.correct_count} label={isQuiz ? "Đúng" : "Đã nhớ"} />
        <Stat value={session.word_count - session.correct_count} label={isQuiz ? "Sai" : "Cần ôn lại"} />
        <Stat value={session.word_count} label="Tổng số từ" />
      </div>

      {answers.length === 0 ? (
        <p className="font-bold text-sm text-ink-muted border border-dashed border-border-dashed rounded-2xl p-5 text-center">
          Phiên này được ghi trước khi app lưu chi tiết từng từ nên chỉ còn số liệu tổng.
        </p>
      ) : (
        <>
          <Section title={isQuiz ? "Từ làm sai" : "Từ chưa nhớ"} items={wrong} tone="wrong" isQuiz={isQuiz} />
          <Section title={isQuiz ? "Từ làm đúng" : "Từ đã nhớ"} items={right} tone="right" isQuiz={isQuiz} />
        </>
      )}

      <div className="flex gap-2.5 mt-6">
        <LinkButton href="/vocab/history" variant="ghost" size="lg" className="flex-1">
          Về lịch sử
        </LinkButton>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="py-4 px-1.5 border-r border-border last:border-r-0">
      <div className="font-display font-extrabold text-[28px] leading-none text-ink">{value}</div>
      <div className="font-bold text-xs text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}

function Section({
  title,
  items,
  tone,
  isQuiz,
}: {
  title: string;
  items: { en: string; vi: string; example?: string | null; picked: string | null }[];
  tone: "wrong" | "right";
  isQuiz: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <div
        className={`font-display font-extrabold text-sm uppercase tracking-wide mb-2.5 ${
          tone === "wrong" ? "text-orange" : "text-green-shadow"
        }`}
      >
        {title} ({items.length})
      </div>
      {items.map((w, i) => (
        <div key={i} className="py-2.5 border-b border-border last:border-0">
          <span className="font-display font-extrabold text-ink">{w.en}</span>{" "}
          <span className="text-ink-muted">— {w.vi}</span>
          {isQuiz && tone === "wrong" && w.picked && (
            <div className="font-bold text-xs text-orange mt-0.5">Bạn chọn: {w.picked}</div>
          )}
          {w.example && (
            <div className="font-bold text-xs text-ink-muted italic mt-0.5">&quot;{w.example}&quot;</div>
          )}
        </div>
      ))}
    </div>
  );
}
