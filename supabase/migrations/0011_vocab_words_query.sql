-- Lấy từ vựng kèm tiến trình, lọc và phân trang ngay trong SQL.
--
-- PostgREST không làm được việc này bằng nested select: điều kiện đặt trên bảng
-- nhúng (vocab_progress) chỉ lọc phần join chứ không loại bỏ dòng cha, nên
-- "chỉ lấy từ đến hạn ôn" vẫn phải tải toàn bộ kho từ về rồi lọc ở ứng dụng.
-- Với hàm này, Postgres dùng index vocab_progress(next_review) và chỉ trả về
-- đúng số dòng cần.
--
-- p_due_only: chỉ lấy từ đến hạn ôn (chưa từng ôn cũng tính là đến hạn).
-- p_limit null = lấy hết (dùng cho phiên ôn tập); có giá trị = phân trang.
create or replace function vocab_words_with_progress(
  p_deck_id uuid default null,
  p_due_only boolean default false,
  p_limit int default null,
  p_offset int default 0
)
returns table (
  id uuid,
  deck_id uuid,
  en text,
  vi text,
  example text,
  distractors jsonb,
  box int,
  correct int,
  wrong int,
  next_review date,
  updated_at timestamptz
)
language sql
stable
security invoker
as $$
  select
    w.id, w.deck_id, w.en, w.vi, w.example, w.distractors,
    p.box, p.correct, p.wrong, p.next_review, p.updated_at
  from vocab_words w
  left join vocab_progress p on p.word_id = w.id
  where (p_deck_id is null or w.deck_id = p_deck_id)
    and (
      not p_due_only
      or p.word_id is null
      or p.next_review <= app_today()
    )
  order by w.en
  limit p_limit
  offset p_offset;
$$;

-- Tổng số từ khớp bộ lọc, để kho từ biết có bao nhiêu trang.
create or replace function vocab_words_count(
  p_deck_id uuid default null,
  p_due_only boolean default false
) returns bigint
language sql
stable
security invoker
as $$
  select count(*)
  from vocab_words w
  left join vocab_progress p on p.word_id = w.id
  where (p_deck_id is null or w.deck_id = p_deck_id)
    and (
      not p_due_only
      or p.word_id is null
      or p.next_review <= app_today()
    );
$$;
