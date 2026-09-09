import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateVocabProgress, gradeVocabQuizAnswer, VocabProgressError } from "@/lib/queries/vocab";

// Body: { word_id, mode: "flashcard" | "quiz", know?: boolean, picked?: string }
// mode "flashcard": tin đánh giá "know" của người dùng (tự đánh giá, không có
// đáp án đúng để verify). mode "quiz": server tự so "picked" với nghĩa đúng
// trong DB — không tin correctness do client tính.
export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.word_id || !body.mode) {
    return NextResponse.json({ error: "word_id và mode là bắt buộc." }, { status: 400 });
  }

  try {
    if (body.mode === "quiz") {
      if (typeof body.picked !== "string") {
        return NextResponse.json({ error: "picked là bắt buộc cho mode quiz." }, { status: 400 });
      }
      const result = await gradeVocabQuizAnswer(supabase, body.word_id, body.picked);
      return NextResponse.json(result);
    }

    if (body.mode === "flashcard") {
      if (typeof body.know !== "boolean") {
        return NextResponse.json({ error: "know là bắt buộc cho mode flashcard." }, { status: 400 });
      }
      const progress = await updateVocabProgress(supabase, body.word_id, body.know);
      return NextResponse.json({ progress });
    }

    return NextResponse.json({ error: "mode không hợp lệ." }, { status: 400 });
  } catch (err) {
    if (err instanceof VocabProgressError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
