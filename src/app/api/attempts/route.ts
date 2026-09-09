import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordAttempt, RecordAttemptError } from "@/lib/queries/attempts";

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
    const attempt = await recordAttempt(supabase, body);
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (err) {
    if (err instanceof RecordAttemptError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 500 }
    );
  }
}
