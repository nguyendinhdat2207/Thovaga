import { NextResponse } from "next/server";

// Vercel Cron gọi route này theo lịch trong vercel.json để Supabase (free tier)
// luôn có hoạt động và không bị tạm dừng vì không dùng.
//
// KHÔNG dùng withAuth: cron không có phiên đăng nhập. Thay vào đó Vercel tự gửi
// "Authorization: Bearer $CRON_SECRET" — thiếu/sai secret thì từ chối, và nếu
// chưa cấu hình CRON_SECRET thì đóng luôn (không để route mở cho mọi người).
// Route phải nằm trong danh sách công khai của proxy (lib/supabase/middleware.ts).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Không được phép." }, { status: 401 });
  }

  // Một truy vấn rất nhẹ qua REST bằng anon key. RLS khoá theo chủ sở hữu nên
  // kết quả là mảng rỗng — vẫn là một câu SELECT thật chạy trên Postgres.
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subjects?select=id&limit=1`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error("[cron] keepalive Supabase lỗi:", res.status);
    return NextResponse.json({ ok: false, status: res.status }, { status: 502 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
