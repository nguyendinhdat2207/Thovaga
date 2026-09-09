-- Thỏ & Gà — schema khởi tạo
-- Ứng dụng cá nhân, một người dùng duy nhất (tài khoản tạo qua Supabase dashboard).
-- RLS: bất kỳ request nào có auth.uid() (đã đăng nhập) mới được đọc/ghi.
-- Không cần cột user_id vì chỉ có một người dùng cho toàn bộ dữ liệu.

create extension if not exists "pgcrypto";

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('school', 'data_ai', 'toeic')),
  created_at timestamptz not null default now()
);

create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  title text not null,
  source_file_url text,
  created_at timestamptz not null default now()
);

create index if not exists decks_subject_id_idx on decks(subject_id);

-- MVP hỗ trợ câu hỏi trắc nghiệm 4 đáp án (options[correct_option] là đáp án đúng).
-- TODO(v2): thêm cột `kind` (mcq | flashcard | reading) + bảng riêng cho flashcard
-- (front/back) và đoạn văn đọc hiểu (passage dùng chung cho nhiều câu) khi cần —
-- xem ghi chú trong README, phần "Chưa làm ở bước này".
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_option int not null,
  explanation text
);

create index if not exists questions_deck_id_idx on questions(deck_id);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_seconds int not null,
  score numeric(4, 1) not null,
  total_questions int not null,
  created_at timestamptz not null default now()
);

create index if not exists attempts_deck_id_idx on attempts(deck_id);
create index if not exists attempts_created_at_idx on attempts(created_at);

create table if not exists attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_option int,
  is_correct boolean not null
);

create index if not exists attempt_answers_attempt_id_idx on attempt_answers(attempt_id);

-- Row Level Security: chỉ người dùng đã đăng nhập (bất kỳ ai xác thực được,
-- vì app chỉ có một tài khoản) mới đọc/ghi được.
alter table subjects enable row level security;
alter table decks enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table attempt_answers enable row level security;

create policy "authenticated read subjects" on subjects for select using (auth.role() = 'authenticated');
create policy "authenticated write subjects" on subjects for insert with check (auth.role() = 'authenticated');
create policy "authenticated update subjects" on subjects for update using (auth.role() = 'authenticated');
create policy "authenticated delete subjects" on subjects for delete using (auth.role() = 'authenticated');

create policy "authenticated read decks" on decks for select using (auth.role() = 'authenticated');
create policy "authenticated write decks" on decks for insert with check (auth.role() = 'authenticated');
create policy "authenticated update decks" on decks for update using (auth.role() = 'authenticated');
create policy "authenticated delete decks" on decks for delete using (auth.role() = 'authenticated');

create policy "authenticated read questions" on questions for select using (auth.role() = 'authenticated');
create policy "authenticated write questions" on questions for insert with check (auth.role() = 'authenticated');
create policy "authenticated update questions" on questions for update using (auth.role() = 'authenticated');
create policy "authenticated delete questions" on questions for delete using (auth.role() = 'authenticated');

create policy "authenticated read attempts" on attempts for select using (auth.role() = 'authenticated');
create policy "authenticated write attempts" on attempts for insert with check (auth.role() = 'authenticated');
create policy "authenticated update attempts" on attempts for update using (auth.role() = 'authenticated');
create policy "authenticated delete attempts" on attempts for delete using (auth.role() = 'authenticated');

create policy "authenticated read attempt_answers" on attempt_answers for select using (auth.role() = 'authenticated');
create policy "authenticated write attempt_answers" on attempt_answers for insert with check (auth.role() = 'authenticated');
create policy "authenticated update attempt_answers" on attempt_answers for update using (auth.role() = 'authenticated');
create policy "authenticated delete attempt_answers" on attempt_answers for delete using (auth.role() = 'authenticated');

-- Storage: bucket riêng cho file đề/tài liệu gốc (PDF/DOCX/ảnh) upload lên.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "authenticated read documents" on storage.objects for select
  using (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "authenticated upload documents" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "authenticated delete documents" on storage.objects for delete
  using (bucket_id = 'documents' and auth.role() = 'authenticated');
