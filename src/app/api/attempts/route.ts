import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { recordAttempt, type RecordAttemptInput } from "@/lib/queries/attempts";

export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  const attempt = await recordAttempt(supabase, body as unknown as RecordAttemptInput);
  return NextResponse.json({ attempt }, { status: 201 });
});
