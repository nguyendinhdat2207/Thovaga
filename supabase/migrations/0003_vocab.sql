-- Thỏ & Gà — mục Từ vựng (flashcard + quiz + kho từ), tách riêng khỏi mô hình
-- trắc nghiệm subjects/decks/questions vì cấu trúc dữ liệu khác hẳn.
-- Vẫn app 1 người dùng, RLS pattern giống 0001_init.sql.

create table if not exists vocab_decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists vocab_words (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references vocab_decks(id) on delete cascade,
  en text not null,
  vi text not null,
  example text
);

create index if not exists vocab_words_deck_id_idx on vocab_words(deck_id);

-- Tiến trình ôn tập kiểu Leitner: box 0-5, next_review tính theo box
-- (0,1,2,4,7,15 ngày) — logic ở src/lib/queries/vocab.ts.
create table if not exists vocab_progress (
  word_id uuid primary key references vocab_words(id) on delete cascade,
  box int not null default 0,
  correct int not null default 0,
  wrong int not null default 0,
  next_review date not null default current_date,
  updated_at timestamptz not null default now()
);

alter table vocab_decks enable row level security;
alter table vocab_words enable row level security;
alter table vocab_progress enable row level security;

create policy "authenticated read vocab_decks" on vocab_decks for select using (auth.role() = 'authenticated');
create policy "authenticated write vocab_decks" on vocab_decks for insert with check (auth.role() = 'authenticated');
create policy "authenticated update vocab_decks" on vocab_decks for update using (auth.role() = 'authenticated');
create policy "authenticated delete vocab_decks" on vocab_decks for delete using (auth.role() = 'authenticated');

create policy "authenticated read vocab_words" on vocab_words for select using (auth.role() = 'authenticated');
create policy "authenticated write vocab_words" on vocab_words for insert with check (auth.role() = 'authenticated');
create policy "authenticated update vocab_words" on vocab_words for update using (auth.role() = 'authenticated');
create policy "authenticated delete vocab_words" on vocab_words for delete using (auth.role() = 'authenticated');

create policy "authenticated read vocab_progress" on vocab_progress for select using (auth.role() = 'authenticated');
create policy "authenticated write vocab_progress" on vocab_progress for insert with check (auth.role() = 'authenticated');
create policy "authenticated update vocab_progress" on vocab_progress for update using (auth.role() = 'authenticated');
create policy "authenticated delete vocab_progress" on vocab_progress for delete using (auth.role() = 'authenticated');
