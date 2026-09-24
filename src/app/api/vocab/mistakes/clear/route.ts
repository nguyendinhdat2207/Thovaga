import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { clearMistakePack, MistakePackError } from "@/lib/queries/vocab";

// Body: { pack_number: number }
// Chỉ được gọi từ VocabQuizRunner sau khi người dùng ôn đúng 100% cả gói
// trong 1 lượt — không có nút xoá tay nào trong UI dẫn tới route này.
export const POST = withAuth(async ({ supabase, req }) => {
  const body = (await readJsonBody(req)) as { pack_number?: unknown };
  const packNumber = Number(body.pack_number);
  if (!Number.isInteger(packNumber)) {
    throw new MistakePackError("pack_number phải là số nguyên.");
  }
  await clearMistakePack(supabase, packNumber);
  return NextResponse.json({ ok: true }, { status: 200 });
});
