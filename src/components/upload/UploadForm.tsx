"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { buttonClassName, buttonShadowVar } from "@/components/ui/button-styles";

const EXAMPLE = `[
  {
    "prompt": "Thuật toán BFS trên đồ thị có V đỉnh, E cạnh (danh sách kề) có độ phức tạp thời gian là bao nhiêu?",
    "options": ["O(V log V)", "O(V + E)", "O(V²)", "O(E log V)"],
    "correct_option": 1,
    "explanation": "Mỗi đỉnh vào hàng đợi một lần, mỗi cạnh được xét một lần."
  }
]`;

export function UploadForm({ subjects }: { subjects: { id: string; name: string }[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [questionsJson, setQuestionsJson] = useState("");

  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedDeckId, setImportedDeckId] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadedPath(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/decks/upload", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Tải tệp thất bại.");
      setUploadedPath(body.path);
      setUploadedName(body.name);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setUploading(false);
    }
  }

  async function handleImport() {
    setImportError(null);
    setImportedDeckId(null);

    if (!subjectId) {
      setImportError("Chọn môn học trước.");
      return;
    }
    if (!title.trim()) {
      setImportError("Nhập tên bộ đề / chương.");
      return;
    }

    let questions: unknown;
    try {
      questions = JSON.parse(questionsJson);
    } catch {
      setImportError("JSON câu hỏi không hợp lệ — kiểm tra lại cú pháp.");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/decks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectId,
          title: title.trim(),
          source_file_url: uploadedPath,
          questions,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Import thất bại.");
      setImportedDeckId(body.deck.id);
      setTitle("");
      setQuestionsJson("");
      setUploadedPath(null);
      setUploadedName(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setImporting(false);
    }
  }

  if (subjects.length === 0) {
    return (
      <p className="font-bold text-sm text-ink-muted border border-dashed border-border-dashed rounded-2xl p-6 text-center">
        Chưa có môn học nào trong hệ thống — chạy migration seed hoặc tạo môn học trực tiếp trong
        Supabase trước khi import bộ đề.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <label
        className="block border-2 border-dashed border-border-dashed rounded-[20px] p-8 text-center cursor-pointer hover:border-yellow hover:bg-bg-accent transition-colors"
      >
        <div className="w-16 h-16 mx-auto mb-3.5 rounded-2xl border-2 border-border grid place-items-center font-display font-extrabold text-[28px] text-yellow-shadow">
          ↑
        </div>
        <div className="font-display font-extrabold text-xl text-ink">
          {uploading ? "Đang tải lên..." : uploadedName ? uploadedName : "Chọn tệp PDF/DOCX/ảnh"}
        </div>
        <p className="font-bold text-sm text-ink-muted mt-1 mb-4">Tối đa 25 MB. Tuỳ chọn — có thể import câu hỏi mà không cần file gốc.</p>
        <span className={buttonClassName("solid", "md")} style={buttonShadowVar("solid")}>
          Chọn tệp
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.csv"
          onChange={handleFileChange}
        />
      </label>
      {uploadError && <p className="font-bold text-sm text-orange -mt-2">{uploadError}</p>}
      {uploadedPath && (
        <p className="font-bold text-sm text-ink-muted -mt-2">
          Đã tải lên: <span className="text-ink">{uploadedName}</span> — sẽ được gắn vào bộ đề khi bạn import bên dưới.
        </p>
      )}

      <div className="border border-border rounded-2xl p-5">
        <div className="font-display font-extrabold text-lg text-ink mb-4">Import câu hỏi (JSON)</div>

        <div className="flex gap-3 flex-wrap mb-3.5">
          <div className="flex-1 min-w-[200px]">
            <label className="font-bold text-xs text-ink-muted mb-1.5 block">Gán vào môn</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 font-bold text-sm text-ink"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="font-bold text-xs text-ink-muted mb-1.5 block">Tên bộ đề / chương</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Chương 10 · Đồ thị"
              className="w-full border border-border rounded-xl px-3 py-2.5 font-bold text-sm text-ink"
            />
          </div>
        </div>

        <label className="font-bold text-xs text-ink-muted mb-1.5 block">
          Danh sách câu hỏi (mảng JSON — prompt, options, correct_option, explanation)
        </label>
        <textarea
          value={questionsJson}
          onChange={(e) => setQuestionsJson(e.target.value)}
          placeholder={EXAMPLE}
          rows={10}
          className="w-full border border-border rounded-xl px-3 py-2.5 font-mono text-[13px] text-ink"
        />

        {importError && <p className="font-bold text-sm text-orange mt-3">{importError}</p>}
        {importedDeckId && (
          <p className="font-bold text-sm text-yellow-shadow mt-3">
            Đã tạo bộ đề mới.{" "}
            <button
              className="underline"
              onClick={() => router.push(`/quiz/${importedDeckId}`)}
            >
              Làm ngay
            </button>
          </p>
        )}

        <div className="flex justify-end mt-4">
          <Button onClick={handleImport} disabled={importing} size="lg">
            {importing ? "Đang lưu..." : "Lưu bộ đề"}
          </Button>
        </div>
      </div>
    </div>
  );
}
