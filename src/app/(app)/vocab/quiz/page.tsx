import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVocabQuizItems, VOCAB_QUIZ_OPTION_COUNT } from "@/lib/queries/vocab";
import { VocabQuizRunner } from "@/components/vocab/VocabQuizRunner";

export default async function VocabQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; deckId?: string }>;
}) {
  const { scope, deckId } = await searchParams;
  const supabase = await createClient();

  // Câu hỏi (kèm 4 lựa chọn đã trộn) dựng sẵn ở server — client không cần nhận
  // cả kho từ để tự bốc đáp án nhiễu nữa.
  const items = await getVocabQuizItems(supabase, {
    deckId: deckId || undefined,
    dueOnly: scope === "due",
  });

  if (items.length < VOCAB_QUIZ_OPTION_COUNT) notFound();

  return <VocabQuizRunner items={items} />;
}
