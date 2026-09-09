import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

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
              className="w-full border border-border rounded-xl px-3.5 py-3 font-bold text-[15px] text-ink outline-none focus:border-yellow"
            />
          </div>
          <div>
            <label className="font-bold text-xs text-ink-muted mb-1.5 block">Mật khẩu</label>
            <input
              type="password"
              name="password"
              required
              className="w-full border border-border rounded-xl px-3.5 py-3 font-bold text-[15px] text-ink outline-none focus:border-yellow"
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-orange bg-orange-pale border border-orange rounded-xl px-3 py-2">
              {error}
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
