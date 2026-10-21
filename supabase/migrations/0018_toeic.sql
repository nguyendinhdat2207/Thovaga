-- Module TOEIC theo bộ sách Zenlish: lý thuyết học trong app, đề làm trên
-- zenlishtoeic.vn (bài miễn phí) rồi quay lại tự nhập điểm.
--
-- Tách 2 lớp giống roadmap (0015):
--   - Nội dung tĩnh, chỉ đọc: toeic_books → toeic_lessons (lý thuyết markdown)
--     → toeic_quizzes (slug đề Zenlish). Seed ở 0019 từ supabase/seed/toeic/content.json.
--   - Dữ liệu theo người dùng: toeic_lesson_progress (đã học xong lý thuyết),
--     toeic_quiz_results (mỗi lần làm 1 đề = 1 dòng, không gộp).
-- Zenlish không có API nên điểm là người dùng TỰ NHẬP — chỉ kiểm tra được hợp lệ
-- (0 ≤ đúng ≤ tổng ≤ 200), không xác minh được với Zenlish.
--
-- Kèm vocab_inbox: "Sổ ghi nhanh" — ghi vội từ lạ khi đang làm đề (chưa cần
-- nghĩa), cuối tuần copy cả sổ sang Claude chuẩn hoá rồi nhập lại thành bộ từ
-- qua /vocab/import. Tách hẳn khỏi vocab_words để không lẫn vào Leitner.

create table if not exists toeic_books (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  title text not null,
  skill text not null check (skill in ('listening', 'reading')),
  level text not null,
  sort_order int not null,
  target text not null,
  description text not null
);

create table if not exists toeic_lessons (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  book_id text not null references toeic_books(id) on delete cascade,
  lesson_no int not null check (lesson_no between 1 and 99),
  title text not null,
  part smallint check (part between 1 and 7),
  kind text not null check (kind in ('theory', 'practice')),
  theory_md text,
  checkpoint text,
  unique (book_id, lesson_no)
);

create table if not exists toeic_quizzes (
  slug text primary key check (slug ~ '^[a-z0-9_-]{2,120}$'),
  lesson_id text not null references toeic_lessons(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('lesson', 'homework')),
  part smallint check (part between 1 and 7),
  question_count int check (question_count between 1 and 200),
  sort_order int not null
);

create index if not exists toeic_quizzes_lesson_idx on toeic_quizzes(lesson_id);

create table if not exists toeic_lesson_progress (
  user_id uuid not null default auth.uid(),
  lesson_id text not null references toeic_lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists toeic_quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  quiz_slug text not null references toeic_quizzes(slug) on delete cascade,
  correct int not null,
  total int not null,
  mistake_type text check (mistake_type in ('listening', 'vocabulary', 'grammar', 'trap', 'misread', 'time')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  check (total between 1 and 200),
  check (correct between 0 and total)
);

create index if not exists toeic_quiz_results_user_quiz_idx
  on toeic_quiz_results(user_id, quiz_slug, created_at desc);

create table if not exists vocab_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  raw_text text not null check (char_length(btrim(raw_text)) between 1 and 300),
  context text check (char_length(context) <= 500),
  source text check (char_length(source) <= 80),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists vocab_inbox_pending_idx
  on vocab_inbox(user_id, created_at) where processed_at is null;

-- ---------- RLS ----------
alter table toeic_books enable row level security;
alter table toeic_lessons enable row level security;
alter table toeic_quizzes enable row level security;
alter table toeic_lesson_progress enable row level security;
alter table toeic_quiz_results enable row level security;
alter table vocab_inbox enable row level security;

-- Nội dung tĩnh: chỉ đọc (giống roadmap_days) — sửa nội dung = migration mới.
drop policy if exists "owner read toeic_books" on toeic_books;
create policy "owner read toeic_books" on toeic_books for select using (is_app_owner());
drop policy if exists "owner read toeic_lessons" on toeic_lessons;
create policy "owner read toeic_lessons" on toeic_lessons for select using (is_app_owner());
drop policy if exists "owner read toeic_quizzes" on toeic_quizzes;
create policy "owner read toeic_quizzes" on toeic_quizzes for select using (is_app_owner());

-- Dữ liệu cá nhân: cả user_id = auth.uid() lẫn is_app_owner() (như roadmap_progress).
drop policy if exists "own toeic_lesson_progress" on toeic_lesson_progress;
create policy "own toeic_lesson_progress" on toeic_lesson_progress for all
  using (user_id = auth.uid() and is_app_owner())
  with check (user_id = auth.uid() and is_app_owner());
drop policy if exists "own toeic_quiz_results" on toeic_quiz_results;
create policy "own toeic_quiz_results" on toeic_quiz_results for all
  using (user_id = auth.uid() and is_app_owner())
  with check (user_id = auth.uid() and is_app_owner());
drop policy if exists "own vocab_inbox" on vocab_inbox;
create policy "own vocab_inbox" on vocab_inbox for all
  using (user_id = auth.uid() and is_app_owner())
  with check (user_id = auth.uid() and is_app_owner());

-- Nội dung soạn tay + kết quả làm bài + sổ từ: chặn TRUNCATE / xoá hàng loạt
-- như dữ liệu từ vựng (0012) và attempts (0017).
do $$
declare
  t text;
begin
  foreach t in array array['toeic_lessons', 'toeic_quizzes', 'toeic_quiz_results', 'vocab_inbox'] loop
    execute format('drop trigger if exists protect_delete on %I', t);
    execute format(
      'create trigger protect_delete after delete on %I '
      'referencing old table as old_rows '
      'for each statement execute function protect_vocab_table()',
      t
    );
    execute format('drop trigger if exists protect_truncate on %I', t);
    execute format(
      'create trigger protect_truncate before truncate on %I '
      'for each statement execute function protect_vocab_table()',
      t
    );
  end loop;
end $$;

-- Thống kê theo đề (số lượt, lần gần nhất, tốt nhất) tính ở Postgres — không
-- tải cả lịch sử về JS (SPEC 5.3). security invoker → RLS vẫn lọc theo user.
create or replace function toeic_quiz_stats(p_lesson_ids text[] default null)
returns table (
  quiz_slug text,
  lesson_id text,
  attempts bigint,
  last_correct int,
  last_total int,
  last_at timestamptz,
  best_ratio numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    r.quiz_slug,
    q.lesson_id,
    count(*) as attempts,
    (array_agg(r.correct order by r.created_at desc))[1] as last_correct,
    (array_agg(r.total order by r.created_at desc))[1] as last_total,
    max(r.created_at) as last_at,
    max(round(r.correct::numeric / r.total, 4)) as best_ratio
  from toeic_quiz_results r
  join toeic_quizzes q on q.slug = r.quiz_slug
  where r.user_id = auth.uid()
    and (p_lesson_ids is null or q.lesson_id = any(p_lesson_ids))
  group by r.quiz_slug, q.lesson_id;
$$;
