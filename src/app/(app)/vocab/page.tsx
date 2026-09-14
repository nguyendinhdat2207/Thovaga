import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVocabDecks, getWeeklyMistakeCount } from "@/lib/queries/vocab";
import { LinkButton } from "@/components/ui/LinkButton";

export default async function VocabPage() {
  const supabase = await createClient();
  const [decks, weeklyMistakeCount] = await Promise.all([
    getVocabDecks(supabase),
    getWeeklyMistakeCount(supabase),
  ]);

  const totalWords = decks.reduce((sum, d) => sum + d.wordCount, 0);
  const totalDue = decks.reduce((sum, d) => sum + d.dueCount, 0);

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink">
            Từ vựng
          </h1>
          <p className="font-bold text-sm text-ink-muted mt-0.5">
            {totalWords} từ · {decks.length} bộ · {totalDue} từ cần ôn hôm nay
          </p>
        </div>
        <LinkButton href="/vocab/import" variant="ghost" size="sm">
          + Thêm từ mới
        </LinkButton>
      </div>

      <div className="flex flex-wrap gap-3.5 mb-2.5">
        <LinkButton
          href={`/vocab/flashcard?scope=due`}
          size="lg"
          className={totalDue === 0 ? "pointer-events-none opacity-50" : ""}
        >
          Ôn hôm nay ({totalDue})
        </LinkButton>
        <LinkButton href={`/vocab/quiz?scope=all`} variant="ghost" size="lg">
          Quiz tất cả từ
        </LinkButton>
        <LinkButton href="/vocab/bank" variant="ghost" size="lg">
          Kho từ
        </LinkButton>
        {weeklyMistakeCount > 0 && (
          <LinkButton href="/vocab/quiz?scope=mistakes" variant="danger" size="lg">
            Từ sai tuần này ({weeklyMistakeCount})
          </LinkButton>
        )}
      </div>

      <p className="font-bold text-xs text-ink-faint mb-7">
        {weeklyMistakeCount > 0
          ? "Reset vào thứ Hai hàng tuần — làm đúng lại thì từ đó tự ra khỏi danh sách."
          : "Từ nào chọn sai ở quiz sẽ tự vào “Từ sai tuần này” để ôn lại cuối tuần — hiện chưa sai từ nào."}
      </p>

      <h2 className="font-display font-extrabold text-[19px] text-ink mb-3.5">
        Các bộ từ theo ngày
      </h2>

      {decks.length === 0 ? (
        <p className="font-bold text-sm text-ink-muted border border-dashed border-border-dashed rounded-2xl p-5 text-center">
          Chưa có bộ từ nào. Vào{" "}
          <Link href="/vocab/import" className="text-orange">
            trang thêm từ
          </Link>{" "}
          để tạo bộ từ đầu tiên.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5 py-3.5 px-1 border-b border-border"
            >
              <div className="flex items-center gap-3.5 sm:flex-1 min-w-0">
                <div
                  className={`w-[38px] h-[38px] shrink-0 rounded-full grid place-items-center font-display font-extrabold text-sm ${
                    deck.dueCount > 0 ? "bg-yellow text-ink" : "bg-track text-ink-muted"
                  }`}
                  title={
                    deck.completedCount > 0
                      ? `Đã hoàn thành ${deck.completedCount} lần${deck.dueCount > 0 ? ` · ${deck.dueCount} từ cần ôn hôm nay` : ""}`
                      : deck.dueCount > 0
                        ? `${deck.dueCount} từ cần ôn hôm nay`
                        : "Chưa có từ nào đến hạn ôn"
                  }
                >
                  {/* Số trong vòng LUÔN là "đã hoàn thành mấy lần" — cộng dồn vĩnh
                      viễn, không đổi theo lịch ôn Leitner. Trước đây số này là due
                      count (đổi mỗi ngày) và chỉ hiện ✓ khi due = 0, nên hôm sau lịch
                      ôn quay vòng lại là mất dấu, nhìn như hôm qua chưa học gì dù đã
                      học xong. Màu vòng (vàng/xám) mới là thứ đổi theo due hôm nay —
                      chỉ báo hiệu "có cần ôn không", không che mất số lần đã học. */}
                  {deck.completedCount > 0 ? deck.completedCount : deck.dueCount > 0 ? deck.dueCount : "✓"}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-extrabold text-[17px] text-ink">{deck.title}</div>
                  <div className="font-bold text-xs text-ink-muted">
                    {deck.wordCount} từ
                    {deck.dueCount > 0 && ` · ${deck.dueCount} cần ôn`}
                    {deck.completedCount > 0 && ` · đã học ${deck.completedCount} lần`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <LinkButton href={`/vocab/flashcard?deckId=${deck.id}`} variant="ghost" size="sm" className="flex-1 sm:flex-none">
                  Flashcard
                </LinkButton>
                <LinkButton href={`/vocab/quiz?deckId=${deck.id}`} variant="ghost" size="sm" className="flex-1 sm:flex-none">
                  Quiz
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
