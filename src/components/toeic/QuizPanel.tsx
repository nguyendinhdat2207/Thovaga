"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InboxQuickAdd } from "@/components/vocab/InboxQuickAdd";
import type { QuizStat } from "@/lib/queries/toeic";
import type { ToeicQuiz } from "@/lib/database.types";
import {
  MISTAKE_TYPES,
  TOEIC_MAX_QUESTIONS,
  scoreTone,
  zenlishQuizUrl,
  type MistakeType,
} from "@/lib/toeic";

type QuizWithStat = ToeicQuiz & { stat: QuizStat | null };

const TONE_CLASS = {
  good: "text-green-shadow",
  ok: "text-ink",
  low: "text-orange",
} as const;

function QuizRow({
  quiz,
  open,
  onToggle,
  onSaved,
}: {
  quiz: QuizWithStat;
  open: boolean;
  onToggle: () => void;
  onSaved: (correct: number, total: number) => void;
}) {
  const defaultTotal = quiz.question_count ?? quiz.stat?.lastTotal ?? null;
  const [correct, setCorrect] = useState("");
  const [total, setTotal] = useState(defaultTotal ? String(defaultTotal) : "");
  const [mistake, setMistake] = useState<MistakeType | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const c = Number(correct);
    const t = Number(total);
    if (!Number.isInteger(t) || t < 1 || t > TOEIC_MAX_QUESTIONS) {
      setError(`Tổng số câu từ 1 đến ${TOEIC_MAX_QUESTIONS}.`);
      return;
    }
    if (correct === "" || !Number.isInteger(c) || c < 0 || c > t) {
      setError("Số câu đúng phải từ 0 đến tổng số câu.");
      return;
    }
    setSaving(true);
    setError(null);
    // Điểm tự nhập là thứ không lấy lại được nếu mất → hiện lỗi và cho thử lại
    // (giống nộp bài ở QuizRunner), không nuốt lỗi như tiến trình phụ.
    try {
      const res = await fetch("/api/toeic/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_slug: quiz.slug,
          correct: c,
          total: t,
          mistake_type: mistake || null,
          note,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Không lưu được, thử lại nhé.");
      }
      onSaved(c, t);
      setCorrect("");
      setMistake("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được, thử lại nhé.");
    } finally {
      setSaving(false);
    }
  }

  const stat = quiz.stat;
  const tone = stat ? TONE_CLASS[scoreTone(stat.lastCorrect, stat.lastTotal)] : "";

  return (
    <li
      className={`rounded-xl px-3 py-2.5 ${
        open ? "border-2 border-yellow bg-yellow-pale" : stat ? "bg-green-pale" : "border border-border"
      }`}
    >
      <div className="flex items-center gap-2.5 min-h-[32px]">
        <a
          href={zenlishQuizUrl(quiz.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 font-bold text-[14px] text-ink hover:underline"
        >
          {quiz.title} <span aria-hidden>↗</span>
          <span className="sr-only"> (mở Zenlish ở tab mới)</span>
        </a>
        {stat ? (
          <span className={`font-display font-extrabold text-sm whitespace-nowrap ${tone}`}>
            {stat.lastCorrect}/{stat.lastTotal}
            {stat.attempts > 1 && (
              <span className="font-bold text-[11px] text-ink-muted"> · {stat.attempts} lần</span>
            )}
          </span>
        ) : (
          <span className="font-bold text-xs text-ink-muted whitespace-nowrap">chưa làm</span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="font-display font-extrabold text-xs text-ink-muted hover:text-ink px-2 py-1.5 rounded-lg border border-border bg-white whitespace-nowrap"
        >
          {open ? "Đóng" : "Ghi điểm"}
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="mt-3 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-end gap-2.5">
            <label className="flex flex-col gap-1 font-bold text-xs text-ink-muted">
              Số câu đúng
              <span className="flex items-center gap-1.5 font-display font-extrabold text-[15px] text-ink">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={correct}
                  onChange={(e) => setCorrect(e.target.value)}
                  className="w-16 border border-border rounded-xl px-2.5 py-2 bg-white outline-none focus:border-yellow"
                  required
                />
                /
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={TOEIC_MAX_QUESTIONS}
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  readOnly={quiz.question_count != null}
                  aria-label="Tổng số câu"
                  className="w-16 border border-border rounded-xl px-2.5 py-2 bg-white outline-none focus:border-yellow read-only:bg-badge-bg"
                  required
                />
              </span>
            </label>
            <label className="flex-1 min-w-[150px] flex flex-col gap-1 font-bold text-xs text-ink-muted">
              Lỗi chính
              <select
                value={mistake}
                onChange={(e) => setMistake(e.target.value as MistakeType | "")}
                className="border border-border rounded-xl px-2.5 py-2 bg-white font-bold text-sm text-ink outline-none focus:border-yellow"
              >
                <option value="">—</option>
                {(Object.keys(MISTAKE_TYPES) as MistakeType[]).map((k) => (
                  <option key={k} value={k}>
                    {MISTAKE_TYPES[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 font-bold text-xs text-ink-muted">
            Ghi chú (câu sai, bẫy gặp phải…)
            <input
              type="text"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              className="border border-border rounded-xl px-3 py-2 bg-white font-bold text-sm text-ink outline-none focus:border-yellow"
            />
          </label>
          {error && <p className="font-bold text-xs text-orange">{error}</p>}
          <Button type="submit" size="sm" disabled={saving} className="self-start">
            {saving ? "Đang lưu..." : "Lưu điểm"}
          </Button>
        </form>
      )}
    </li>
  );
}

export function QuizPanel({
  lessonId,
  sourceLabel,
  initialCompleted,
  quizzes: initialQuizzes,
}: {
  lessonId: string;
  sourceLabel: string;
  initialCompleted: boolean;
  quizzes: QuizWithStat[];
}) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [completed, setCompleted] = useState(initialCompleted);

  function handleSaved(slug: string, correct: number, total: number) {
    setQuizzes((qs) =>
      qs.map((q) =>
        q.slug === slug
          ? {
              ...q,
              stat: {
                attempts: (q.stat?.attempts ?? 0) + 1,
                lastCorrect: correct,
                lastTotal: total,
                lastAt: new Date().toISOString(),
                bestRatio: Math.max(q.stat?.bestRatio ?? 0, correct / total),
              },
            }
          : q
      )
    );
    setOpenSlug(null);
  }

  async function toggleCompleted() {
    const next = !completed;
    // Cập nhật lạc quan như /roadmap; lỗi mạng chỉ làm mất lần tick này.
    setCompleted(next);
    try {
      await fetch("/api/toeic/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId, completed: next }),
      });
    } catch {
      // Bỏ qua có chủ đích — tick lại được khi tải lại trang thấy mất.
    }
  }

  const groups = [
    { key: "lesson", label: "Bài trên lớp", items: quizzes.filter((q) => q.kind === "lesson") },
    {
      key: "homework",
      label: "Bài về nhà · làm hôm sau",
      items: quizzes.filter((q) => q.kind === "homework"),
    },
  ].filter((g) => g.items.length > 0);
  const doneCount = quizzes.filter((q) => q.stat).length;

  return (
    <div className="flex flex-col gap-4">
      <section className="border-2 border-border rounded-[20px] p-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display font-extrabold text-[18px] text-ink">Đề trên Zenlish</h2>
          {quizzes.length > 0 && (
            <span className="font-bold text-xs text-ink-muted">
              {doneCount}/{quizzes.length} đã làm
            </span>
          )}
        </div>
        {quizzes.length === 0 ? (
          <p className="font-bold text-sm text-ink-muted">
            Bài này không có đề trên web — học lý thuyết rồi đánh dấu xong.
          </p>
        ) : (
          <>
            <p className="font-bold text-xs text-ink-faint">
              Bấm tên đề để mở Zenlish ở tab mới. Làm xong quay lại bấm “Ghi điểm”.
            </p>
            {groups.map((g) => (
              <div key={g.key} className="flex flex-col gap-2">
                <div className="font-display font-extrabold text-[11px] text-ink-muted uppercase tracking-wide">
                  {g.label}
                </div>
                <ul className="flex flex-col gap-2">
                  {g.items.map((q) => (
                    <QuizRow
                      key={q.slug}
                      quiz={q}
                      open={openSlug === q.slug}
                      onToggle={() => setOpenSlug(openSlug === q.slug ? null : q.slug)}
                      onSaved={(c, t) => handleSaved(q.slug, c, t)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>

      <section className="border border-dashed border-border-dashed rounded-[20px] p-4 flex flex-col gap-2.5">
        <h2 className="font-display font-extrabold text-[16px] text-ink">Sổ ghi nhanh từ mới</h2>
        <p className="font-bold text-xs text-ink-faint">
          Gặp từ lạ trong đề thì ghi vội ở đây — cuối tuần vào Từ vựng › Sổ ghi nhanh để copy sang
          Claude chuẩn hoá.
        </p>
        <InboxQuickAdd defaultSource={sourceLabel} />
      </section>

      <Button
        variant={completed ? "ghost" : "solid"}
        onClick={toggleCompleted}
        className="w-full"
      >
        {completed ? "✓ Đã học xong · bấm để bỏ" : "Đánh dấu học xong bài này"}
      </Button>
    </div>
  );
}
