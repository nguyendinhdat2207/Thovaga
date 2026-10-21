import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { setToeicLessonProgress, type SetToeicLessonProgressInput } from "@/lib/queries/toeic";

// Body: { lesson_id: string, completed: boolean } — upsert theo (user_id, lesson_id).
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  await setToeicLessonProgress(supabase, body as unknown as SetToeicLessonProgressInput);
  return NextResponse.json({ ok: true }, { status: 200 });
});
