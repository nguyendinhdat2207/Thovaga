"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { VocabWordWithProgress } from "@/lib/queries/vocab";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

// Phải khớp với `.flip-card { transition: transform 0.5s ... }` trong
// globals.css — dùng để biết khi nào animation lật thẻ đã xong.
const FLIP_DURATION_MS = 500;

// Thứ tự thẻ do server trộn sẵn (getFlashcardWords), nên component không gọi
// Math.random lúc render — không còn lệch hydration để phải vá bằng useEffect.
export function FlashcardRunner({ words }: { words: VocabWordWithProgress[] }) {
  const router = useRouter();
  const queue = words;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Chặn thao tác trong lúc thẻ đang xoay úp lại (xem answer() bên dưới).
  // `transitioning` (state) chỉ dùng để disable nút trên giao diện; việc CHẶN
  // thật sự nằm ở transitioningRef — React re-render (nên nút mới thật sự bị
  // khoá) chỉ xảy ra sau khi hàm answer() chạy xong, nên 2 lần gọi answer()
  // dồn dập (double-tap trên điện thoại) đều đọc thấy `transitioning` là
  // false từ closure cũ và cả hai đều lọt qua nếu chỉ dựa vào state.
  const transitioningRef = useRef(false);
  const [transitioning, setTransitioning] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [startedAt, setStartedAt] = useState(() => new Date());
  const sessionSavedRef = useRef(false);

  const done = index >= queue.length;
  const current = queue[index];

  // Ghi lại thời lượng phiên ôn tập khi hoàn thành — chỉ 1 lần mỗi phiên
  // (sessionSavedRef chặn double-post nếu component re-render).
  useEffect(() => {
    if (!done || sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    fetch("/api/vocab/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "flashcard",
        started_at: startedAt.toISOString(),
        finished_at: new Date().toISOString(),
        word_count: queue.length,
        correct_count: knownCount,
      }),
    }).catch(() => {
      // Không lưu được thời lượng phiên này — không ảnh hưởng trải nghiệm.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function answer(know: boolean) {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    // Lưu tiến trình ngay, không đợi mạng — việc này không ảnh hưởng tới điều
    // người dùng nhìn thấy, mà chờ await ở đây thì mạng chậm là thẻ đứng im.
    fetch("/api/vocab/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_id: current.id, mode: "flashcard", know }),
    }).catch(() => {
      // Không lưu được tiến trình lần này — không chặn phiên ôn tập.
    });

    // Lật úp thẻ HIỆN TẠI trước (vẫn là từ đang xem), đợi animation lật xong
    // rồi mới đổi sang từ tiếp theo. Trước đây đổi index cùng lúc với
    // setFlipped(false): trong 0.5s thẻ xoay từ mặt sau về mặt trước, mặt sau
    // đã hiển thị nghĩa của từ MỚI — nhìn như thẻ tự lật ra nghĩa của từ kế
    // tiếp trước khi thấy mặt trước của nó.
    setTransitioning(true);
    setFlipped(false);
    window.setTimeout(() => {
      if (know) setKnownCount((c) => c + 1);
      setIndex((i) => i + 1);
      transitioningRef.current = false;
      setTransitioning(false);
    }, FLIP_DURATION_MS);
  }

  if (done) {
    return (
      <div className="max-w-[520px] mx-auto px-5 py-10 text-center">
        <h2 className="font-display font-extrabold text-[22px] text-ink mb-2">
          Hoàn thành phiên ôn tập
        </h2>
        <div className="flex gap-4 justify-center my-6">
          <div className="flex-1">
            <div className="font-display font-extrabold text-3xl text-yellow-shadow">{knownCount}</div>
            <div className="font-bold text-xs text-ink-muted mt-1">Đã nhớ</div>
          </div>
          <div className="flex-1">
            <div className="font-display font-extrabold text-3xl text-orange">
              {queue.length - knownCount}
            </div>
            <div className="font-bold text-xs text-ink-muted mt-1">Cần ôn lại</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={() => router.push("/vocab")}>
            Về trang từ vựng
          </Button>
          <Button
            onClick={() => {
              setIndex(0);
              setKnownCount(0);
              setFlipped(false);
              setStartedAt(new Date());
              sessionSavedRef.current = false;
              transitioningRef.current = false;
            }}
          >
            Ôn lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[520px] mx-auto px-5 py-6">
      <div className="mb-4">
        <ProgressBar percent={(index / queue.length) * 100} />
        <div className="font-bold text-xs text-ink-muted mt-1.5 text-center">
          {index + 1} / {queue.length}
        </div>
      </div>

      <div className="flip-card-wrap" style={{ minHeight: 220 }}>
        <div
          className={`flip-card ${flipped ? "flipped" : ""}`}
          style={{ minHeight: 220 }}
          onClick={() => !transitioning && setFlipped((f) => !f)}
        >
          <div className="flip-card-face front border-2 border-border rounded-2xl bg-white flex flex-col items-center justify-center text-center px-6 cursor-pointer" style={{ minHeight: 220 }}>
            <div className="font-display font-extrabold text-[28px] text-ink">{current.en}</div>
            <div className="font-bold text-xs text-ink-muted mt-2.5 uppercase tracking-wide">
              Chạm để xem nghĩa
            </div>
          </div>
          <div className="flip-card-face back border-2 border-yellow rounded-2xl bg-yellow-pale flex flex-col items-center justify-center text-center px-6 cursor-pointer" style={{ minHeight: 220 }}>
            <div className="font-display font-extrabold text-2xl text-ink">{current.vi}</div>
            {current.example && (
              <p className="font-bold text-sm text-ink-muted mt-3 italic">&quot;{current.example}&quot;</p>
            )}
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-3 mt-5">
          <Button variant="danger" className="flex-1" disabled={transitioning} onClick={() => answer(false)}>
            Chưa nhớ
          </Button>
          <Button className="flex-1" disabled={transitioning} onClick={() => answer(true)}>
            Đã nhớ
          </Button>
        </div>
      ) : (
        <p className="font-bold text-xs text-ink-muted text-center mt-4">Nhấn vào thẻ để lật</p>
      )}
    </div>
  );
}
