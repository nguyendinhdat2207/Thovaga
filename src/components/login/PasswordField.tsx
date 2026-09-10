"use client";

import { useState } from "react";

export function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="font-bold text-xs text-ink-muted mb-1.5 block">Mật khẩu</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name="password"
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="current-password"
          className="w-full border border-border rounded-xl px-3.5 py-3 pr-16 font-bold text-[15px] text-ink outline-none focus:border-yellow"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-ink-muted"
        >
          {visible ? "Ẩn" : "Hiện"}
        </button>
      </div>
    </div>
  );
}
