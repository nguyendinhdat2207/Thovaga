"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { buttonClassName, buttonShadowVar } from "@/components/ui/button-styles";
import { parseVocabMarkdown, MarkdownParseError, type ParsedVocabWord } from "@/lib/markdown-import";

function parseBulk(text: string): ParsedVocabWord[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return { en: parts[0] ?? "", vi: parts[1] ?? "", example: parts[2] || null, distractors: null };
    })
    .filter((w) => w.en && w.vi);
}

const PIPE_PLACEHOLDER = `abandon | từ bỏ | He abandoned his car.
ability | khả năng | She has the ability to lead.`;

const MARKDOWN_PLACEHOLDER = `# TOEIC Ngày 11

1. run
Meaning: chạy
Example: He runs every morning.
A. chạy
B. đi bộ
C. nhảy
D. bơi
Answer: A`;

type Mode = "pipe" | "markdown";

export function VocabImportForm() {
  const router = useRouter();
  const mdFileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("pipe");
  const [title, setTitle] = useState("");
  const [bulk, setBulk] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [words, setWords] = useState<ParsedVocabWord[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleParsePipe() {
    setWords(parseBulk(bulk));
    setError(null);
  }

  function handleParseMarkdown() {
    setError(null);
    try {
      const parsed = parseVocabMarkdown(markdown);
      if (!title.trim()) setTitle(parsed.title);
      setWords(parsed.words);
    } catch (err) {
      setWords([]);
      setError(err instanceof MarkdownParseError ? err.message : "Không đọc được nội dung markdown.");
    }
  }

  function handleMarkdownFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMarkdown(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Nhập tên bộ từ.");
      return;
    }
    if (words.length === 0) {
      setError(
        mode === "pipe"
          ? "Chưa có từ nào để lưu — bấm 'Xử lý danh sách' trước."
          : "Chưa có từ nào để lưu — bấm 'Xử lý markdown' trước."
      );
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/vocab/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), words }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Import thất bại.");
      router.push("/vocab");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <label className="font-bold text-xs text-ink-muted block">Tên bộ từ</label>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              setMode("pipe");
              setWords([]);
              setError(null);
            }}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs border ${
              mode === "pipe" ? "bg-ink text-white border-ink" : "border-border text-ink-muted"
            }`}
          >
            Dán danh sách
          </button>
          <button
            onClick={() => {
              setMode("markdown");
              setWords([]);
              setError(null);
            }}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs border ${
              mode === "markdown" ? "bg-ink text-white border-ink" : "border-border text-ink-muted"
            }`}
          >
            Dán Markdown
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ví dụ: TOEIC Ngày 7"
        className="w-full border border-border rounded-xl px-3.5 py-3 font-bold text-[15px] text-ink outline-none focus:border-yellow"
      />

      {mode === "pipe" ? (
        <div>
          <label className="font-bold text-xs text-ink-muted mb-1.5 block">
            Danh sách từ (mỗi dòng: từ | nghĩa | ví dụ)
          </label>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={PIPE_PLACEHOLDER}
            rows={10}
            className="w-full border border-border rounded-xl px-3.5 py-3 font-mono text-[13px] text-ink outline-none focus:border-yellow"
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={handleParsePipe}>
            Xử lý danh sách
          </Button>
        </div>
      ) : (
        <div>
          <p className="font-bold text-[13px] text-ink-muted mb-2">
            Dán nội dung markdown (đã OCR sẵn: từ + nghĩa + ví dụ + 4 lựa chọn A-D) hoặc chọn file{" "}
            <span className="text-ink">.md</span>.
          </p>
          <button
            className={buttonClassName("ghost", "sm", "mb-2")}
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
          <label className="font-bold text-xs text-ink-muted mb-1.5 block">Nội dung markdown</label>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={MARKDOWN_PLACEHOLDER}
            rows={14}
            className="w-full border border-border rounded-xl px-3.5 py-3 font-mono text-[13px] text-ink outline-none focus:border-yellow"
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={handleParseMarkdown}>
            Xử lý markdown
          </Button>
        </div>
      )}

      {words.length > 0 && (
        <div>
          <div className="font-display font-extrabold text-sm text-ink-muted uppercase tracking-wide mb-2">
            Xem trước ({words.length} từ)
          </div>
          <div className="max-h-[280px] overflow-y-auto flex flex-col gap-1.5">
            {words.map((w, i) => (
              <div
                key={i}
                className="flex justify-between gap-2 bg-track rounded-lg px-3 py-2 text-sm"
              >
                <span className="font-extrabold text-ink">{w.en}</span>
                <span className="text-ink-muted">
                  {w.vi}
                  {w.distractors && w.distractors.length > 0 ? ` · nhiễu: ${w.distractors.length}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="font-bold text-sm text-orange">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={importing} size="lg">
          {importing ? "Đang lưu..." : `Lưu bộ từ (${words.length} từ)`}
        </Button>
      </div>
    </div>
  );
}
