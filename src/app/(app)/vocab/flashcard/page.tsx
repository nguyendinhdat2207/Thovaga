import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFlashcardWords } from "@/lib/queries/vocab";
import { FlashcardRunner } from "@/components/vocab/FlashcardRunner";

export default async function VocabFlashcardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; deckId?: string }>;
}) {
  const { scope, deckId } = await searchParams;
  const supabase = await createClient();

  const words = await getFlashcardWords(supabase, {
    deckId: deckId || undefined,
    dueOnly: scope === "due",
  });

  if (words.length === 0) notFound();

  // deckId chỉ có khi mở Flashcard từ đúng 1 bộ ở trang /vocab — truyền xuống
  // để phiên học được cộng vào "số lần đã học" của riêng bộ đó (xem
  // vocab_deck_stats trong migration 0014). "Ôn hôm nay" (scope=due, không
  // deckId) trải trên nhiều bộ nên không gắn vào bộ nào.
  return <FlashcardRunner words={words} deckId={deckId || null} />;
}
