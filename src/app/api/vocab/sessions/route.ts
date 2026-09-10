import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordVocabSession, VocabSessionError } from "@/lib/queries/vocab";

// Body: { mode: "flashcard" | "quiz", started_at, finished_at, word_count, correct_count }
export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  try {
    await recordVocabSession(supabase, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof VocabSessionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
