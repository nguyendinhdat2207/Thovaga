"use client";

import { useMemo, useState } from "react";
import type { VocabWordWithProgress } from "@/lib/queries/vocab";

interface DeckOption {
  id: string;
  title: string;
}

function isDue(word: VocabWordWithProgress): boolean {
  if (!word.progress) return true;
  return word.progress.next_review <= new Date().toISOString().slice(0, 10);
}

export function VocabBank({
  decks,
  words,
}: {
  decks: DeckOption[];
  words: VocabWordWithProgress[];
}) {
  const [deckFilter, setDeckFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const deckTitleById = useMemo(() => new Map(decks.map((d) => [d.id, d.title] as const)), [decks]);

  const filtered = words.filter((w) => {
    const matchDeck = deckFilter === "all" || w.deck_id === deckFilter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || w.en.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q);
    return matchDeck && matchSearch;
  });

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6 pb-10">
      <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink mb-4">
        Kho từ
      </h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm từ..."
        className="w-full border border-border rounded-xl px-3.5 py-3 font-bold text-[15px] text-ink outline-none focus:border-yellow mb-3"
      />

      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setDeckFilter("all")}
          className={`px-3.5 py-1.5 rounded-full font-bold text-xs border ${
            deckFilter === "all" ? "bg-ink text-white border-ink" : "border-border text-ink-muted"
          }`}
        >
          Tất cả
        </button>
        {decks.map((d) => (
          <button
            key={d.id}
            onClick={() => setDeckFilter(d.id)}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs border ${
              deckFilter === d.id ? "bg-ink text-white border-ink" : "border-border text-ink-muted"
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {filtered.map((w) => (
          <div key={w.id} className="border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="font-display font-extrabold text-[17px] text-ink">{w.en}</div>
              {isDue(w) && (
                <span className="font-bold text-[10px] text-orange bg-orange-pale rounded-full px-2 py-0.5 whitespace-nowrap">
                  Đến hạn
                </span>
              )}
            </div>
            <div className="font-bold text-sm text-ink-muted mt-1">{w.vi}</div>
            {w.example && (
              <p className="font-bold text-xs text-ink-faint italic mt-2">&quot;{w.example}&quot;</p>
            )}
            <div className="font-bold text-[11px] text-ink-faint mt-2.5">
              {deckTitleById.get(w.deck_id) ?? ""} · {w.progress ? `cấp độ ${w.progress.box}/5` : "chưa ôn"}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="font-bold text-sm text-ink-muted text-center py-10">Không tìm thấy từ nào.</p>
      )}
    </div>
  );
}
