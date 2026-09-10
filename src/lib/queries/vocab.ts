import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, VocabWord, VocabProgress } from "@/lib/database.types";
import { parseSessionWindow, toCount, ValidationError, type SessionWindow } from "@/lib/validate";
import { appToday } from "@/lib/queries/stats";

export class VocabSessionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface RecordVocabSessionInput {
  mode: "flashcard" | "quiz";
  started_at: string;
  finished_at: string;
  word_count: number;
  correct_count: number;
}

const VOCAB_SESSION_MODES = ["flashcard", "quiz"] as const;

// Ghi thời lượng 1 phiên học từ vựng (flashcard hoặc quiz). Toàn bộ input đến
// từ trình duyệt nên phải xác thực: mode phải nằm trong danh sách cho phép,
// duration do server tự tính và kẹp lại (xem src/lib/validate.ts), số đếm phải
// là số nguyên không âm và correct_count không thể vượt word_count.
export async function recordVocabSession(
  supabase: SupabaseClient<Database>,
  input: RecordVocabSessionInput
) {
  if (!VOCAB_SESSION_MODES.includes(input?.mode)) {
    throw new VocabSessionError(`mode phải là ${VOCAB_SESSION_MODES.join(" hoặc ")}.`);
  }

  let window: SessionWindow;
  let wordCount: number;
  let correctCount: number;
  try {
    window = parseSessionWindow(input.started_at, input.finished_at);
    wordCount = toCount(input.word_count, "word_count");
    correctCount = Math.min(toCount(input.correct_count, "correct_count"), wordCount);
  } catch (err) {
    if (err instanceof ValidationError) throw new VocabSessionError(err.message, err.status);
    throw err;
  }

  const { error } = await supabase.from("vocab_sessions").insert({
    mode: input.mode,
    started_at: window.startedAt,
    finished_at: window.finishedAt,
    duration_seconds: window.durationSeconds,
    word_count: wordCount,
    correct_count: correctCount,
  });
  if (error) throw error;
}

// Ngày "hôm nay" theo giờ Việt Nam — xem appToday() trong queries/stats.ts.
// Trước đây dùng new Date().toISOString().slice(0,10) tức ngày UTC, khiến từ
// 00:00 đến 07:00 sáng hệ thống coi là hôm qua và bỏ sót từ đến hạn ôn.
//
// Bảng interval Leitner (0,1,2,4,7,15 ngày) nay nằm trong hàm
// apply_vocab_progress ở Postgres (migration 0009), không còn lặp lại ở đây.
const todayStr = appToday;

export interface VocabDeckWithStats {
  id: string;
  title: string;
  created_at: string;
  wordCount: number;
  dueCount: number;
}

// Đếm bằng 1 câu SQL group by (hàm vocab_deck_stats, migration 0008) thay vì
// tải toàn bộ vocab_words + vocab_progress về rồi lọc lồng nhau ở JS.
export async function getVocabDecks(
  supabase: SupabaseClient<Database>
): Promise<VocabDeckWithStats[]> {
  const { data, error } = await supabase.rpc("vocab_deck_stats");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    created_at: row.created_at,
    wordCount: Number(row.word_count),
    dueCount: Number(row.due_count),
  }));
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

export interface VocabQuizItem {
  id: string;
  en: string;
  vi: string;
  example: string | null;
  /** Đáp án đúng + 3 nhiễu, đã trộn sẵn ở server. */
  options: string[];
}

/** Số lựa chọn mỗi câu quiz từ vựng (1 đúng + 3 nhiễu). */
export const VOCAB_QUIZ_OPTION_COUNT = 4;

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Chuẩn bị sẵn câu hỏi quiz ở server: mỗi từ kèm đúng 4 lựa chọn đã trộn.
 *
 * Trước đây trang quiz gửi thêm prop `pool` chứa TOÀN BỘ kho từ (hơn 500 từ,
 * kèm ví dụ và distractors) xuống trình duyệt chỉ để bốc ngẫu nhiên 3 nghĩa làm
 * đáp án nhiễu — payload rất nặng mà 99% dữ liệu không dùng tới. Nay việc bốc
 * nhiễu làm ở đây, client chỉ nhận đúng phần nó hiển thị.
 */
export async function getVocabQuizItems(
  supabase: SupabaseClient<Database>,
  options: { deckId?: string; dueOnly?: boolean } = {}
): Promise<VocabQuizItem[]> {
  const words = await getVocabWords(supabase, options);
  if (words.length === 0) return [];

  // Chỉ cần cột `vi` của các từ khác để làm nhiễu — lấy riêng cho nhẹ, và lấy
  // trên toàn kho để nhiễu không bị bó hẹp trong một bộ từ nhỏ.
  const { data: allMeanings, error } = await supabase.from("vocab_words").select("vi");
  if (error) throw error;
  const meaningPool = Array.from(new Set((allMeanings ?? []).map((w) => w.vi)));

  return words.map((word) => {
    // Ưu tiên đáp án nhiễu đã soạn tay (khó phân biệt hơn nhiễu ngẫu nhiên).
    const authored = word.distractors ?? [];
    const distractors =
      authored.length > 0
        ? authored.slice(0, VOCAB_QUIZ_OPTION_COUNT - 1)
        : shuffleInPlace(meaningPool.filter((vi) => vi !== word.vi)).slice(
            0,
            VOCAB_QUIZ_OPTION_COUNT - 1
          );

    return {
      id: word.id,
      en: word.en,
      vi: word.vi,
      example: word.example,
      options: shuffleInPlace([word.vi, ...distractors]),
    };
  });
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

  // Deck + words ghi trong 1 transaction (hàm import_vocab_deck, migration
  // 0006) — tránh để lại bộ từ rỗng khi phần từ vựng insert lỗi.
  const { data: deckId, error: rpcErr } = await supabase.rpc("import_vocab_deck", {
    p_title: input.title.trim(),
    p_words: input.words.map((w) => ({
      en: w.en.trim(),
      vi: w.vi.trim(),
      example: w.example?.trim() || null,
      distractors: w.distractors && w.distractors.length > 0 ? w.distractors : null,
    })),
  });
  if (rpcErr) throw rpcErr;

  return { id: deckId, title: input.title.trim(), wordCount: input.words.length };
}

export class VocabProgressError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Ghi tiến trình dạng Leitner: đúng thì tăng box (tối đa 5), sai thì quay về
// box 1, next_review = hôm nay + interval theo box.
//
// Toàn bộ phép cộng nằm trong 1 lệnh `on conflict do update` ở Postgres (hàm
// apply_vocab_progress, migration 0009). Nếu đọc–cộng–ghi ở đây thì hai request
// chồng nhau cùng đọc giá trị cũ rồi cùng ghi đè, làm mất một lượt đếm.
async function applyVocabProgress(
  supabase: SupabaseClient<Database>,
  wordId: string,
  correct: boolean
): Promise<VocabProgress> {
  const { data, error } = await supabase
    .rpc("apply_vocab_progress", { p_word_id: wordId, p_correct: correct })
    .single();
  if (error) throw error;
  return data;
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
