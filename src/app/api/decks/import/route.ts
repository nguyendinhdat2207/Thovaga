import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importDeck, ImportDeckError } from "@/lib/queries/decks-import";

// Dán tay JSON câu hỏi theo schema:
// { subject_id, title, source_file_url?, questions: [{ prompt, options: string[], correct_option, explanation? }] }
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
    const deck = await importDeck(supabase, body);
    return NextResponse.json({ deck }, { status: 201 });
  } catch (err) {
    if (err instanceof ImportDeckError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
