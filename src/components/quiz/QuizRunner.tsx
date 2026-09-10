"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Deck, Question, Subject } from "@/lib/database.types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/format";

type DeckWithSubject = Deck & { subject: Pick<Subject, "id" | "name" | "category"> | null };

interface AnswerRecord {
  question_id: string;
  selected_option: number | null;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizRunner({
  deck,
  questions,
}: {
  deck: DeckWithSubject;
  questions: Question[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [startedAt] = useState(() => new Date());
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const current = questions[index];
  const elapsedSeconds = Math.round((now - startedAt.getTime()) / 1000);
  const isLast = index + 1 >= questions.length;

  async function finish(finalAnswers: AnswerRecord[]) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck_id: deck.id,
          started_at: startedAt.toISOString(),
          finished_at: new Date().toISOString(),
          answers: finalAnswers,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Không lưu được kết quả.");
      router.push(`/quiz/${deck.id}/result/${body.attempt.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Lỗi không xác định.");
      setSubmitting(false);
    }
  }

  function selectAndCheck(i: number) {
    if (checked) return;
    setPicked(i);
    setChecked(true);
  }

  function next() {
    const record: AnswerRecord = { question_id: current.id, selected_option: picked };
    const nextAnswers = [...answers, record];
    if (isLast) {
      finish(nextAnswers);
      return;
    }
    setAnswers(nextAnswers);
    setIndex(index + 1);
    setPicked(null);
    setChecked(false);
  }

  function skip() {
    const record: AnswerRecord = { question_id: current.id, selected_option: null };
    const nextAnswers = [...answers, record];
    if (isLast) {
      finish(nextAnswers);
      return;
    }
    setAnswers(nextAnswers);
    setIndex(index + 1);
    setPicked(null);
    setChecked(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div
        className="border-b border-border sticky top-0 bg-white"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-[820px] mx-auto px-5 py-3.5 flex items-center gap-3.5">
          <button
            onClick={() => router.push(`/subjects/${deck.subject_id}`)}
            className="font-display font-extrabold text-xl text-ink-faint px-1"
          >
            ✕
          </button>
          <div className="flex-1 h-2 bg-track rounded-full overflow-hidden">
            <ProgressBar percent={(index / questions.length) * 100} />
          </div>
          <span className="font-display font-extrabold text-[15px] text-ink whitespace-nowrap">
            {index + 1}/{questions.length}
          </span>
          <span className="font-bold text-sm text-ink-muted whitespace-nowrap">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-[820px] w-full mx-auto px-5 py-7 pb-8">
        <div className="font-bold text-xs text-ink-muted uppercase tracking-wider mb-3">
          {deck.subject?.name ?? ""} · {deck.title}
        </div>

        <h2 className="font-display font-bold text-[clamp(21px,3.6vw,27px)] leading-[1.42] text-ink mb-6">
          {current.prompt}
        </h2>

        <div className="flex flex-col gap-2.5">
          {current.options.map((label, i) => {
            const isPicked = picked === i;
            const isAnswer = current.correct_option === i;
            const showRight = checked && isAnswer;
            const showWrong = checked && isPicked && !isAnswer;

            return (
              <button
                key={i}
                disabled={checked}
                onClick={() => selectAndCheck(i)}
                className={`w-full flex items-center gap-3.5 text-left rounded-2xl px-[18px] py-4 border transition-colors ${
                  showRight
                    ? "bg-yellow-pale border-yellow border-2"
                    : showWrong
                      ? "bg-orange-pale border-orange border-2"
                      : isPicked
                        ? "border-yellow border-2 shadow-[0_4px_0_var(--color-yellow)]"
                        : "border-border"
                }`}
              >
                <span
                  className={`w-7 h-7 shrink-0 rounded-lg grid place-items-center font-display font-extrabold text-[13px] ${
                    showRight || isPicked ? "bg-yellow text-ink" : "bg-badge-bg text-ink-muted"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className={`text-[17px] text-ink ${isPicked || showRight ? "font-extrabold" : "font-bold"}`}>
                  {label}
                </span>
                <span className="flex-1" />
                {(showRight || showWrong) && (
                  <span
                    className={`font-display font-extrabold text-xs whitespace-nowrap ${
                      showRight ? "text-yellow-shadow" : "text-orange"
                    }`}
                  >
                    {showRight ? "đáp án đúng" : "bạn chọn"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {checked && (
          <div
            className={`mt-[18px] border rounded-2xl px-[18px] py-4 ${
              picked === current.correct_option
                ? "bg-yellow-pale border-[#FFE1A1]"
                : "bg-orange-pale border-[#FFD0C4]"
            }`}
          >
            <div className="font-display font-extrabold text-[17px] text-ink">
              {picked === current.correct_option ? "Chính xác!" : "Chưa đúng"}
            </div>
            {current.explanation && (
              <p className="font-bold text-sm leading-relaxed text-ink mt-1">{current.explanation}</p>
            )}
          </div>
        )}

        {submitError && (
          <p className="font-bold text-sm text-orange mt-4">{submitError}</p>
        )}
      </div>

      <div
        className="border-t border-border sticky bottom-0 bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-[820px] mx-auto px-5 py-4 pb-5 flex items-center justify-between gap-3.5">
          <button onClick={skip} disabled={submitting} className="font-display font-bold text-[15px] text-ink-muted px-1 py-3">
            Bỏ qua
          </button>
          {checked && (
            <Button onClick={next} disabled={submitting} size="lg">
              {submitting ? "Đang lưu..." : isLast ? "Xem kết quả" : "Câu tiếp theo"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
