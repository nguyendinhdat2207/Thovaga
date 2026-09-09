import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVocabWords } from "@/lib/queries/vocab";
import { VocabQuizRunner } from "@/components/vocab/VocabQuizRunner";

export default async function VocabQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; deckId?: string }>;
}) {
  const { scope, deckId } = await searchParams;
  const supabase = await createClient();

  const words = await getVocabWords(supabase, {
    deckId: deckId || undefined,
    dueOnly: scope === "due",
  });

  if (words.length < 4) notFound();

  // Danh sách nghĩa toàn bộ để sinh đáp án nhiễu — không cần deck cụ thể.
  const allWords = deckId ? await getVocabWords(supabase) : words;

  return <VocabQuizRunner words={words} pool={allWords} />;
}
