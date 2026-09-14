import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVocabQuizItems, getWeeklyMistakeQuizItems, VOCAB_QUIZ_OPTION_COUNT } from "@/lib/queries/vocab";
import { VocabQuizRunner } from "@/components/vocab/VocabQuizRunner";
import { LinkButton } from "@/components/ui/LinkButton";
import { Mascot } from "@/components/ui/Mascot";

export default async function VocabQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; deckId?: string }>;
}) {
  const { scope, deckId } = await searchParams;
  const supabase = await createClient();

  // "Ôn từ sai tuần này" là 1 nhánh riêng: nguồn câu hỏi khác (sổ
  // vocab_weekly_mistakes thay vì 1 bộ/đến hạn), và 0 từ ở đây là chuyện BÌNH
  // THƯỜNG (nghĩa là tuần này chưa sai từ nào) — không phải lỗi 404 như các
  // nhánh khác khi không đủ từ.
  if (scope === "mistakes") {
    const items = await getWeeklyMistakeQuizItems(supabase);
    if (items.length === 0) {
      return (
        <div className="max-w-[420px] mx-auto px-5 py-16 text-center">
          <Mascot size={72} className="mx-auto mb-4" />
          <h2 className="font-display font-extrabold text-xl text-ink mb-2">
            Chưa có từ nào sai tuần này
          </h2>
          <p className="font-bold text-sm text-ink-muted mb-6">
            Cứ tiếp tục học — từ nào chọn sai ở quiz sẽ tự động vào đây để ôn lại.
          </p>
          <LinkButton href="/vocab">Về trang từ vựng</LinkButton>
        </div>
      );
    }
    // Không cần đủ 4 từ mới cho làm — đây là danh sách cần ôn, có 1-2 từ vẫn
    // đáng ôn, không nên bắt tích luỹ đủ số lượng mới cho bắt đầu.
    return <VocabQuizRunner items={items} title="Ôn từ sai tuần này" />;
  }

  // Câu hỏi (kèm 4 lựa chọn đã trộn) dựng sẵn ở server — client không cần nhận
  // cả kho từ để tự bốc đáp án nhiễu nữa.
  const items = await getVocabQuizItems(supabase, {
    deckId: deckId || undefined,
    dueOnly: scope === "due",
  });

  if (items.length < VOCAB_QUIZ_OPTION_COUNT) notFound();

  // deckId chỉ có khi mở Quiz từ đúng 1 bộ — cộng vào "số lần đã học" của
  // riêng bộ đó (xem migration 0014). "Quiz tất cả từ" / "Ôn từ đến hạn"
  // (không deckId) trải trên nhiều bộ nên không gắn vào bộ nào.
  return <VocabQuizRunner items={items} deckId={deckId || null} />;
}
