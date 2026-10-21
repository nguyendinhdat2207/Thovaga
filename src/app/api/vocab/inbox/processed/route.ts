import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { markInboxProcessed } from "@/lib/queries/vocab-inbox";

// Body: { ids: string[] } — đánh dấu các mục Sổ ghi nhanh đã chuẩn hoá xong.
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  const updated = await markInboxProcessed(supabase, body as { ids: unknown });
  return NextResponse.json({ updated }, { status: 200 });
});
