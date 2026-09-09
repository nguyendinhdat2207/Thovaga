import { VocabImportForm } from "@/components/vocab/VocabImportForm";

export default function VocabImportPage() {
  return (
    <div className="max-w-[720px] mx-auto px-5 py-6 pb-10">
      <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink mb-1">
        Thêm từ mới
      </h1>
      <p className="font-bold text-sm text-ink-muted mb-6">
        Dán danh sách từ, mỗi dòng theo định dạng{" "}
        <span className="text-ink">từ | nghĩa | ví dụ</span>.
      </p>
      <VocabImportForm />
    </div>
  );
}
