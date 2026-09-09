import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

// Dùng trong Server Components, Server Actions và Route Handlers.
// Request đi kèm cookie session của người dùng đã đăng nhập nên các câu
// query tự động chạy dưới RLS policy "authenticated" đã định nghĩa ở migration.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll được gọi từ một Server Component (không thể set cookie ở đó).
            // Middleware đã lo việc refresh session nên bỏ qua lỗi này là an toàn.
          }
        },
      },
    }
  );
}
