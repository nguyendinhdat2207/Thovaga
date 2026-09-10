import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/lib/database.types";

// Dùng trong Server Components, Server Actions và Route Handlers.
// Request đi kèm cookie session của người dùng đã đăng nhập nên các câu
// query tự động chạy dưới RLS policy của chủ sở hữu (xem migration 0007).
//
// Bọc cache() của React: trong cùng một request, layout và page đều gọi
// createClient() — không bọc thì mỗi nơi dựng một client riêng, và các hàm
// query bọc cache() bên dưới sẽ coi đó là hai đối số khác nhau nên không khử
// được truy vấn trùng. cache() chỉ có phạm vi một request, không giữ dữ liệu
// sang request sau nên không có chuyện hiển thị số liệu cũ.
export const createClient = cache(async function createClient() {
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
});
