import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { importVocabDeck, type ImportVocabDeckInput } from "@/lib/queries/vocab";

// Body: { title, words: [{ en, vi, example?, distractors? }] }
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  const deck = await importVocabDeck(supabase, body as unknown as ImportVocabDeckInput);
  return NextResponse.json({ deck }, { status: 201 });
});
