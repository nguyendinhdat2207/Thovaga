import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTotalStudiedMinutes } from "@/lib/queries/stats";
import { formatHours } from "@/lib/format";
import { AppChrome } from "@/components/AppChrome";

// Không tự gọi lại supabase.auth.getUser() ở đây — proxy.ts (middleware) đã
// xác thực và redirect /login cho mọi route trước khi tới layout này rồi.
// getUser() là network call thật tới Supabase Auth, gọi lặp lại chỉ tổ chậm.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  // Một câu SQL cộng dồn cả bộ đề lẫn phiên từ vựng, thay cho việc tải mọi
  // dòng duration_seconds của hai bảng về rồi cộng ở đây.
  const totalMinutes = await getTotalStudiedMinutes(supabase);

  return <AppChrome totalStudiedLabel={formatHours(totalMinutes)}>{children}</AppChrome>;
}
