-- Tài khoản thành viên: người thứ hai học chung nội dung nhưng tiến độ riêng.
--
-- Trước đây mọi bảng (trừ roadmap/TOEIC) dùng chung 1 bộ dữ liệu cho tất cả
-- app_owners — thêm người thứ hai thì người đó thấy/sửa/xoá được bộ đề, kho từ,
-- lịch sử và kho từ sai của chủ app, và lịch ôn Leitner của hai người trộn vào
-- nhau. Tách thành 2 lớp:
--   - Nội dung (subjects, decks, questions, vocab_decks, vocab_words, file
--     "documents"): mọi thành viên ĐỌC được, chỉ admin (is_admin = true) được
--     thêm/sửa/xoá.
--   - Tiến độ (attempts, attempt_answers, vocab_progress, vocab_sessions,
--     vocab_mistake_entries): thêm cột user_id, mỗi người chỉ thấy dòng của
--     mình — giống roadmap_progress (0015) và toeic_* (0018).
--
-- Các hàm security invoker (vocab_deck_stats, vocab_words_with_progress,
-- study_total_seconds, attempt_summary...) KHÔNG cần sửa: RLS lọc sẵn bảng
-- tiến độ theo auth.uid() trước khi join/cộng, nên tự ra số của đúng người gọi.
-- Chỉ sửa 2 hàm phụ thuộc khoá cũ: apply_vocab_progress (on conflict) và
-- record_mistake_entry (advisory lock).
--
-- Thêm thành viên sau khi chạy migration này: tạo user ở Authentication > Users
-- rồi `insert into app_owners (user_id) values ('<uuid>');` — is_admin mặc định
-- false nên người mới chỉ học, không sửa được nội dung.

begin;

-- ============================================================
-- Vai trò: admin = chủ app (người đang có trong app_owners lúc chạy migration).
-- ============================================================
alter table app_owners add column if not exists is_admin boolean not null default false;

-- Dữ liệu tiến độ hiện có sẽ được gán hết cho người này, nên phải chắc chắn chỉ
-- có đúng 1 người — nếu đã lỡ insert thêm thành viên trước đó, gán nhầm là trộn
-- vĩnh viễn, thà dừng lại.
do $$
begin
  if (select count(*) from app_owners) <> 1 then
    raise exception
      'app_owners đang có % dòng, cần đúng 1 (chủ app) để gán dữ liệu cũ. '
      'Xoá tạm các thành viên khác rồi chạy lại, sau đó insert lại họ.',
      (select count(*) from app_owners);
  end if;
end $$;

update app_owners set is_admin = true;

create or replace function is_app_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from app_owners o where o.user_id = auth.uid() and o.is_admin);
$$;

-- ============================================================
-- Nội dung: thành viên đọc, admin ghi.
-- ============================================================
do $$
declare
  t text;
  p record;
begin
  foreach t in array array['subjects', 'decks', 'questions', 'vocab_decks', 'vocab_words'] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy "member read %1$s" on public.%1$I for select using (is_app_owner())',
      t
    );
    execute format(
      'create policy "admin all %1$s" on public.%1$I for all using (is_app_admin()) with check (is_app_admin())',
      t
    );
  end loop;
end $$;

drop policy if exists "owner read documents" on storage.objects;
drop policy if exists "owner upload documents" on storage.objects;
drop policy if exists "owner delete documents" on storage.objects;

create policy "member read documents" on storage.objects for select
  using (bucket_id = 'documents' and is_app_owner());
create policy "admin upload documents" on storage.objects for insert
  with check (bucket_id = 'documents' and is_app_admin());
create policy "admin delete documents" on storage.objects for delete
  using (bucket_id = 'documents' and is_app_admin());

-- ============================================================
-- Tiến độ: thêm user_id, gán dữ liệu cũ cho chủ app, RLS theo người.
-- ============================================================
do $$
declare
  t text;
  p record;
  v_owner uuid := (select user_id from app_owners);
begin
  foreach t in array array[
    'attempts', 'attempt_answers', 'vocab_progress', 'vocab_sessions', 'vocab_mistake_entries'
  ] loop
    execute format('alter table public.%I add column if not exists user_id uuid', t);
    execute format('update public.%I set user_id = $1 where user_id is null', t) using v_owner;
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
    execute format('alter table public.%I alter column user_id set not null', t);

    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy "own %1$s" on public.%1$I for all '
      'using (user_id = auth.uid() and is_app_owner()) '
      'with check (user_id = auth.uid() and is_app_owner())',
      t
    );
  end loop;
end $$;

-- Mỗi người một tiến trình Leitner cho cùng 1 từ.
alter table vocab_progress drop constraint vocab_progress_pkey;
alter table vocab_progress add primary key (user_id, word_id);

drop index if exists vocab_progress_next_review_idx;
create index if not exists vocab_progress_user_next_review_idx
  on vocab_progress(user_id, next_review);
create index if not exists attempts_user_created_at_idx on attempts(user_id, created_at);
create index if not exists vocab_sessions_user_created_at_idx
  on vocab_sessions(user_id, created_at desc);
drop index if exists vocab_mistake_entries_pack_idx;
create index if not exists vocab_mistake_entries_user_pack_idx
  on vocab_mistake_entries(user_id, pack_number);

-- Giữ nguyên quy tắc Leitner của 0009, chỉ đổi khoá conflict sang (user_id,
-- word_id); user_id lấy default auth.uid().
create or replace function apply_vocab_progress(p_word_id uuid, p_correct boolean)
returns vocab_progress
language plpgsql
security invoker
as $$
declare
  v_row vocab_progress;
begin
  insert into vocab_progress (word_id, box, correct, wrong, next_review, updated_at)
  values (
    p_word_id,
    1,
    case when p_correct then 1 else 0 end,
    case when p_correct then 0 else 1 end,
    app_today() + 1,
    now()
  )
  on conflict (user_id, word_id) do update set
    box = case
      when p_correct then least(vocab_progress.box + 1, 5)
      else 1
    end,
    correct = vocab_progress.correct + (case when p_correct then 1 else 0 end),
    wrong = vocab_progress.wrong + (case when p_correct then 0 else 1 end),
    next_review = app_today() + (
      case
        when p_correct then
          case least(vocab_progress.box + 1, 5)
            when 1 then 1 when 2 then 2 when 3 then 4 when 4 then 7 when 5 then 15
            else 1
          end
        else 1
      end
    ),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- Như 0016, nhưng khoá theo từng người: gói của mỗi người đánh số riêng (RLS
-- lọc max(pack_number) theo auth.uid()), nên hai người không cần chờ nhau.
create or replace function record_mistake_entry(p_word_id uuid) returns int
language plpgsql
security invoker
as $$
declare
  v_pack int;
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext('vocab_mistake_entries:' || auth.uid()::text));

  select pack_number, count(*) into v_pack, v_count
  from vocab_mistake_entries
  where pack_number = (select coalesce(max(pack_number), 0) from vocab_mistake_entries)
  group by pack_number;

  if v_pack is null then
    v_pack := 1;
  elsif v_count >= 50 then
    v_pack := v_pack + 1;
  end if;

  insert into vocab_mistake_entries (word_id, pack_number) values (p_word_id, v_pack);
  return v_pack;
end;
$$;

commit;
