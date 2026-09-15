import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { setRoadmapProgress, type SetRoadmapProgressInput } from "@/lib/queries/roadmap";

// Body: { day: number, completed: boolean, note?: string }
// Upsert theo (user_id, day) — user_id không truyền lên, tự lấy từ phiên đăng
// nhập ở tầng DB (default auth.uid()).
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  await setRoadmapProgress(supabase, body as unknown as SetRoadmapProgressInput);
  return NextResponse.json({ ok: true }, { status: 200 });
});
