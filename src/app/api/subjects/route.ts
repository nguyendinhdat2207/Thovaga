import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubjectsWithProgress } from "@/lib/queries/subjects";

export async function GET() {
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const subjects = await getSubjectsWithProgress(supabase);
    return NextResponse.json({ subjects });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
