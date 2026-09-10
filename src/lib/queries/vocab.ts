import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, VocabWord, VocabProgress } from "@/lib/database.types";

const BOX_INTERVAL_DAYS: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface VocabDeckWithStats {
  id: string;
  title: string;
  created_at: string;
  wordCount: number;
  dueCount: number;
}

export async function getVocabDecks(
  supabase: SupabaseClient<Database>
): Promise<VocabDeckWithStats[]> {
  const [decksRes, wordsRes, progressRes] = await Promise.all([
    supabase.from("vocab_decks").select("*").order("created_at", { ascending: true }),
    supabase.from("vocab_words").select("id, deck_id"),
    supabase.from("vocab_progress").select("word_id, next_review"),
  ]);
  if (decksRes.error) throw decksRes.error;
  if (wordsRes.error) throw wordsRes.error;
  if (progressRes.error) throw progressRes.error;

  const words = wordsRes.data ?? [];
  const today = todayStr();
  const nextReviewByWordId = new Map(
    (progressRes.data ?? []).map((p) => [p.word_id, p.next_review] as const)
  );

  return (decksRes.data ?? []).map((deck) => {
    const deckWords = words.filter((w) => w.deck_id === deck.id);
    const dueCount = deckWords.filter((w) => {
      const nextReview = nextReviewByWordId.get(w.id);
      return !nextReview || nextReview <= today;
    }).length;
    return { ...deck, wordCount: deckWords.length, dueCount };
  });
}

export type VocabWordWithProgress = VocabWord & { progress: VocabProgress | null };

export async function getVocabWords(
  supabase: SupabaseClient<Database>,
  options: { deckId?: string; dueOnly?: boolean } = {}
): Promise<VocabWordWithProgress[]> {
  let query = supabase.from("vocab_words").select("*");
  if (options.deckId) query = query.eq("deck_id", options.deckId);
  const { data: words, error: wordsErr } = await query;
  if (wordsErr) throw wordsErr;

  const wordIds = (words ?? []).map((w) => w.id);
  const { data: progressRows, error: progressErr } =
    wordIds.length > 0
      ? await supabase.from("vocab_progress").select("*").in("word_id", wordIds)
      : { data: [] as VocabProgress[], error: null };
  if (progressErr) throw progressErr;

  const progressByWordId = new Map((progressRows ?? []).map((p) => [p.word_id, p] as const));
  const today = todayStr();

  const withProgress: VocabWordWithProgress[] = (words ?? []).map((w) => ({
    ...w,
    progress: progressByWordId.get(w.id) ?? null,
  }));

  if (options.dueOnly) {
    return withProgress.filter((w) => !w.progress || w.progress.next_review <= today);
  }
  return withProgress;
}

export interface ImportVocabWordInput {
  en: string;
  vi: string;
  example?: string | null;
  distractors?: string[] | null;
}

export interface ImportVocabDeckInput {
  title: string;
  words: ImportVocabWordInput[];
}

export class ImportVocabError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function validateImport(input: ImportVocabDeckInput) {
  if (!input.title || !input.title.trim()) {
    throw new ImportVocabError("title là bắt buộc.");
  }
  if (!Array.isArray(input.words) || input.words.length === 0) {
    throw new ImportVocabError("words phải là một danh sách không rỗng.");
  }
  input.words.forEach((w, i) => {
    if (!w.en || !w.en.trim()) throw new ImportVocabError(`Từ #${i + 1} thiếu "en".`);
    if (!w.vi || !w.vi.trim()) throw new ImportVocabError(`Từ #${i + 1} thiếu "vi".`);
  });
}

export async function importVocabDeck(
  supabase: SupabaseClient<Database>,
  input: ImportVocabDeckInput
): Promise<{ id: string; title: string; wordCount: number }> {
  validateImport(input);

  const { data: deck, error: deckErr } = await supabase
    .from("vocab_decks")
    .insert({ title: input.title.trim() })
    .select()
    .single();
  if (deckErr) throw deckErr;

  const { error: wordsErr } = await supabase.from("vocab_words").insert(
    input.words.map((w) => ({
      deck_id: deck.id,
      en: w.en.trim(),
      vi: w.vi.trim(),
      example: w.example?.trim() || null,
      distractors: w.distractors && w.distractors.length > 0 ? w.distractors : null,
    }))
  );
  if (wordsErr) throw wordsErr;

  return { id: deck.id, title: deck.title, wordCount: input.words.length };
}

export class VocabProgressError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Ghi tiến trình dạng Leitner khi đã biết chắc word_id tồn tại (đỡ 1 round-trip
// kiểm tra lại) — đúng thì tăng box (tối đa 5), sai thì quay về box 1.
// next_review tính theo bảng interval BOX_INTERVAL_DAYS.
async function applyVocabProgress(
  supabase: SupabaseClient<Database>,
  wordId: string,
  correct: boolean
): Promise<VocabProgress> {
  const { data: existing, error: existingErr } = await supabase
    .from("vocab_progress")
    .select("*")
    .eq("word_id", wordId)
    .maybeSingle();
  if (existingErr) throw existingErr;

  const prevBox = existing?.box ?? 0;
  const box = correct ? Math.min(prevBox + 1, 5) : 1;
  const nextReview = addDaysStr(todayStr(), BOX_INTERVAL_DAYS[box] ?? 1);

  const { data: saved, error: saveErr } = await supabase
    .from("vocab_progress")
    .upsert(
      {
        word_id: wordId,
        box,
        correct: (existing?.correct ?? 0) + (correct ? 1 : 0),
        wrong: (existing?.wrong ?? 0) + (correct ? 0 : 1),
        next_review: nextReview,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "word_id" }
    )
    .select()
    .single();
  if (saveErr) throw saveErr;

  return saved;
}

export async function updateVocabProgress(
  supabase: SupabaseClient<Database>,
  wordId: string,
  correct: boolean
): Promise<VocabProgress> {
  const { data: word, error: wordErr } = await supabase
    .from("vocab_words")
    .select("id")
    .eq("id", wordId)
    .maybeSingle();
  if (wordErr) throw wordErr;
  if (!word) throw new VocabProgressError("word_id không tồn tại.", 404);

  return applyVocabProgress(supabase, wordId, correct);
}

export async function gradeVocabQuizAnswer(
  supabase: SupabaseClient<Database>,
  wordId: string,
  picked: string
): Promise<{ correct: boolean; correctAnswer: string; progress: VocabProgress }> {
  const { data: word, error: wordErr } = await supabase
    .from("vocab_words")
    .select("vi")
    .eq("id", wordId)
    .maybeSingle();
  if (wordErr) throw wordErr;
  if (!word) throw new VocabProgressError("word_id không tồn tại.", 404);

  const correct = picked === word.vi;
  const progress = await applyVocabProgress(supabase, wordId, correct);
  return { correct, correctAnswer: word.vi, progress };
}
