import { NextResponse } from "next/server";
import { withAuth, BadRequestError } from "@/lib/api/route-helpers";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const BUCKET = "documents";
/** Hạn của link xem trước trả về ngay sau khi tải lên. Bucket là riêng tư nên
 * link phải ký; hết hạn thì sinh lại từ `path` đã lưu trong DB. */
const PREVIEW_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 ngày

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Nhận file (PDF/DOCX/ảnh) qua multipart/form-data, upload lên Supabase Storage
// (bucket riêng tư "documents") và trả về đường dẫn lưu trong `source_file_url`.
//
// TODO(v2 - trích câu hỏi tự động bằng AI): sau khi có file gốc ở đây, bước tiếp
// theo là đọc file này (PDF/DOCX/ảnh), gọi một model để tách câu hỏi + đáp án,
// rồi gọi importDeck() (xem src/lib/queries/decks-import.ts) để tạo deck +
// questions tự động — hiện tại người dùng vẫn cần tự dán JSON/Markdown qua
// POST /api/decks/import sau khi tải file lên ở đây.
export const POST = withAuth(async ({ supabase, user, req }) => {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    throw new BadRequestError("Thiếu file (field 'file').");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new BadRequestError("File vượt quá 25 MB.");
  }

  const path = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadErr) throw uploadErr;

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, PREVIEW_URL_TTL_SECONDS);

  return NextResponse.json(
    { path, previewUrl: signed?.signedUrl ?? null, name: file.name, size: file.size },
    { status: 201 }
  );
});
