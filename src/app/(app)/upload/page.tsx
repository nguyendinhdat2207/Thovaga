import { createClient } from "@/lib/supabase/server";
import { getSubjectsWithProgress } from "@/lib/queries/subjects";
import { UploadForm } from "@/components/upload/UploadForm";

export default async function UploadPage() {
  const supabase = await createClient();
  const subjects = await getSubjectsWithProgress(supabase);

  return (
    <div className="max-w-[820px] mx-auto px-5 py-6 pb-11">
      <h1 className="font-display font-extrabold text-[clamp(24px,4.6vw,32px)] tracking-tight text-ink">
        Tải đề &amp; tài liệu
      </h1>
      <p className="font-bold text-sm text-ink-muted mt-0.5 mb-6">
        PDF/DOCX/ảnh gốc (tuỳ chọn) + dán JSON câu hỏi để tạo bộ đề mới.
      </p>

      <UploadForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
