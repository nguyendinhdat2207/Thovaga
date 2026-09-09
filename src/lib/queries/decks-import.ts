import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Deck } from "@/lib/database.types";

export interface ImportQuestionInput {
  prompt: string;
  options: string[];
  correct_option: number;
  explanation?: string | null;
}

export interface ImportDeckInput {
  subject_id: string;
  title: string;
  source_file_url?: string | null;
  questions: ImportQuestionInput[];
}

export class ImportDeckError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function validate(input: ImportDeckInput) {
  if (!input.subject_id) throw new ImportDeckError("subject_id là bắt buộc.");
  if (!input.title || !input.title.trim()) throw new ImportDeckError("title là bắt buộc.");
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new ImportDeckError("questions phải là một danh sách không rỗng.");
  }
  input.questions.forEach((q, i) => {
    if (!q.prompt || !q.prompt.trim()) {
      throw new ImportDeckError(`Câu hỏi #${i + 1} thiếu "prompt".`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new ImportDeckError(`Câu hỏi #${i + 1} cần ít nhất 2 lựa chọn trong "options".`);
    }
    if (
      typeof q.correct_option !== "number" ||
      q.correct_option < 0 ||
      q.correct_option >= q.options.length
    ) {
      throw new ImportDeckError(`Câu hỏi #${i + 1} có "correct_option" không hợp lệ.`);
    }
  });
}

export async function importDeck(
  supabase: SupabaseClient<Database>,
  input: ImportDeckInput
): Promise<Deck & { questionCount: number }> {
  validate(input);

  const { data: subject, error: subjectErr } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", input.subject_id)
    .maybeSingle();
  if (subjectErr) throw subjectErr;
  if (!subject) throw new ImportDeckError("subject_id không tồn tại.", 404);

  const { data: deck, error: deckErr } = await supabase
    .from("decks")
    .insert({
      subject_id: input.subject_id,
      title: input.title.trim(),
      source_file_url: input.source_file_url ?? null,
    })
    .select()
    .single();
  if (deckErr) throw deckErr;

  const { error: questionsErr } = await supabase.from("questions").insert(
    input.questions.map((q) => ({
      deck_id: deck.id,
      prompt: q.prompt,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation ?? null,
    }))
  );
  if (questionsErr) throw questionsErr;

  return { ...deck, questionCount: input.questions.length };
}
