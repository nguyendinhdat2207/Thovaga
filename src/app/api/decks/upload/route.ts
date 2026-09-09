import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const BUCKET = "documents";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Nhận file (PDF/DOCX/ảnh) qua multipart/form-data, upload lên Supabase Storage
// (bucket riêng tư "documents") và trả về đường dẫn lưu trong `source_file_url`.
//
// TODO(v2 - trích câu hỏi tự động bằng AI): sau khi có file gốc ở đây, bước tiếp
// theo là đọc file này (PDF/DOCX/ảnh), gọi một model để tách câu hỏi + đáp án,
// rồi gọi importDeck() (xem src/lib/queries/decks-import.ts) để tạo deck +
// questions tự động — hiện tại người dùng vẫn cần tự dán JSON qua
// POST /api/decks/import sau khi tải file lên ở đây.
export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file (field 'file')." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File vượt quá 25 MB." }, { status: 400 });
  }

  const path = `${userData.user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // Bucket riêng tư, nên trả kèm signed URL (7 ngày) để xem trước ngay lúc tải lên.
  // `source_file_url` lưu trong DB nên lưu `path` (ổn định) — sinh lại signed URL
  // khi cần hiển thị, vì signed URL sẽ hết hạn.
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  return NextResponse.json(
    { path, previewUrl: signed?.signedUrl ?? null, name: file.name, size: file.size },
    { status: 201 }
  );
}
