import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { addInboxItem, type AddInboxItemInput } from "@/lib/queries/vocab-inbox";

// Body: { raw_text: string, context?: string, source?: string } — thêm 1 mục Sổ ghi nhanh.
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  const item = await addInboxItem(supabase, body as unknown as AddInboxItemInput);
  return NextResponse.json({ item }, { status: 201 });
});
