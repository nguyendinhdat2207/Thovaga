import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHistory } from "@/lib/queries/attempts";

export async function GET() {
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const history = await getHistory(supabase);
    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
