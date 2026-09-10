"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Mã lỗi đăng nhập hiển thị cho người dùng.
 *
 * Không đẩy `error.message` thô của Supabase vào URL rồi render: nó là tiếng
 * Anh, lộ chi tiết nội bộ ("Email not confirmed", thông tin rate-limit), và
 * biến thanh địa chỉ thành chỗ nhồi text tuỳ ý vào giao diện. Ở đây chỉ đi qua
 * một tập mã cố định, phía trang login tự dịch sang tiếng Việt.
 */
export type LoginErrorCode = "invalid_credentials" | "rate_limited" | "unknown";

function toErrorCode(message: string): LoginErrorCode {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "invalid_credentials";
  if (m.includes("rate limit") || m.includes("too many")) return "rate_limited";
  return "unknown";
}

/**
 * Chỉ cho phép quay lại đường dẫn nội bộ.
 *
 * `next` đến từ query string nên có thể là "https://trang-lua-dao.com" —
 * redirect thẳng sẽ đưa người dùng ra ngoài ngay sau khi đăng nhập, đúng kiểu
 * open redirect thường bị lợi dụng để lừa đảo. "//evil.com" cũng là URL tuyệt
 * đối nên phải loại luôn.
 */
function safeNextPath(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login] đăng nhập thất bại:", error.message);
    const code = toErrorCode(error.message);
    redirect(`/login?error=${code}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
