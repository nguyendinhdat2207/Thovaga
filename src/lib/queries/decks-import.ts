import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Deck, SubjectCategory } from "@/lib/database.types";

export interface ImportQuestionInput {
  prompt: string;
  options: string[];
  correct_option: number;
  explanation?: string | null;
}

export interface ImportDeckInput {
  subject_id?: string;
  subject_name?: string;
  subject_category?: SubjectCategory;
  title: string;
  source_file_url?: string | null;
  questions: ImportQuestionInput[];
}

/** Trần số câu mỗi lần import. Một bộ đề vài nghìn câu gần như chắc chắn là do
 * dán nhầm file, và insert cả loạt như vậy dễ làm serverless function hết thời
 * gian giữa chừng. Tách nhỏ cũng đúng với cách dùng thực tế (đề 40 câu/bộ). */
export const MAX_QUESTIONS_PER_IMPORT = 500;

export class ImportDeckError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function validate(input: ImportDeckInput) {
  if (!input.subject_id && !input.subject_name) {
    throw new ImportDeckError("Cần subject_id hoặc subject_name.");
  }
  if (!input.title || !input.title.trim()) throw new ImportDeckError("title là bắt buộc.");
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new ImportDeckError("questions phải là một danh sách không rỗng.");
  }
  if (input.questions.length > MAX_QUESTIONS_PER_IMPORT) {
    throw new ImportDeckError(
      `Mỗi lần chỉ import tối đa ${MAX_QUESTIONS_PER_IMPORT} câu — hãy tách thành nhiều bộ đề nhỏ.`
    );
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

// Tìm môn học theo tên (không phân biệt hoa/thường), tạo mới nếu chưa có —
// dùng khi import qua markdown chỉ biết tên môn, không biết subject_id.
async function findOrCreateSubjectByName(
  supabase: SupabaseClient<Database>,
  name: string,
  category: SubjectCategory | undefined
): Promise<string> {
  const { data: existing, error: findErr } = await supabase
    .from("subjects")
    .select("id")
    .ilike("name", name.trim())
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing.id;

  const { data: created, error: createErr } = await supabase
    .from("subjects")
    .insert({ name: name.trim(), category: category ?? "school" })
    .select("id")
    .single();
  if (createErr) throw createErr;
  return created.id;
}

export async function importDeck(
  supabase: SupabaseClient<Database>,
  input: ImportDeckInput
): Promise<Deck & { questionCount: number }> {
  validate(input);

  let subjectId = input.subject_id;
  if (subjectId) {
    const { data: subject, error: subjectErr } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .maybeSingle();
    if (subjectErr) throw subjectErr;
    if (!subject) throw new ImportDeckError("subject_id không tồn tại.", 404);
  } else {
    subjectId = await findOrCreateSubjectByName(supabase, input.subject_name!, input.subject_category);
  }

  // Deck + questions ghi trong 1 transaction (hàm import_deck, migration 0006):
  // nếu phần câu hỏi lỗi thì deck cũng không được tạo, không để lại bộ đề rỗng.
  const { data: deckId, error: rpcErr } = await supabase.rpc("import_deck", {
    p_subject_id: subjectId,
    p_title: input.title.trim(),
    p_source_file_url: input.source_file_url ?? null,
    p_questions: input.questions.map((q) => ({
      prompt: q.prompt,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation ?? null,
    })),
  });
  if (rpcErr) throw rpcErr;

  const { data: deck, error: deckErr } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .single();
  if (deckErr) throw deckErr;

  return { ...deck, questionCount: input.questions.length };
}
