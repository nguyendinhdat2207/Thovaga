import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { importDeck, type ImportDeckInput } from "@/lib/queries/decks-import";

// Dán tay JSON câu hỏi theo schema:
// { subject_id | subject_name, title, source_file_url?, questions: [{ prompt, options: string[], correct_option, explanation? }] }
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  const deck = await importDeck(supabase, body as unknown as ImportDeckInput);
  return NextResponse.json({ deck }, { status: 201 });
});
