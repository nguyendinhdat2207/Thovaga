-- Ghi lại thời lượng mỗi phiên học từ vựng (flashcard hoặc quiz), để cộng vào
-- "tổng thời gian học" ở header/lịch sử — trước đây chỉ tính bộ đề trắc nghiệm.
create table if not exists vocab_sessions (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('flashcard', 'quiz')),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_seconds int not null,
  word_count int not null,
  correct_count int not null,
  created_at timestamptz not null default now()
);

create index if not exists vocab_sessions_created_at_idx on vocab_sessions(created_at);

alter table vocab_sessions enable row level security;

create policy "authenticated read vocab_sessions" on vocab_sessions for select using (auth.role() = 'authenticated');
create policy "authenticated write vocab_sessions" on vocab_sessions for insert with check (auth.role() = 'authenticated');
create policy "authenticated update vocab_sessions" on vocab_sessions for update using (auth.role() = 'authenticated');
create policy "authenticated delete vocab_sessions" on vocab_sessions for delete using (auth.role() = 'authenticated');
