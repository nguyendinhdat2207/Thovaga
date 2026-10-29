import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

// Admin = chủ app, được thêm/sửa bộ đề và bộ từ. Thành viên (app_owners.is_admin
// = false) chỉ học trên nội dung đó, tiến độ tách riêng — xem
// 0021_member_accounts.sql. RLS mới là lớp chặn thật; hàm này chỉ để ẩn nút
// và trả 403 rõ ràng thay vì để insert lỗi RLS thành 500.
export async function isAppAdmin(supabase: Client): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_app_admin");
  if (error) throw error;
  return data === true;
}
