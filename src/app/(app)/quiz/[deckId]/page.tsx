import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDeckWithQuestions } from "@/lib/queries/decks";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const supabase = await createClient();
  const result = await getDeckWithQuestions(supabase, deckId);
  if (!result || result.questions.length === 0) notFound();

  return <QuizRunner deck={result.deck} questions={result.questions} />;
}
