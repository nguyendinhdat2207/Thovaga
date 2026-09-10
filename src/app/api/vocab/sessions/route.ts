import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { recordVocabSession, type RecordVocabSessionInput } from "@/lib/queries/vocab";

// Body: { mode: "flashcard" | "quiz", started_at, finished_at, word_count, correct_count }
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  await recordVocabSession(supabase, body as unknown as RecordVocabSessionInput);
  return NextResponse.json({ ok: true }, { status: 201 });
});
