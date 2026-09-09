import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Deck, Attempt } from "@/lib/database.types";

export interface SubjectWithProgress {
  id: string;
  name: string;
  category: Database["public"]["Tables"]["subjects"]["Row"]["category"];
  created_at: string;
  deckCount: number;
  completedDeckCount: number;
  progressPct: number;
  lastScore: number | null;
}

// % tiến độ = số deck có ít nhất 1 attempt đã hoàn thành / tổng số deck của môn.
export async function getSubjectsWithProgress(
  supabase: SupabaseClient<Database>
): Promise<SubjectWithProgress[]> {
  const [subjectsRes, decksRes, attemptsRes] = await Promise.all([
    supabase.from("subjects").select("*").order("created_at", { ascending: true }),
    supabase.from("decks").select("id, subject_id").order("created_at", { ascending: true }),
    supabase
      .from("attempts")
      .select("deck_id, score, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (subjectsRes.error) throw subjectsRes.error;
  if (decksRes.error) throw decksRes.error;
  if (attemptsRes.error) throw attemptsRes.error;

  const decks = decksRes.data ?? [];
  const attempts = attemptsRes.data ?? [];
  const deckIdsWithAttempt = new Set(attempts.map((a) => a.deck_id));
  const deckToSubject = new Map(decks.map((d) => [d.id, d.subject_id] as const));

  return (subjectsRes.data ?? []).map((subject) => {
    const subjectDecks = decks.filter((d) => d.subject_id === subject.id);
    const completedDeckCount = subjectDecks.filter((d) => deckIdsWithAttempt.has(d.id)).length;
    const lastAttempt = attempts.find((a) => deckToSubject.get(a.deck_id) === subject.id);

    return {
      ...subject,
      deckCount: subjectDecks.length,
      completedDeckCount,
      progressPct: subjectDecks.length
        ? Math.round((completedDeckCount / subjectDecks.length) * 100)
        : 0,
      lastScore: lastAttempt?.score ?? null,
    };
  });
}

export interface DeckWithStats extends Deck {
  attemptCount: number;
  bestScore: number | null;
  lastAttempt: Attempt | null;
}

export interface SubjectDetail {
  subject: Database["public"]["Tables"]["subjects"]["Row"];
  decks: DeckWithStats[];
  recentAttempts: (Attempt & { deckTitle: string })[];
}

export async function getSubjectDetail(
  supabase: SupabaseClient<Database>,
  subjectId: string
): Promise<SubjectDetail | null> {
  const { data: subject, error: subjectErr } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .maybeSingle();
  if (subjectErr) throw subjectErr;
  if (!subject) return null;

  const { data: decks, error: decksErr } = await supabase
    .from("decks")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });
  if (decksErr) throw decksErr;

  const deckIds = (decks ?? []).map((d) => d.id);
  const { data: attempts, error: attemptsErr } =
    deckIds.length > 0
      ? await supabase
          .from("attempts")
          .select("*")
          .in("deck_id", deckIds)
          .order("created_at", { ascending: false })
      : { data: [] as Attempt[], error: null };
  if (attemptsErr) throw attemptsErr;

  const decksWithStats: DeckWithStats[] = (decks ?? []).map((deck) => {
    const deckAttempts = (attempts ?? []).filter((a) => a.deck_id === deck.id);
    const bestScore = deckAttempts.length
      ? Math.max(...deckAttempts.map((a) => a.score))
      : null;
    return {
      ...deck,
      attemptCount: deckAttempts.length,
      bestScore,
      lastAttempt: deckAttempts[0] ?? null,
    };
  });

  const deckTitleById = new Map((decks ?? []).map((d) => [d.id, d.title] as const));

  return {
    subject,
    decks: decksWithStats,
    recentAttempts: (attempts ?? []).slice(0, 5).map((a) => ({
      ...a,
      deckTitle: deckTitleById.get(a.deck_id) ?? "",
    })),
  };
}
