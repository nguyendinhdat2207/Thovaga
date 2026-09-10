"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { buttonClassName, buttonShadowVar } from "@/components/ui/button-styles";
import { parseQuizMarkdown, MarkdownParseError } from "@/lib/markdown-import";

const JSON_EXAMPLE = `[
  {
    "prompt": "Thuật toán BFS trên đồ thị có V đỉnh, E cạnh (danh sách kề) có độ phức tạp thời gian là bao nhiêu?",
    "options": ["O(V log V)", "O(V + E)", "O(V²)", "O(E log V)"],
    "correct_option": 1,
    "explanation": "Mỗi đỉnh vào hàng đợi một lần, mỗi cạnh được xét một lần."
  }
]`;

const MARKDOWN_EXAMPLE = `# Chương 5: Mạng máy tính
Subject: Mạng máy tính
Category: school

1. Giao thức nào hoạt động ở tầng transport?
A. HTTP
B. TCP
C. IP
D. Ethernet
Answer: B
Explanation: TCP là giao thức tầng transport.`;

type Mode = "json" | "markdown";

export function UploadForm({ subjects }: { subjects: { id: string; name: string }[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("json");

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [questionsJson, setQuestionsJson] = useState("");
  const [markdown, setMarkdown] = useState("");

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

  function handleMarkdownFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMarkdown(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function submitImport(body: Record<string, unknown>) {
    setImporting(true);
    try {
      const res = await fetch("/api/decks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.error ?? "Import thất bại.");
      setImportedDeckId(resBody.deck.id);
      setTitle("");
      setQuestionsJson("");
      setMarkdown("");
      setUploadedPath(null);
      setUploadedName(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setImporting(false);
    }
  }

  async function handleImportJson() {
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

    await submitImport({
      subject_id: subjectId,
      title: title.trim(),
      source_file_url: uploadedPath,
      questions,
    });
  }

  async function handleImportMarkdown() {
    setImportError(null);
    setImportedDeckId(null);

    let parsed: ReturnType<typeof parseQuizMarkdown>;
    try {
      parsed = parseQuizMarkdown(markdown);
    } catch (err) {
      setImportError(err instanceof MarkdownParseError ? err.message : "Không đọc được nội dung markdown.");
      return;
    }

    if (!parsed.subjectName && !subjectId) {
      setImportError("File markdown không có dòng \"Subject:\" — hãy chọn môn học bên dưới hoặc thêm dòng đó vào file.");
      return;
    }

    await submitImport({
      subject_id: parsed.subjectName ? undefined : subjectId,
      subject_name: parsed.subjectName ?? undefined,
      subject_category: parsed.category ?? undefined,
      title: parsed.title,
      source_file_url: uploadedPath,
      questions: parsed.questions,
    });
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
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="font-display font-extrabold text-lg text-ink">Import câu hỏi</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setMode("json")}
              className={`px-3.5 py-1.5 rounded-full font-bold text-xs border ${
                mode === "json" ? "bg-ink text-white border-ink" : "border-border text-ink-muted"
              }`}
            >
              Dán JSON
            </button>
            <button
              onClick={() => setMode("markdown")}
              className={`px-3.5 py-1.5 rounded-full font-bold text-xs border ${
                mode === "markdown" ? "bg-ink text-white border-ink" : "border-border text-ink-muted"
              }`}
            >
              Dán Markdown
            </button>
          </div>
        </div>

        {mode === "json" ? (
          subjects.length === 0 ? (
            <p className="font-bold text-sm text-ink-muted border border-dashed border-border-dashed rounded-2xl p-5 text-center">
              Chưa có môn học nào — dùng chế độ &quot;Dán Markdown&quot; với dòng{" "}
              <span className="text-ink">Subject: &lt;tên môn&gt;</span> để tự tạo môn mới.
            </p>
          ) : (
            <>
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
                placeholder={JSON_EXAMPLE}
                rows={10}
                className="w-full border border-border rounded-xl px-3 py-2.5 font-mono text-[13px] text-ink"
              />

              <div className="flex justify-end mt-4">
                <Button onClick={handleImportJson} disabled={importing} size="lg">
                  {importing ? "Đang lưu..." : "Lưu bộ đề"}
                </Button>
              </div>
            </>
          )
        ) : (
          <>
            <p className="font-bold text-[13px] text-ink-muted mb-3">
              Dán nội dung markdown (câu hỏi đã OCR sẵn) hoặc chọn file <span className="text-ink">.md</span>.
              File cần dòng <span className="text-ink"># Tên bộ đề</span> và{" "}
              <span className="text-ink">Subject: &lt;tên môn&gt;</span> (tự tạo môn nếu chưa có).
            </p>
            <button
              className={buttonClassName("ghost", "sm", "mb-3")}
              style={buttonShadowVar("ghost")}
              onClick={() => mdFileInputRef.current?.click()}
              type="button"
            >
              Chọn file .md
            </button>
            <input
              ref={mdFileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleMarkdownFileChange}
            />
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={MARKDOWN_EXAMPLE}
              rows={14}
              className="w-full border border-border rounded-xl px-3 py-2.5 font-mono text-[13px] text-ink"
            />

            {subjects.length > 0 && (
              <div className="mt-3">
                <label className="font-bold text-xs text-ink-muted mb-1.5 block">
                  Môn học (chỉ dùng khi file không có dòng &quot;Subject:&quot;)
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full sm:w-auto border border-border rounded-xl px-3 py-2.5 font-bold text-sm text-ink"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button onClick={handleImportMarkdown} disabled={importing} size="lg">
                {importing ? "Đang lưu..." : "Lưu bộ đề"}
              </Button>
            </div>
          </>
        )}

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
      </div>
    </div>
  );
}
