import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVocabWords } from "@/lib/queries/vocab";
import { FlashcardRunner } from "@/components/vocab/FlashcardRunner";

export default async function VocabFlashcardPage({
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

  if (words.length === 0) notFound();

  return <FlashcardRunner words={words} />;
}
