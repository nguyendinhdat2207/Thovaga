import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/route-helpers";
import { getDeckWithQuestions } from "@/lib/queries/decks";

export const GET = withAuth<{ id: string }>(async ({ supabase, params }) => {
  const result = await getDeckWithQuestions(supabase, params.id);
  if (!result) {
    return NextResponse.json({ error: "Không tìm thấy deck." }, { status: 404 });
  }
  return NextResponse.json(result);
});
