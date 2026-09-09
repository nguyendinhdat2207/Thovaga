import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTotalStudiedMinutes } from "@/lib/queries/attempts";
import { formatHours } from "@/lib/format";
import { AppChrome } from "@/components/AppChrome";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  const totalMinutes = await getTotalStudiedMinutes(supabase);

  return <AppChrome totalStudiedLabel={formatHours(totalMinutes)}>{children}</AppChrome>;
}
