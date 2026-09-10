-- Chuyển các phép đếm/cộng dồn từ tầng ứng dụng xuống Postgres, và bổ sung
-- index còn thiếu.
--
-- Trước đây trang chủ và trang /vocab kéo toàn bộ bảng về Node chỉ để cộng
-- (sum duration_seconds) hoặc đếm (words.filter() lồng trong decks.map(),
-- O(số bộ × số từ)). Dữ liệu chỉ tăng chứ không giảm nên các trang này chậm
-- dần đều. Postgres làm mấy việc này bằng index, trả về vài dòng thay vì vài
-- nghìn.

-- Múi giờ của ứng dụng — "hôm nay" phải tính theo giờ Việt Nam, không phải UTC.
-- Với UTC+7, dùng ngày UTC khiến từ 00:00 đến 07:00 sáng hệ thống vẫn coi là
-- "hôm qua", nên các từ đến hạn ôn không hiện ra.
create or replace function app_today() returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

-- Lọc "từ đến hạn ôn" quét theo next_review; chưa có index nào cho cột này.
create index if not exists vocab_progress_next_review_idx on vocab_progress(next_review);
-- Khoá ngoại không index: xoá 1 câu hỏi phải quét toàn bộ attempt_answers.
create index if not exists attempt_answers_question_id_idx on attempt_answers(question_id);

-- Tổng thời gian học (giây), gộp cả bộ đề trắc nghiệm lẫn phiên học từ vựng.
-- Thay cho việc fetch mọi dòng duration_seconds rồi reduce() ở Node.
create or replace function study_total_seconds() returns bigint
language sql
stable
security invoker
as $$
  select
    coalesce((select sum(duration_seconds) from attempts), 0)
    + coalesce((select sum(duration_seconds) from vocab_sessions), 0);
$$;

-- Thời gian học theo từng ngày trong 7 ngày gần nhất (theo giờ Việt Nam).
-- Trả đủ 7 dòng kể cả ngày không học, để biểu đồ không bị khuyết cột.
create or replace function study_seconds_by_day(p_days int default 7)
returns table (day date, seconds bigint)
language sql
stable
security invoker
as $$
  with days as (
    select generate_series(app_today() - (p_days - 1), app_today(), interval '1 day')::date as day
  )
  select
    d.day,
    coalesce((
      select sum(a.duration_seconds) from attempts a
      where (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date = d.day
    ), 0)
    + coalesce((
      select sum(s.duration_seconds) from vocab_sessions s
      where (s.created_at at time zone 'Asia/Ho_Chi_Minh')::date = d.day
    ), 0) as seconds
  from days d
  order by d.day;
$$;

-- Thống kê mỗi bộ từ vựng: tổng số từ và số từ đến hạn ôn hôm nay.
-- Thay cho việc tải toàn bộ vocab_words + vocab_progress về rồi lọc bằng JS.
create or replace function vocab_deck_stats()
returns table (id uuid, title text, created_at timestamptz, word_count bigint, due_count bigint)
language sql
stable
security invoker
as $$
  select
    d.id,
    d.title,
    d.created_at,
    count(w.id) as word_count,
    count(w.id) filter (
      where p.next_review is null or p.next_review <= app_today()
    ) as due_count
  from vocab_decks d
  left join vocab_words w on w.deck_id = d.id
  left join vocab_progress p on p.word_id = w.id
  group by d.id, d.title, d.created_at
  order by d.created_at;
$$;

-- Số lượt làm bài và điểm trung bình trên toàn bộ lịch sử. Cần tách riêng vì
-- danh sách lịch sử nay có phân trang — không thể tính trung bình từ trang đầu.
create or replace function attempt_summary()
returns table (attempt_count bigint, average_score numeric)
language sql
stable
security invoker
as $$
  select count(*), coalesce(avg(score), 0) from attempts;
$$;
