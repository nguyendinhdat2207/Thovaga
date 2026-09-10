import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/login/PasswordField";
import { signIn, type LoginErrorCode } from "./actions";

const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  invalid_credentials: "Sai tên đăng nhập hoặc mật khẩu.",
  rate_limited: "Bạn thử quá nhiều lần. Đợi một lát rồi đăng nhập lại nhé.",
  unknown: "Không đăng nhập được. Thử lại sau ít phút nhé.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  // Chỉ hiển thị thông báo ứng với mã lỗi đã biết — chuỗi lạ trên URL bị bỏ qua.
  const errorMessage = error
    ? (LOGIN_ERROR_MESSAGES[error as LoginErrorCode] ?? LOGIN_ERROR_MESSAGES.unknown)
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5">
      <div className="w-full max-w-[380px] text-center">
        <Mascot size={96} className="mx-auto" priority />
        <h1 className="mt-4 font-display font-extrabold text-[28px] tracking-tight text-ink">
          Thỏ &amp; Gà
        </h1>
        <p className="mt-1 font-bold text-sm text-ink-muted">Đăng nhập để tiếp tục học</p>

        <form action={signIn} className="mt-8 flex flex-col gap-3 text-left">
          <input type="hidden" name="next" value={next ?? "/"} />
          <div>
            <label className="font-bold text-xs text-ink-muted mb-1.5 block">Tên đăng nhập</label>
            <input
              type="text"
              name="email"
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              className="w-full border border-border rounded-xl px-3.5 py-3 font-bold text-[15px] text-ink outline-none focus:border-yellow"
            />
          </div>
          <PasswordField />

          {errorMessage && (
            <p className="text-sm font-bold text-orange bg-orange-pale border border-orange rounded-xl px-3 py-2">
              {errorMessage}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full">
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
}
