import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ToeicBook, ToeicLesson, ToeicQuiz } from "@/lib/database.types";
import {
  TOEIC_MAX_QUESTIONS,
  TOEIC_NOTE_MAX,
  currentLessonNo,
  isMistakeType,
  type MistakeType,
  type ToeicSkill,
} from "@/lib/toeic";

export class ToeicError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface QuizStat {
  attempts: number;
  lastCorrect: number;
  lastTotal: number;
  lastAt: string;
  bestRatio: number;
}

export interface LessonSummary {
  id: string;
  lessonNo: number;
  title: string;
  part: number | null;
  kind: ToeicLesson["kind"];
  completed: boolean;
  quizCount: number;
  quizDoneCount: number;
}

export interface BookSummary extends ToeicBook {
  lessonCount: number;
  completedCount: number;
  quizCount: number;
  quizDoneCount: number;
}

export interface ToeicOverview {
  books: BookSummary[];
  selected: (BookSummary & { lessons: LessonSummary[]; currentLessonNo: number }) | null;
}

async function getQuizStats(
  supabase: SupabaseClient<Database>,
  lessonIds: string[] | null
): Promise<Map<string, QuizStat & { lessonId: string }>> {
  const { data, error } = await supabase.rpc("toeic_quiz_stats", { p_lesson_ids: lessonIds });
  if (error) throw error;
  return new Map(
    (data ?? []).map((r) => [
      r.quiz_slug,
      {
        lessonId: r.lesson_id,
        attempts: Number(r.attempts),
        lastCorrect: r.last_correct,
        lastTotal: r.last_total,
        lastAt: r.last_at,
        bestRatio: Number(r.best_ratio),
      },
    ])
  );
}

// Toàn bộ nội dung tĩnh chỉ ~6 sách / ~75 bài / ~220 đề (cột nhỏ, không kèm
// theory_md) nên tải 1 lần rồi gom ở app; phần cộng dồn kết quả làm bài vẫn ở
// Postgres (toeic_quiz_stats) theo SPEC 5.3.
export async function getToeicOverview(
  supabase: SupabaseClient<Database>,
  skill: ToeicSkill,
  bookId: string | null
): Promise<ToeicOverview> {
  const [booksRes, lessonsRes, quizzesRes, progressRes, stats] = await Promise.all([
    supabase.from("toeic_books").select("*").order("sort_order"),
    supabase.from("toeic_lessons").select("id, book_id, lesson_no, title, part, kind").order("lesson_no"),
    supabase.from("toeic_quizzes").select("slug, lesson_id"),
    supabase.from("toeic_lesson_progress").select("lesson_id, completed"),
    getQuizStats(supabase, null),
  ]);
  for (const r of [booksRes, lessonsRes, quizzesRes, progressRes]) if (r.error) throw r.error;

  const completedIds = new Set(
    (progressRes.data ?? []).filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const quizzesByLesson = new Map<string, string[]>();
  for (const q of quizzesRes.data ?? []) {
    const list = quizzesByLesson.get(q.lesson_id) ?? [];
    list.push(q.slug);
    quizzesByLesson.set(q.lesson_id, list);
  }

  const lessonsByBook = new Map<string, LessonSummary[]>();
  for (const l of lessonsRes.data ?? []) {
    const slugs = quizzesByLesson.get(l.id) ?? [];
    const summary: LessonSummary = {
      id: l.id,
      lessonNo: l.lesson_no,
      title: l.title,
      part: l.part,
      kind: l.kind,
      completed: completedIds.has(l.id),
      quizCount: slugs.length,
      quizDoneCount: slugs.filter((s) => stats.has(s)).length,
    };
    const list = lessonsByBook.get(l.book_id) ?? [];
    list.push(summary);
    lessonsByBook.set(l.book_id, list);
  }

  const books: BookSummary[] = (booksRes.data ?? [])
    .filter((b) => b.skill === skill)
    .map((b) => {
      const ls = lessonsByBook.get(b.id) ?? [];
      return {
        ...b,
        lessonCount: ls.length,
        completedCount: ls.filter((l) => l.completed).length,
        quizCount: ls.reduce((n, l) => n + l.quizCount, 0),
        quizDoneCount: ls.reduce((n, l) => n + l.quizDoneCount, 0),
      };
    });

  const chosen = books.find((b) => b.id === bookId) ?? books[0] ?? null;
  const lessons = chosen ? lessonsByBook.get(chosen.id) ?? [] : [];
  return {
    books,
    selected: chosen
      ? {
          ...chosen,
          lessons,
          currentLessonNo: currentLessonNo(
            lessons.map((l) => ({ lesson_no: l.lessonNo, completed: l.completed }))
          ),
        }
      : null,
  };
}

export interface LessonDetail {
  book: ToeicBook;
  lesson: ToeicLesson;
  completed: boolean;
  quizzes: (ToeicQuiz & { stat: QuizStat | null })[];
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

export async function getToeicLesson(
  supabase: SupabaseClient<Database>,
  lessonId: string
): Promise<LessonDetail | null> {
  const { data: lesson, error } = await supabase
    .from("toeic_lessons")
    .select("*")
    .eq("id", lessonId)
    .maybeSingle<ToeicLesson>();
  if (error) throw error;
  if (!lesson) return null;

  const [bookRes, siblingsRes, quizzesRes, progressRes, stats] = await Promise.all([
    supabase.from("toeic_books").select("*").eq("id", lesson.book_id).single<ToeicBook>(),
    supabase
      .from("toeic_lessons")
      .select("id, title, lesson_no")
      .eq("book_id", lesson.book_id)
      .order("lesson_no"),
    supabase.from("toeic_quizzes").select("*").eq("lesson_id", lesson.id).order("sort_order"),
    supabase
      .from("toeic_lesson_progress")
      .select("completed")
      .eq("lesson_id", lesson.id)
      .maybeSingle<{ completed: boolean }>(),
    getQuizStats(supabase, [lesson.id]),
  ]);
  for (const r of [bookRes, siblingsRes, quizzesRes, progressRes]) if (r.error) throw r.error;

  const siblings = siblingsRes.data ?? [];
  const idx = siblings.findIndex((s) => s.id === lesson.id);
  const pick = (i: number) =>
    i >= 0 && i < siblings.length ? { id: siblings[i].id, title: siblings[i].title } : null;

  return {
    book: bookRes.data as ToeicBook,
    lesson,
    completed: progressRes.data?.completed ?? false,
    quizzes: (quizzesRes.data ?? []).map((q) => {
      const s = stats.get(q.slug);
      return {
        ...q,
        stat: s
          ? {
              attempts: s.attempts,
              lastCorrect: s.lastCorrect,
              lastTotal: s.lastTotal,
              lastAt: s.lastAt,
              bestRatio: s.bestRatio,
            }
          : null,
      };
    }),
    prev: pick(idx - 1),
    next: pick(idx + 1),
  };
}

export interface RecordToeicResultInput {
  quiz_slug: string;
  correct: number;
  total: number;
  mistake_type?: string | null;
  note?: string | null;
}

/**
 * Ghi 1 lần làm đề Zenlish (điểm tự nhập). Không xác minh được với Zenlish nên
 * chỉ kiểm tra hợp lệ; nếu đề đã biết số câu (question_count) thì `total` phải
 * khớp — tránh gõ nhầm "5/60".
 */
export async function recordToeicResult(
  supabase: SupabaseClient<Database>,
  input: RecordToeicResultInput
): Promise<{ id: string }> {
  if (typeof input.quiz_slug !== "string" || !input.quiz_slug) {
    throw new ToeicError("Thiếu đề cần ghi điểm.");
  }
  const correct = input.correct;
  const total = input.total;
  if (!Number.isInteger(total) || total < 1 || total > TOEIC_MAX_QUESTIONS) {
    throw new ToeicError(`Tổng số câu phải là số nguyên từ 1 đến ${TOEIC_MAX_QUESTIONS}.`);
  }
  if (!Number.isInteger(correct) || correct < 0 || correct > total) {
    throw new ToeicError("Số câu đúng phải từ 0 đến tổng số câu.");
  }
  let mistakeType: MistakeType | null = null;
  if (input.mistake_type != null && input.mistake_type !== "") {
    if (!isMistakeType(input.mistake_type)) throw new ToeicError("Loại lỗi không hợp lệ.");
    mistakeType = input.mistake_type;
  }
  const note =
    typeof input.note === "string" ? input.note.trim().slice(0, TOEIC_NOTE_MAX) || null : null;

  const { data: quiz, error: quizErr } = await supabase
    .from("toeic_quizzes")
    .select("slug, question_count")
    .eq("slug", input.quiz_slug)
    .maybeSingle<{ slug: string; question_count: number | null }>();
  if (quizErr) throw quizErr;
  if (!quiz) throw new ToeicError("Không tìm thấy đề này.", 404);
  if (quiz.question_count != null && quiz.question_count !== total) {
    throw new ToeicError(`Đề này có ${quiz.question_count} câu — kiểm tra lại tổng số câu.`);
  }

  const { data, error } = await supabase
    .from("toeic_quiz_results")
    .insert({ quiz_slug: quiz.slug, correct, total, mistake_type: mistakeType, note })
    .select("id")
    .single<{ id: string }>();
  if (error) throw error;
  return data;
}

export interface SetToeicLessonProgressInput {
  lesson_id: string;
  completed: boolean;
}

export async function setToeicLessonProgress(
  supabase: SupabaseClient<Database>,
  input: SetToeicLessonProgressInput
): Promise<void> {
  if (typeof input.lesson_id !== "string" || !input.lesson_id) {
    throw new ToeicError("Thiếu bài học.");
  }
  if (typeof input.completed !== "boolean") {
    throw new ToeicError("completed phải là true/false.");
  }
  const { data: lesson, error: lessonErr } = await supabase
    .from("toeic_lessons")
    .select("id")
    .eq("id", input.lesson_id)
    .maybeSingle<{ id: string }>();
  if (lessonErr) throw lessonErr;
  if (!lesson) throw new ToeicError("Không tìm thấy bài học.", 404);

  const now = new Date().toISOString();
  const { error } = await supabase.from("toeic_lesson_progress").upsert(
    {
      lesson_id: lesson.id,
      completed: input.completed,
      completed_at: input.completed ? now : null,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" }
  );
  if (error) throw error;
}
