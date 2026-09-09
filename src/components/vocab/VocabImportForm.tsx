"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ParsedWord {
  en: string;
  vi: string;
  example: string;
}

function parseBulk(text: string): ParsedWord[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return { en: parts[0] ?? "", vi: parts[1] ?? "", example: parts[2] ?? "" };
    })
    .filter((w) => w.en && w.vi);
}

const PLACEHOLDER = `abandon | từ bỏ | He abandoned his car.
ability | khả năng | She has the ability to lead.`;

export function VocabImportForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [bulk, setBulk] = useState("");
  const [words, setWords] = useState<ParsedWord[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleParse() {
    setWords(parseBulk(bulk));
    setError(null);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Nhập tên bộ từ.");
      return;
    }
    if (words.length === 0) {
      setError("Chưa có từ nào để lưu — bấm 'Xử lý danh sách' trước.");
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
      <div>
        <label className="font-bold text-xs text-ink-muted mb-1.5 block">Tên bộ từ</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: TOEIC Ngày 7"
          className="w-full border border-border rounded-xl px-3.5 py-3 font-bold text-[15px] text-ink outline-none focus:border-yellow"
        />
      </div>

      <div>
        <label className="font-bold text-xs text-ink-muted mb-1.5 block">
          Danh sách từ (mỗi dòng: từ | nghĩa | ví dụ)
        </label>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={10}
          className="w-full border border-border rounded-xl px-3.5 py-3 font-mono text-[13px] text-ink outline-none focus:border-yellow"
        />
        <Button variant="ghost" size="sm" className="mt-2" onClick={handleParse}>
          Xử lý danh sách
        </Button>
      </div>

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
                <span className="text-ink-muted">{w.vi}</span>
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
