import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Deck, Question, Subject } from "@/lib/database.types";

export interface DeckWithQuestions {
  deck: Deck & { subject: Pick<Subject, "id" | "name" | "category"> | null };
  questions: Question[];
}

export async function getDeckWithQuestions(
  supabase: SupabaseClient<Database>,
  deckId: string
): Promise<DeckWithQuestions | null> {
  const { data: deck, error: deckErr } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .maybeSingle();
  if (deckErr) throw deckErr;
  if (!deck) return null;

  const { data: subject, error: subjectErr } = await supabase
    .from("subjects")
    .select("id, name, category")
    .eq("id", deck.subject_id)
    .maybeSingle();
  if (subjectErr) throw subjectErr;

  const { data: questions, error: questionsErr } = await supabase
    .from("questions")
    .select("*")
    .eq("deck_id", deckId);
  if (questionsErr) throw questionsErr;

  return { deck: { ...deck, subject: subject ?? null }, questions: questions ?? [] };
}
