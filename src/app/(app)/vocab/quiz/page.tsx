import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getVocabQuizItems,
  getMistakePackQuizItems,
  VOCAB_QUIZ_OPTION_COUNT,
  DAILY_REVIEW_LIMIT,
} from "@/lib/queries/vocab";
import { VocabQuizRunner } from "@/components/vocab/VocabQuizRunner";
import { LinkButton } from "@/components/ui/LinkButton";
import { Mascot } from "@/components/ui/Mascot";

export default async function VocabQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; deckId?: string; pack?: string }>;
}) {
  const { scope, deckId, pack } = await searchParams;
  const supabase = await createClient();

  // "Ôn gói từ sai" là 1 nhánh riêng: nguồn câu hỏi là 1 gói cụ thể trong kho
  // từ sai (giữ nguyên dòng trùng — xem getMistakePackQuizItems), và gói được
  // xoá hẳn khi làm đúng 100% (VocabQuizRunner truyền packNumber, tự gọi xoá
  // khi done && không sai câu nào).
  if (scope === "mistake-pack") {
    const packNumber = Number(pack);
    if (!Number.isInteger(packNumber) || packNumber < 1) notFound();

    const items = await getMistakePackQuizItems(supabase, packNumber);
    if (items.length === 0) {
      return (
        <div className="max-w-[420px] mx-auto px-5 py-16 text-center">
          <Mascot size={72} className="mx-auto mb-4" />
          <h2 className="font-display font-extrabold text-xl text-ink mb-2">
            Gói này không còn từ nào
          </h2>
          <p className="font-bold text-sm text-ink-muted mb-6">
            Có thể gói đã được ôn đúng hết và xoá rồi, hoặc chưa từng có từ nào trong gói này.
          </p>
          <LinkButton href="/vocab">Về trang từ vựng</LinkButton>
        </div>
      );
    }
    // Không cần đủ 4 từ mới cho làm — gói có thể đang gom dở (chưa đầy 50).
    return (
      <VocabQuizRunner items={items} title={`Ôn gói ${packNumber} · từ sai`} mistakePackNumber={packNumber} />
    );
  }

  // Câu hỏi (kèm 4 lựa chọn đã trộn) dựng sẵn ở server — client không cần nhận
  // cả kho từ để tự bốc đáp án nhiễu nữa.
  const isDaily = scope === "due" && !deckId;
  const items = await getVocabQuizItems(supabase, {
    deckId: deckId || undefined,
    dueOnly: scope === "due",
    // Ôn toàn kho theo ngày thì giới hạn số câu, giống flashcard — xem
    // DAILY_REVIEW_LIMIT ở src/lib/queries/vocab.ts.
    limit: isDaily ? DAILY_REVIEW_LIMIT : undefined,
  });

  if (items.length < VOCAB_QUIZ_OPTION_COUNT) notFound();

  // deckId chỉ có khi mở Quiz từ đúng 1 bộ — cộng vào "số lần đã học" của
  // riêng bộ đó (xem migration 0014). "Quiz tất cả từ" / "Ôn từ đến hạn"
  // (không deckId) trải trên nhiều bộ nên không gắn vào bộ nào.
  return <VocabQuizRunner items={items} deckId={deckId || null} />;
}
