import { NextResponse } from "next/server";
import { withAuth, readJsonBody } from "@/lib/api/route-helpers";
import { recordToeicResult, type RecordToeicResultInput } from "@/lib/queries/toeic";

// Body: { quiz_slug, correct, total, mistake_type?, note? }
// Điểm làm đề Zenlish do người dùng tự nhập — server chỉ kiểm tra hợp lệ
// (xem recordToeicResult), user_id lấy từ auth.uid() ở DB.
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  const result = await recordToeicResult(supabase, body as unknown as RecordToeicResultInput);
  return NextResponse.json({ result }, { status: 201 });
});
