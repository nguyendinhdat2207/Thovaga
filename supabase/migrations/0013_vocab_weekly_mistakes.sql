-- "Kho từ sai trong tuần" — mỗi lần làm quiz từ vựng mà chọn sai, từ đó được
-- ghi vào một sổ riêng theo tuần (thứ Hai → Chủ nhật, giờ Việt Nam). Cuối tuần
-- có thể mở lại đúng những từ đã sai để ôn — làm đúng thì coi như đã ôn xong,
-- sai nữa thì vẫn nằm trong sổ.
--
-- Chỉ áp dụng cho QUIZ từ vựng (không tính "Chưa nhớ" ở flashcard — đó là tự
-- đánh giá, không có đáp án đúng để verify, không nên tính là "làm sai").
--
-- Thiết kế: 1 dòng cho mỗi (word_id, tuần). Sai thì tăng wrong_count và đặt
-- resolved = false; đúng thì đặt resolved = true nếu dòng đã tồn tại (không tự
-- tạo dòng mới khi làm đúng — dòng chỉ sinh ra từ lần SAI đầu tiên trong tuần).
-- "Từ sai tuần này" = các dòng resolved = false của tuần hiện tại.

-- Thứ Hai của tuần chứa ngày d (mặc định hôm nay, giờ Việt Nam).
-- date_trunc('week', ...) của Postgres lấy mốc theo ISO 8601 (tuần bắt đầu từ
-- thứ Hai), đúng ý "1 tuần" theo cách người Việt vẫn tính.
create or replace function current_week_start() returns date
language sql
stable
as $$
  select date_trunc('week', app_today())::date;
$$;

create table if not exists vocab_weekly_mistakes (
  word_id uuid not null references vocab_words(id) on delete cascade,
  week_start date not null,
  wrong_count int not null default 0,
  resolved boolean not null default false,
  first_wrong_at timestamptz not null default now(),
  last_wrong_at timestamptz not null default now(),
  primary key (word_id, week_start)
);

create index if not exists vocab_weekly_mistakes_week_idx on vocab_weekly_mistakes(week_start);

alter table vocab_weekly_mistakes enable row level security;
create policy "owner all vocab_weekly_mistakes" on vocab_weekly_mistakes
  for all using (is_app_owner()) with check (is_app_owner());

-- Áp cùng cơ chế khoá chống xoá hàng loạt đã dùng cho các bảng từ vựng khác
-- (protect_vocab_table(), migration 0012) — dữ liệu tuần vẫn đáng giữ, không
-- có lý do gì để bảng này bị xoá nhầm nhiều hơn các bảng kia.
drop trigger if exists protect_delete on vocab_weekly_mistakes;
create trigger protect_delete after delete on vocab_weekly_mistakes
  referencing old table as old_rows
  for each statement execute function protect_vocab_table();

drop trigger if exists protect_truncate on vocab_weekly_mistakes;
create trigger protect_truncate before truncate on vocab_weekly_mistakes
  for each statement execute function protect_vocab_table();

-- Gọi mỗi khi chấm 1 câu quiz từ vựng (xem gradeVocabQuizAnswer trong
-- src/lib/queries/vocab.ts). Sai: upsert tăng đếm, đánh dấu chưa xử lý.
-- Đúng: nếu tuần này từng sai từ đó thì đánh dấu đã xử lý xong (không tạo mới
-- dòng khi làm đúng — không có gì để "đánh dấu xong" nếu chưa từng sai).
create or replace function record_weekly_mistake(p_word_id uuid, p_correct boolean) returns void
language plpgsql
security invoker
as $$
declare
  v_week date := current_week_start();
begin
  if p_correct then
    update vocab_weekly_mistakes
    set resolved = true
    where word_id = p_word_id and week_start = v_week and resolved = false;
  else
    insert into vocab_weekly_mistakes (word_id, week_start, wrong_count, resolved, first_wrong_at, last_wrong_at)
    values (p_word_id, v_week, 1, false, now(), now())
    on conflict (word_id, week_start) do update set
      wrong_count = vocab_weekly_mistakes.wrong_count + 1,
      resolved = false,
      last_wrong_at = now();
  end if;
end;
$$;

-- Số từ sai chưa ôn lại trong tuần hiện tại — dùng để hiện badge ở trang /vocab
-- mà không phải tải cả danh sách.
create or replace function vocab_weekly_mistakes_count() returns bigint
language sql
stable
security invoker
as $$
  select count(*) from vocab_weekly_mistakes
  where week_start = current_week_start() and resolved = false;
$$;

-- Danh sách đầy đủ để dựng phiên quiz ôn lại — sắp xếp từ sai nhiều lần nhất
-- lên đầu (đúng từ cần chú ý nhất trước).
create or replace function vocab_weekly_mistakes_list() returns table (
  word_id uuid,
  en text,
  vi text,
  example text,
  distractors jsonb,
  wrong_count int,
  last_wrong_at timestamptz
)
language sql
stable
security invoker
as $$
  select w.id, w.en, w.vi, w.example, w.distractors, m.wrong_count, m.last_wrong_at
  from vocab_weekly_mistakes m
  join vocab_words w on w.id = m.word_id
  where m.week_start = current_week_start() and m.resolved = false
  order by m.wrong_count desc, m.last_wrong_at desc;
$$;

-- Dọn dữ liệu quá 8 tuần cho gọn — mỗi tuần tối đa vài nghìn dòng (bằng số từ
-- trong kho) nên không gấp, nhưng dọn định kỳ vẫn tốt hơn để phình vô hạn.
-- DELETE ở đây chắc chắn vượt ngưỡng 20 dòng của protect_vocab_table() nên
-- phải tự xác nhận override trong cùng lệnh.
select cron.schedule(
  'prune-vocab-mistakes-weekly',
  '30 19 * * 1',
  $$set local app.allow_destructive_vocab_ops = 'yes'; delete from vocab_weekly_mistakes where week_start < current_week_start() - interval '56 days';$$
)
where not exists (select 1 from cron.job where jobname = 'prune-vocab-mistakes-weekly');
