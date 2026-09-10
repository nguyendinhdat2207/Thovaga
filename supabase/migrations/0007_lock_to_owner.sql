-- Khoá dữ liệu về đúng (các) tài khoản chủ sở hữu.
--
-- Vấn đề của 0001/0003/0005: mọi policy dùng `auth.role() = 'authenticated'`,
-- tức là BẤT KỲ tài khoản nào đăng nhập được vào project Supabase này đều
-- đọc/sửa/xoá được toàn bộ dữ liệu. Vì đăng ký (signup) mặc định đang mở, một
-- người lạ chỉ cần tự tạo tài khoản là chiếm được toàn bộ bộ đề, từ vựng và
-- lịch sử học.
--
-- Cách khắc phục giữ nguyên mô hình "app 1 người dùng" (không phải thêm cột
-- user_id vào mọi bảng): một bảng app_owners liệt kê các uid được phép, và mọi
-- policy hỏi qua hàm is_app_owner(). Muốn thêm người dùng sau này thì insert
-- thêm 1 dòng, không phải sửa policy.

create table if not exists app_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Ghi nhận (các) tài khoản đang tồn tại làm chủ sở hữu. Với app hiện tại chỉ có
-- đúng 1 tài khoản; nếu về sau có thêm, phải insert thủ công — mặc định là
-- KHÔNG có quyền, đúng tinh thần fail-closed.
insert into app_owners (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table app_owners enable row level security;
-- Không có policy nào cho app_owners => không client nào đọc/ghi được bảng này
-- qua API; chỉ sửa được từ SQL editor / psql với quyền admin.

-- security definer để hàm đọc được app_owners bất chấp RLS ở trên, tránh đệ quy.
create or replace function is_app_owner() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from app_owners o where o.user_id = auth.uid());
$$;

-- Thay toàn bộ policy cũ. Dùng vòng lặp để không phải liệt kê tay 32 policy.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'subjects', 'decks', 'questions', 'attempts', 'attempt_answers',
    'vocab_decks', 'vocab_words', 'vocab_progress', 'vocab_sessions'
  ] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy "owner all %1$s" on public.%1$I for all using (is_app_owner()) with check (is_app_owner())',
      t
    );
  end loop;
end $$;

-- Storage: bucket "documents" cũng khoá theo chủ sở hữu.
drop policy if exists "authenticated read documents" on storage.objects;
drop policy if exists "authenticated upload documents" on storage.objects;
drop policy if exists "authenticated delete documents" on storage.objects;

create policy "owner read documents" on storage.objects for select
  using (bucket_id = 'documents' and is_app_owner());
create policy "owner upload documents" on storage.objects for insert
  with check (bucket_id = 'documents' and is_app_owner());
create policy "owner delete documents" on storage.objects for delete
  using (bucket_id = 'documents' and is_app_owner());
