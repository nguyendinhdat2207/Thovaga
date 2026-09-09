import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importVocabDeck, ImportVocabError } from "@/lib/queries/vocab";

// Body: { title, words: [{ en, vi, example? }] }
export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  try {
    const deck = await importVocabDeck(supabase, body);
    return NextResponse.json({ deck }, { status: 201 });
  } catch (err) {
    if (err instanceof ImportVocabError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
