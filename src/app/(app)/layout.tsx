import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTotalStudiedMinutes } from "@/lib/queries/attempts";
import { getTotalVocabMinutes } from "@/lib/queries/vocab";
import { formatHours } from "@/lib/format";
import { AppChrome } from "@/components/AppChrome";

// Không tự gọi lại supabase.auth.getUser() ở đây — proxy.ts (middleware) đã
// xác thực và redirect /login cho mọi route trước khi tới layout này rồi.
// getUser() là network call thật tới Supabase Auth, gọi lặp lại chỉ tổ chậm.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const [quizMinutes, vocabMinutes] = await Promise.all([
    getTotalStudiedMinutes(supabase),
    getTotalVocabMinutes(supabase),
  ]);

  return <AppChrome totalStudiedLabel={formatHours(quizMinutes + vocabMinutes)}>{children}</AppChrome>;
}
