import { createClient } from "@/lib/supabase/server";
import { getVocabDecks, getVocabWords } from "@/lib/queries/vocab";
import { VocabBank } from "@/components/vocab/VocabBank";

export default async function VocabBankPage() {
  const supabase = await createClient();
  const [decks, words] = await Promise.all([
    getVocabDecks(supabase),
    getVocabWords(supabase),
  ]);

  return <VocabBank decks={decks} words={words} />;
}
