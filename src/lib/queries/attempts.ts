import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Attempt } from "@/lib/database.types";
import { computeScore } from "@/lib/format";
import { getTotalStudiedMinutes, getWeeklyMinutesByDay } from "@/lib/queries/stats";
import { parseSessionWindow, ValidationError, type SessionWindow } from "@/lib/validate";

export interface SubmitAnswerInput {
  question_id: string;
  selected_option: number | null;
}

export interface RecordAttemptInput {
  deck_id: string;
  started_at: string;
  finished_at: string;
  answers: SubmitAnswerInput[];
}

export class RecordAttemptError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Điểm luôn được server tính lại từ đáp án đúng lưu trong DB, không tin
// điểm số do client gửi lên — tránh gian lận / lỗi tính toán ở phía client.
export async function recordAttempt(
  supabase: SupabaseClient<Database>,
  input: RecordAttemptInput
): Promise<Attempt> {
  const { deck_id, started_at, finished_at, answers } = input;

  if (!deck_id || !Array.isArray(answers) || answers.length === 0) {
    throw new RecordAttemptError("deck_id và answers là bắt buộc.");
  }

  // Mốc thời gian do trình duyệt gửi — server tự tính lại duration và chặn
  // các giá trị vô lý, tránh làm hỏng thống kê "tổng thời gian học".
  let window: SessionWindow;
  try {
    window = parseSessionWindow(started_at, finished_at);
  } catch (err) {
    if (err instanceof ValidationError) throw new RecordAttemptError(err.message, err.status);
    throw err;
  }

  const questionIds = answers.map((a) => a.question_id);
  const { data: questions, error: questionsErr } = await supabase
    .from("questions")
    .select("id, correct_option, deck_id")
    .in("id", questionIds);
  if (questionsErr) throw questionsErr;

  if (!questions || questions.length !== questionIds.length) {
    throw new RecordAttemptError("Một số câu hỏi không tồn tại.", 404);
  }
  if (questions.some((q) => q.deck_id !== deck_id)) {
    throw new RecordAttemptError("Câu hỏi không thuộc deck này.", 400);
  }

  const correctByQuestion = new Map(questions.map((q) => [q.id, q.correct_option] as const));
  const gradedAnswers = answers.map((a) => ({
    question_id: a.question_id,
    selected_option: a.selected_option,
    is_correct: a.selected_option !== null && a.selected_option === correctByQuestion.get(a.question_id),
  }));

  const correctCount = gradedAnswers.filter((a) => a.is_correct).length;
  const totalQuestions = gradedAnswers.length;
  const score = computeScore(correctCount, totalQuestions);

  // attempts + attempt_answers ghi trong 1 transaction (hàm record_attempt,
  // migration 0006) — nếu phần đáp án lỗi thì lượt làm bài cũng không được ghi,
  // tránh lưu lại kết quả có điểm nhưng không có câu trả lời nào.
  const { data: attempt, error: attemptErr } = await supabase.rpc("record_attempt", {
    p_deck_id: deck_id,
    p_started_at: window.startedAt,
    p_finished_at: window.finishedAt,
    p_duration_seconds: window.durationSeconds,
    p_score: score,
    p_total_questions: totalQuestions,
    p_answers: gradedAnswers,
  });
  if (attemptErr) throw attemptErr;

  return attempt;
}

export async function getContinueDeckId(
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const { data: lastAttempt } = await supabase
    .from("attempts")
    .select("deck_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastAttempt?.deck_id) return lastAttempt.deck_id;

  const { data: firstDeck } = await supabase
    .from("decks")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return firstDeck?.id ?? null;
}

export interface AttemptResult {
  attempt: Attempt;
  deck: { id: string; title: string; subject_id: string };
  subjectName: string;
  previousAttempts: { score: number; created_at: string }[];
  wrongAnswers: {
    prompt: string;
    options: string[];
    correctOption: number;
    explanation: string | null;
    pickedOption: number | null;
  }[];
}

export async function getAttemptResult(
  supabase: SupabaseClient<Database>,
  attemptId: string
): Promise<AttemptResult | null> {
  const { data: attempt, error: attemptErr } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (attemptErr) throw attemptErr;
  if (!attempt) return null;

  const { data: deck, error: deckErr } = await supabase
    .from("decks")
    .select("id, title, subject_id")
    .eq("id", attempt.deck_id)
    .maybeSingle();
  if (deckErr) throw deckErr;
  if (!deck) return null;

  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", deck.subject_id)
    .maybeSingle();

  const { data: previousAttempts, error: prevErr } = await supabase
    .from("attempts")
    .select("score, created_at")
    .eq("deck_id", deck.id)
    .neq("id", attemptId)
    .order("created_at", { ascending: false })
    .limit(2);
  if (prevErr) throw prevErr;

  const { data: wrongRows, error: wrongErr } = await supabase
    .from("attempt_answers")
    .select("selected_option, is_correct, question_id, questions(prompt, options, correct_option, explanation)")
    .eq("attempt_id", attemptId)
    .eq("is_correct", false);
  if (wrongErr) throw wrongErr;

  type WrongRow = {
    selected_option: number | null;
    questions: { prompt: string; options: string[]; correct_option: number; explanation: string | null } | null;
  };

  const wrongAnswers = ((wrongRows ?? []) as unknown as WrongRow[])
    .filter((r) => r.questions)
    .map((r) => ({
      prompt: r.questions!.prompt,
      options: r.questions!.options,
      correctOption: r.questions!.correct_option,
      explanation: r.questions!.explanation,
      pickedOption: r.selected_option,
    }));

  return {
    attempt,
    deck,
    subjectName: subject?.name ?? "",
    previousAttempts: (previousAttempts ?? []).slice().reverse(),
    wrongAnswers,
  };
}

export interface HistoryStats {
  totalMinutes: number;
  attemptCount: number;
  averageScore: number;
  weeklyMinutesByDay: { label: string; minutes: number }[];
}

export interface HistoryAttempt extends Attempt {
  deckTitle: string;
  subjectName: string;
}

/** Số lượt làm bài tối đa hiển thị trong lịch sử — bảng chỉ tăng, không giới
 * hạn thì trang sẽ chậm dần đều. Thống kê tổng vẫn tính trên toàn bộ dữ liệu
 * vì được cộng dồn ở Postgres. */
export const HISTORY_PAGE_SIZE = 50;

export async function getHistory(
  supabase: SupabaseClient<Database>
): Promise<{ attempts: HistoryAttempt[]; stats: HistoryStats }> {
  const [
    { data: attempts, error: attemptsErr },
    { data: summary, error: summaryErr },
    totalMinutes,
    weeklyMinutesByDay,
  ] = await Promise.all([
    supabase
      .from("attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(HISTORY_PAGE_SIZE),
    // Số lượt và điểm trung bình tính trên TOÀN BỘ lịch sử, không phải chỉ
    // trang đầu — nên lấy riêng bằng aggregate thay vì reduce() trên mảng trên.
    supabase.rpc("attempt_summary").single(),
    getTotalStudiedMinutes(supabase),
    getWeeklyMinutesByDay(supabase),
  ]);
  if (attemptsErr) throw attemptsErr;
  if (summaryErr) throw summaryErr;

  const deckIds = Array.from(new Set((attempts ?? []).map((a) => a.deck_id)));
  const { data: decks, error: decksErr } =
    deckIds.length > 0
      ? await supabase.from("decks").select("id, title, subject_id").in("id", deckIds)
      : { data: [], error: null };
  if (decksErr) throw decksErr;

  const subjectIds = Array.from(new Set((decks ?? []).map((d) => d.subject_id)));
  const { data: subjects, error: subjectsErr } =
    subjectIds.length > 0
      ? await supabase.from("subjects").select("id, name").in("id", subjectIds)
      : { data: [], error: null };
  if (subjectsErr) throw subjectsErr;

  const deckById = new Map((decks ?? []).map((d) => [d.id, d] as const));
  const subjectNameById = new Map((subjects ?? []).map((s) => [s.id, s.name] as const));

  const enriched: HistoryAttempt[] = (attempts ?? []).map((a) => {
    const deck = deckById.get(a.deck_id);
    return {
      ...a,
      deckTitle: deck?.title ?? "",
      subjectName: subjectNameById.get(deck?.subject_id ?? "") ?? "",
    };
  });

  return {
    attempts: enriched,
    stats: {
      totalMinutes,
      attemptCount: Number(summary?.attempt_count ?? 0),
      averageScore: Math.round(Number(summary?.average_score ?? 0) * 10) / 10,
      weeklyMinutesByDay,
    },
  };
}
