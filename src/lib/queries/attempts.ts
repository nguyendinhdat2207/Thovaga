import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Attempt } from "@/lib/database.types";
import { computeScore } from "@/lib/format";
import { getVocabSessions } from "@/lib/queries/vocab";

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

  if (!deck_id || !started_at || !finished_at || !Array.isArray(answers) || answers.length === 0) {
    throw new RecordAttemptError("deck_id, started_at, finished_at, answers là bắt buộc.");
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
  const durationSeconds = Math.max(
    0,
    Math.round((new Date(finished_at).getTime() - new Date(started_at).getTime()) / 1000)
  );

  const { data: attempt, error: attemptErr } = await supabase
    .from("attempts")
    .insert({
      deck_id,
      started_at,
      finished_at,
      duration_seconds: durationSeconds,
      score,
      total_questions: totalQuestions,
    })
    .select()
    .single();
  if (attemptErr) throw attemptErr;

  const { error: answersErr } = await supabase.from("attempt_answers").insert(
    gradedAnswers.map((a) => ({
      attempt_id: attempt.id,
      question_id: a.question_id,
      selected_option: a.selected_option,
      is_correct: a.is_correct,
    }))
  );
  if (answersErr) throw answersErr;

  return attempt;
}

export async function getTotalStudiedMinutes(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const { data, error } = await supabase.from("attempts").select("duration_seconds");
  if (error) throw error;
  const totalSeconds = (data ?? []).reduce((sum, a) => sum + a.duration_seconds, 0);
  return Math.round(totalSeconds / 60);
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

export async function getHistory(
  supabase: SupabaseClient<Database>
): Promise<{ attempts: HistoryAttempt[]; stats: HistoryStats }> {
  const [{ data: attempts, error: attemptsErr }, vocabSessions] = await Promise.all([
    supabase.from("attempts").select("*").order("created_at", { ascending: false }),
    getVocabSessions(supabase),
  ]);
  if (attemptsErr) throw attemptsErr;

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

  // Tổng thời gian học gồm cả bộ đề trắc nghiệm lẫn phiên học từ vựng
  // (flashcard/quiz) — 2 nguồn khác bảng nên cộng dồn theo giây rồi mới quy
  // đổi ra phút.
  const quizSeconds = enriched.reduce((sum, a) => sum + a.duration_seconds, 0);
  const vocabSeconds = vocabSessions.reduce((sum, s) => sum + s.duration_seconds, 0);
  const totalSeconds = quizSeconds + vocabSeconds;
  const averageScore = enriched.length
    ? enriched.reduce((sum, a) => sum + a.score, 0) / enriched.length
    : 0;

  const now = new Date();
  const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const weeklyMinutesByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const inRange = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= d.getTime() && t < next.getTime();
    };
    const quizMinutes = enriched
      .filter((a) => inRange(a.created_at))
      .reduce((sum, a) => sum + a.duration_seconds, 0);
    const vocabMinutes = vocabSessions
      .filter((s) => inRange(s.created_at))
      .reduce((sum, s) => sum + s.duration_seconds, 0);
    return { label: dayLabels[d.getDay()], minutes: Math.round((quizMinutes + vocabMinutes) / 60) };
  });

  return {
    attempts: enriched,
    stats: {
      totalMinutes: Math.round(totalSeconds / 60),
      attemptCount: enriched.length,
      averageScore: Math.round(averageScore * 10) / 10,
      weeklyMinutesByDay,
    },
  };
}
