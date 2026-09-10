import { NextResponse } from "next/server";
import { withAuth, readJsonBody, BadRequestError } from "@/lib/api/route-helpers";
import { updateVocabProgress, gradeVocabQuizAnswer } from "@/lib/queries/vocab";

// Body: { word_id, mode: "flashcard" | "quiz", know?: boolean, picked?: string }
// mode "flashcard": tin đánh giá "know" của người dùng (tự đánh giá, không có
// đáp án đúng để verify). mode "quiz": server tự so "picked" với nghĩa đúng
// trong DB — không tin correctness do client tính.
export const POST = withAuth(async ({ supabase, req }) => {
  const body = await readJsonBody(req);
  const wordId = body.word_id;
  if (typeof wordId !== "string" || !wordId) {
    throw new BadRequestError("word_id là bắt buộc.");
  }

  if (body.mode === "quiz") {
    if (typeof body.picked !== "string") {
      throw new BadRequestError("picked là bắt buộc cho mode quiz.");
    }
    return NextResponse.json(await gradeVocabQuizAnswer(supabase, wordId, body.picked));
  }

  if (body.mode === "flashcard") {
    if (typeof body.know !== "boolean") {
      throw new BadRequestError("know là bắt buộc cho mode flashcard.");
    }
    const progress = await updateVocabProgress(supabase, wordId, body.know);
    return NextResponse.json({ progress });
  }

  throw new BadRequestError("mode không hợp lệ.");
});
