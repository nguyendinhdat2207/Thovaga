"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { VocabWordWithProgress } from "@/lib/queries/vocab";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(word: VocabWordWithProgress, pool: VocabWordWithProgress[]): string[] {
  // Ưu tiên đáp án nhiễu đã soạn sẵn (khó phân biệt hơn) — chỉ random từ các
  // từ khác trong pool khi từ này chưa có distractors soạn sẵn.
  if (word.distractors && word.distractors.length > 0) {
    return shuffle([word.vi, ...word.distractors]);
  }
  const others = pool.filter((w) => w.id !== word.id && w.vi !== word.vi);
  const distractors = shuffle(others)
    .slice(0, 3)
    .map((w) => w.vi);
  return shuffle([word.vi, ...distractors]);
}

interface WrongItem {
  en: string;
  correctAnswer: string;
  example: string | null;
}

export function VocabQuizRunner({
  words,
  pool,
}: {
  words: VocabWordWithProgress[];
  pool: VocabWordWithProgress[];
}) {
  const router = useRouter();
  // Giữ nguyên thứ tự + đáp án rỗng lúc render server để tránh lệch hydration
  // (buildOptions dùng Math.random), xáo trộn thật sau khi mount ở client.
  const [queue, setQueue] = useState(words);
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    const shuffled = shuffle(words);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- xáo trộn client-only có chủ đích, tránh lệch hydration
    setQueue(shuffled);
    setOptions(buildOptions(shuffled[0], pool));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongList, setWrongList] = useState<WrongItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => new Date());
  const sessionSavedRef = useRef(false);

  const done = index >= queue.length;
  const current = queue[index];

  // Ghi lại thời lượng phiên quiz khi hoàn thành — chỉ 1 lần mỗi phiên.
  useEffect(() => {
    if (!done || sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    fetch("/api/vocab/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quiz",
        started_at: startedAt.toISOString(),
        finished_at: new Date().toISOString(),
        word_count: queue.length,
        correct_count: correctCount,
      }),
    }).catch(() => {
      // Không lưu được thời lượng phiên này — không ảnh hưởng trải nghiệm.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  async function pick(opt: string) {
    if (answered || submitting) return;
    setSubmitting(true);
    setPicked(opt);

    // Hiện đáp án ngay bằng dữ liệu đã có sẵn ở client (word.vi) — không đợi
    // API mới hiện được, để lỗi mạng/timeout không làm UI đứng im.
    const correct = opt === current.vi;
    const answer = current.vi;
    setCorrectAnswer(answer);
    setAnswered(true);
    if (correct) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongList((list) => [
        ...list,
        { en: current.en, correctAnswer: answer, example: current.example },
      ]);
    }

    try {
      await fetch("/api/vocab/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word_id: current.id, mode: "quiz", picked: opt }),
      });
    } catch {
      // Bỏ qua lỗi mạng — UI đã hiện kết quả, chỉ tiến trình ôn tập không lưu
      // được lần này, không ảnh hưởng trải nghiệm làm quiz.
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setPicked(null);
    setAnswered(false);
    setCorrectAnswer(null);
    if (nextIndex < queue.length) {
      setOptions(buildOptions(queue[nextIndex], pool));
    }
  }

  if (done) {
    const pct = Math.round((correctCount / queue.length) * 100);
    return (
      <div className="max-w-[560px] mx-auto px-5 py-10">
        <div className="text-center mb-6">
          <h2 className="font-display font-extrabold text-[22px] text-ink mb-3">Kết quả Quiz</h2>
          <div className="flex gap-4 justify-center">
            <div className="flex-1">
              <div className="font-display font-extrabold text-3xl text-yellow-shadow">{correctCount}</div>
              <div className="font-bold text-xs text-ink-muted mt-1">Đúng</div>
            </div>
            <div className="flex-1">
              <div className="font-display font-extrabold text-3xl text-orange">{wrongList.length}</div>
              <div className="font-bold text-xs text-ink-muted mt-1">Sai</div>
            </div>
            <div className="flex-1">
              <div className="font-display font-extrabold text-3xl text-ink">{pct}%</div>
              <div className="font-bold text-xs text-ink-muted mt-1">Tỉ lệ</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="ghost" onClick={() => router.push("/vocab")}>
              Về trang từ vựng
            </Button>
          </div>
        </div>

        {wrongList.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="font-display font-extrabold text-sm text-ink-muted uppercase tracking-wide mb-2.5">
              Từ cần xem lại
            </div>
            {wrongList.map((w, i) => (
              <div key={i} className="py-2.5 border-b border-border last:border-0">
                <span className="font-display font-extrabold text-ink">{w.en}</span>{" "}
                <span className="text-ink-muted">— {w.correctAnswer}</span>
                {w.example && (
                  <div className="font-bold text-xs text-ink-muted italic mt-0.5">&quot;{w.example}&quot;</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto px-5 py-6">
      <div className="mb-5">
        <ProgressBar percent={(index / queue.length) * 100} />
        <div className="font-bold text-xs text-ink-muted mt-1.5 text-center">
          {index + 1} / {queue.length} · {correctCount} đúng
        </div>
      </div>

      <h2 className="font-display font-extrabold text-[26px] text-ink text-center mb-5">
        {current.en}
      </h2>

      <div className="flex flex-col gap-2.5">
        {options.map((opt) => {
          const showRight = answered && opt === correctAnswer;
          const showWrong = answered && opt === picked && opt !== correctAnswer;
          return (
            <button
              key={opt}
              disabled={answered}
              onClick={() => pick(opt)}
              className={`w-full text-left rounded-2xl px-[18px] py-3.5 border-2 font-bold text-[15px] text-ink transition-colors ${
                showRight
                  ? "bg-green-pale border-green"
                  : showWrong
                    ? "bg-orange-pale border-orange"
                    : "border-border"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`mt-[18px] border rounded-2xl px-[18px] py-4 ${
            picked === correctAnswer ? "bg-green-pale border-[#BFE8CC]" : "bg-orange-pale border-[#FFD0C4]"
          }`}
        >
          <div
            className={`font-display font-extrabold text-[17px] ${
              picked === correctAnswer ? "text-green-shadow" : "text-ink"
            }`}
          >
            {picked === correctAnswer ? "Chính xác!" : "Chưa đúng"}
          </div>
          {current.example && (
            <p className="font-bold text-sm leading-relaxed text-ink mt-1 italic">
              &quot;{current.example}&quot;
            </p>
          )}
        </div>
      )}

      {answered && (
        <Button className="w-full mt-4" onClick={next}>
          {index + 1 < queue.length ? "Câu tiếp theo" : "Xem kết quả"}
        </Button>
      )}
    </div>
  );
}
