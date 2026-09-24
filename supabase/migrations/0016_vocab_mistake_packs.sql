-- Thay hẳn cơ chế "Từ sai tuần này" (migration 0013) bằng "Kho từ sai theo
-- gói" — vì cách cũ có 2 điểm không đúng ý người dùng:
--   1. Reset theo tuần: từ sai tuần trước bị quên dù chưa ôn lại.
--   2. Gộp trùng theo (word_id, tuần): sai "run" 3 lần trong tuần chỉ tính 1
--      dòng — người dùng muốn MỖI LẦN sai đều được ghi thêm, kể cả trùng từ.
--
-- Cơ chế mới: mỗi lần chọn sai ở quiz từ vựng → thêm 1 dòng vào
-- vocab_mistake_entries (không gộp, không giới hạn thời gian). Các dòng được
-- xếp tuần tự vào "gói" đúng 50 dòng/gói — gói hiện tại đầy 50 mới mở gói kế
-- tiếp. Một gói CHỈ bị xoá khi làm đúng 100% toàn bộ gói đó trong 1 lượt ôn
-- (kể cả các dòng trùng từ) — không có cách xoá tay.

drop trigger if exists protect_delete on vocab_weekly_mistakes;
drop trigger if exists protect_truncate on vocab_weekly_mistakes;
drop function if exists record_weekly_mistake(uuid, boolean);
drop function if exists vocab_weekly_mistakes_count();
drop function if exists vocab_weekly_mistakes_list();
drop table if exists vocab_weekly_mistakes;
drop function if exists current_week_start();
select cron.unschedule('prune-vocab-mistakes-weekly')
where exists (select 1 from cron.job where jobname = 'prune-vocab-mistakes-weekly');

create table vocab_mistake_entries (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references vocab_words(id) on delete cascade,
  pack_number int not null,
  created_at timestamptz not null default now()
);

create index vocab_mistake_entries_pack_idx on vocab_mistake_entries(pack_number);

alter table vocab_mistake_entries enable row level security;
create policy "owner all vocab_mistake_entries" on vocab_mistake_entries
  for all using (is_app_owner()) with check (is_app_owner());

-- KHÔNG áp protect_vocab_table() ở bảng này — khác vocab_decks/vocab_words
-- (nội dung công sức nhập tay, mất là mất thật), xoá hàng loạt ở đây là hành
-- vi BÌNH THƯỜNG và mong muốn: xoá cả 1 gói (tới 50 dòng) khi làm đúng hết.
-- Khoá xoá hàng loạt ở đây chỉ cản trở tính năng, không thêm an toàn.

-- Ghi 1 lượt chọn sai — luôn thêm dòng mới (không upsert/gộp). Advisory lock
-- tránh race khi xác định "gói hiện tại" lúc 2 request ghi gần như đồng thời
-- (hiếm với 1 người dùng, nhưng rẻ để làm cho đúng).
create or replace function record_mistake_entry(p_word_id uuid) returns int
language plpgsql
security invoker
as $$
declare
  v_pack int;
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext('vocab_mistake_entries'));

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

-- Danh sách gói kèm số dòng hiện có — gói cũ nhất trước (thứ tự cần ôn/xoá).
create or replace function vocab_mistake_pack_summary() returns table (
  pack_number int,
  entry_count bigint
)
language sql
stable
security invoker
as $$
  select pack_number, count(*) as entry_count
  from vocab_mistake_entries
  group by pack_number
  order by pack_number asc;
$$;

-- Toàn bộ từ (kèm dòng trùng) trong 1 gói cụ thể, dùng để dựng phiên ôn.
create or replace function vocab_mistake_pack_words(p_pack_number int) returns table (
  entry_id uuid,
  word_id uuid,
  en text,
  vi text,
  example text,
  distractors jsonb
)
language sql
stable
security invoker
as $$
  select m.id, w.id, w.en, w.vi, w.example, w.distractors
  from vocab_mistake_entries m
  join vocab_words w on w.id = m.word_id
  where m.pack_number = p_pack_number
  order by m.created_at asc;
$$;

-- Xoá nguyên 1 gói — chỉ gọi từ app sau khi người dùng ôn đúng 100% cả gói
-- trong 1 lượt (kiểm tra ở tầng ứng dụng, xem gradeVocabQuizAnswer +
-- VocabQuizRunner). Không có đường xoá tay nào khác trong UI.
create or replace function clear_vocab_mistake_pack(p_pack_number int) returns void
language sql
security invoker
as $$
  delete from vocab_mistake_entries where pack_number = p_pack_number;
$$;
