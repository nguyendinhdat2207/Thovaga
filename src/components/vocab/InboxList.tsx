"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InboxQuickAdd } from "@/components/vocab/InboxQuickAdd";
import { formatInboxForClaude } from "@/lib/toeic";

interface Item {
  id: string;
  raw_text: string;
  context: string | null;
  source: string | null;
  created_at: string;
}

export function InboxList({
  initialItems,
  weekLabel,
}: {
  initialItems: Item[];
  weekLabel: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportText = formatInboxForClaude(items, weekLabel);

  async function copy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Trình duyệt chặn copy — bôi đen đoạn bên dưới rồi copy tay.");
    }
  }

  // Xác nhận 2 bước bằng chính nút (không dùng confirm() của trình duyệt).
  async function markAll() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vocab/inbox/processed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((i) => i.id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Không lưu được, thử lại nhé.");
      }
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-border rounded-[20px] p-4 flex flex-col gap-2.5">
        <h2 className="font-display font-extrabold text-[17px] text-ink">Ghi từ mới</h2>
        <InboxQuickAdd onAdded={(item) => setItems((xs) => [...xs, item])} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display font-extrabold text-[19px] text-ink">
            Chưa xử lý <span className="font-bold text-sm text-ink-muted">({items.length})</span>
          </h2>
          {items.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={copy}>
                {copied ? "Đã copy ✓" : "Copy cho Claude"}
              </Button>
              <Button size="sm" variant={confirming ? "danger" : "ghost"} onClick={markAll} disabled={busy}>
                {busy ? "Đang lưu..." : confirming ? "Bấm lần nữa để xác nhận" : "Đánh dấu đã xử lý hết"}
              </Button>
            </div>
          )}
        </div>
        {error && <p className="font-bold text-xs text-orange">{error}</p>}

        {items.length === 0 ? (
          <div className="border border-dashed border-border-dashed rounded-2xl p-5 text-center font-bold text-sm text-ink-muted">
            Sổ đang trống. Gặp từ lạ khi làm đề Zenlish thì ghi ở trang bài học TOEIC hoặc ô phía trên.
          </div>
        ) : (
          <>
            <ol className="flex flex-col gap-2">
              {items.map((it, i) => (
                <li key={it.id} className="bg-badge-bg rounded-xl px-3.5 py-2.5">
                  <div className="font-bold text-[15px] text-ink">
                    {i + 1}. {it.raw_text}
                    {it.source && (
                      <span className="ml-2 font-display font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-white text-ink-muted">
                        {it.source}
                      </span>
                    )}
                  </div>
                  {it.context && (
                    <div className="font-bold text-xs text-ink-muted mt-1">{it.context}</div>
                  )}
                </li>
              ))}
            </ol>
            <details className="border border-border rounded-2xl px-4 py-3">
              <summary className="font-display font-extrabold text-sm text-ink cursor-pointer">
                Xem đoạn sẽ copy
              </summary>
              <pre className="mt-3 whitespace-pre-wrap font-bold text-xs text-ink bg-badge-bg rounded-xl p-3">
                {exportText}
              </pre>
            </details>
          </>
        )}
      </section>

      <section className="border-2 border-yellow bg-yellow-pale rounded-2xl px-4 py-3.5">
        <div className="font-display font-extrabold text-xs text-yellow-shadow uppercase tracking-wide mb-1.5">
          Quy trình mỗi tuần
        </div>
        <ol className="list-decimal pl-5 font-bold text-sm text-ink leading-relaxed">
          <li>Bấm “Copy cho Claude”, dán vào Claude (Project “Học tiếng anh”).</li>
          <li>Claude trả về khối <code>từ | nghĩa | ví dụ</code> đã chuẩn hoá.</li>
          <li>
            Vào <Link className="underline" href="/vocab/import">Thêm từ mới</Link>, dán khối đó, đặt tên
            bộ “Zenlish · {weekLabel}”.
          </li>
          <li>Quay lại đây bấm “Đánh dấu đã xử lý hết”.</li>
        </ol>
      </section>
    </div>
  );
}
