import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAttemptResult } from "@/lib/queries/attempts";
import { Mascot } from "@/components/ui/Mascot";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatDuration, formatScore } from "@/lib/format";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ deckId: string; attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();
  const result = await getAttemptResult(supabase, attemptId);
  if (!result) notFound();

  const { attempt, deck, subjectName, previousAttempts, wrongAnswers } = result;
  const bars = [...previousAttempts, { score: attempt.score, created_at: attempt.created_at }];
  const max = Math.max(10, ...bars.map((b) => b.score));
  const prevScore = previousAttempts[previousAttempts.length - 1]?.score;
  const delta = prevScore !== undefined ? attempt.score - prevScore : null;

  return (
    <div className="max-w-[640px] mx-auto px-5 py-8 pb-11 text-center">
      <Mascot size={140} className="mx-auto" priority />
      <h1 className="mt-5 font-display font-extrabold text-[clamp(26px,5.4vw,34px)] tracking-tight text-ink">
        Xong {deck.title}!
      </h1>
      <p className="mt-1 font-bold text-sm text-ink-muted mb-6">
        {subjectName} · lần làm thứ {previousAttempts.length + 1}
      </p>

      <div className="grid grid-cols-3 border border-border rounded-2xl overflow-hidden">
        <Stat value={formatScore(attempt.score)} label="Điểm /10" />
        <Stat value={formatDuration(attempt.duration_seconds)} label="thời gian làm" bordered />
        <Stat
          value={`${attempt.total_questions}`}
          label="tổng số câu"
        />
      </div>

      <div className="mt-5 text-left">
        <div className="flex justify-between items-center gap-3 mb-3.5">
          <span className="font-display font-extrabold text-base text-ink">So với các lần trước</span>
          <span
            className={`font-display font-extrabold text-[13px] ${
              delta === null ? "text-ink-muted" : delta >= 0 ? "text-orange" : "text-ink-muted"
            }`}
          >
            {delta === null ? "lần đầu làm" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} điểm`}
          </span>
        </div>
        <div className="flex items-end gap-3 h-24">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className={`rounded-md ${i === bars.length - 1 ? "bg-yellow" : "bg-track"}`}
                style={{ height: `${Math.max(6, (b.score / max) * 74)}px` }}
              />
              <div
                className={`mt-1.5 ${i === bars.length - 1 ? "font-bold text-ink" : "font-bold text-ink-muted"} text-[11px]`}
              >
                {formatScore(b.score)} ·{" "}
                {new Date(b.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {wrongAnswers.length > 0 && (
        <div className="mt-7 text-left border-t border-border pt-5">
          <div className="font-display font-extrabold text-[17px] text-ink mb-3">Câu cần xem lại</div>
          {wrongAnswers.map((w, i) => (
            <div key={i} className="border border-border rounded-2xl px-4 py-3.5 mb-2.5">
              <div className="font-bold text-[11px] text-orange uppercase tracking-wider mb-1.5">
                Câu {i + 1} · sai
              </div>
              <div className="font-bold text-[15px] leading-relaxed text-ink mb-2.5">{w.prompt}</div>
              <div className="font-bold text-[13px] leading-relaxed text-ink-muted">
                Bạn chọn: {w.pickedOption !== null ? w.options[w.pickedOption] : "(bỏ qua)"}
              </div>
              <div className="font-display font-extrabold text-[13px] leading-relaxed text-yellow-shadow">
                Đáp án: {w.options[w.correctOption]}
                {w.explanation ? ` — ${w.explanation}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 mt-6 flex-wrap">
        <LinkButton href={`/subjects/${deck.subject_id}`} variant="ghost" size="lg" className="flex-1 min-w-[150px]">
          Về trang môn
        </LinkButton>
        <LinkButton href={`/quiz/${deck.id}`} size="lg" className="flex-1 min-w-[150px]">
          Làm lại
        </LinkButton>
      </div>
    </div>
  );
}

function Stat({ value, label, bordered }: { value: string; label: string; bordered?: boolean }) {
  return (
    <div className={`py-4 px-1.5 ${bordered ? "border-x border-border" : ""}`}>
      <div className="font-display font-extrabold text-[clamp(24px,6vw,32px)] leading-none text-ink">
        {value}
      </div>
      <div className="font-bold text-xs text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
