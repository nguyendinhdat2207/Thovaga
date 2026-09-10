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
  // Deck kèm luôn subject bằng nested select (PostgREST tự join), và câu hỏi
  // chạy song song vì không phụ thuộc kết quả nào. Trước đây là 3 lượt gọi nối
  // đuôi nhau — với DB đặt ở US, mỗi lượt tốn cả trăm mili giây.
  const [
    { data: deck, error: deckErr },
    { data: questions, error: questionsErr },
  ] = await Promise.all([
    supabase
      .from("decks")
      .select("*, subject:subjects(id, name, category)")
      .eq("id", deckId)
      .maybeSingle(),
    supabase.from("questions").select("*").eq("deck_id", deckId),
  ]);
  if (deckErr) throw deckErr;
  if (questionsErr) throw questionsErr;
  if (!deck) return null;

  return {
    deck: deck as DeckWithQuestions["deck"],
    questions: questions ?? [],
  };
}
