"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { INBOX_CONTEXT_MAX, INBOX_SOURCE_MAX, INBOX_TEXT_MAX } from "@/lib/toeic";

/**
 * Ô ghi nhanh 1 từ lạ vào Sổ ghi nhanh (vocab_inbox). Cố ý tối giản: gõ từ,
 * Enter là lưu — đang làm đề không nên bị ngắt mạch. Nghĩa/phiên âm để Claude
 * chuẩn hoá sau.
 */
export function InboxQuickAdd({
  defaultSource = "",
  onAdded,
}: {
  defaultSource?: string;
  onAdded?: (item: { id: string; raw_text: string; context: string | null; source: string | null; created_at: string }) => void;
}) {
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [source, setSource] = useState(defaultSource);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/vocab/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text, context, source }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Không lưu được, thử lại nhé.");
      onAdded?.(body.item);
      setMessage({ ok: true, text: `Đã ghi “${text.trim()}”` });
      setText("");
      setContext("");
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Không lưu được." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="inbox-text">
          Từ hoặc cụm từ mới
        </label>
        <input
          id="inbox-text"
          type="text"
          value={text}
          maxLength={INBOX_TEXT_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="vd: comply with"
          className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2.5 bg-white font-bold text-sm text-ink outline-none focus:border-yellow"
        />
        <Button type="submit" size="sm" disabled={saving || !text.trim()}>
          {saving ? "..." : "Ghi"}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="self-start font-bold text-xs text-ink-muted hover:text-ink"
        aria-expanded={showMore}
      >
        {showMore ? "Ẩn nguồn & câu gốc" : "+ Nguồn & câu gốc (không bắt buộc)"}
      </button>
      {showMore && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 font-bold text-xs text-ink-muted">
            Nguồn
            <input
              type="text"
              value={source}
              maxLength={INBOX_SOURCE_MAX}
              onChange={(e) => setSource(e.target.value)}
              placeholder="vd: Ca RC2 câu 5"
              className="border border-border rounded-xl px-3 py-2 bg-white font-bold text-sm text-ink outline-none focus:border-yellow"
            />
          </label>
          <label className="flex flex-col gap-1 font-bold text-xs text-ink-muted">
            Câu gốc trong đề
            <textarea
              value={context}
              maxLength={INBOX_CONTEXT_MAX}
              rows={2}
              onChange={(e) => setContext(e.target.value)}
              className="border border-border rounded-xl px-3 py-2 bg-white font-bold text-sm text-ink outline-none focus:border-yellow resize-none"
            />
          </label>
        </div>
      )}
      {message && (
        <p className={`font-bold text-xs ${message.ok ? "text-green-shadow" : "text-orange"}`} role="status">
          {message.text}
        </p>
      )}
    </form>
  );
}
