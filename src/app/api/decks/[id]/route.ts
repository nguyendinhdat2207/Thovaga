import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDeckWithQuestions } from "@/lib/queries/decks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const result = await getDeckWithQuestions(supabase, id);
    if (!result) {
      return NextResponse.json({ error: "Không tìm thấy deck." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
