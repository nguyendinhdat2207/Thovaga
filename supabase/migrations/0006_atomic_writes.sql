-- Gộp các thao tác ghi nhiều bảng thành hàm Postgres để chạy trong 1 transaction.
--
-- Trước đây mỗi luồng import/ghi kết quả là 2 lệnh insert riêng qua PostgREST:
-- nếu lệnh thứ hai lỗi (mất mạng, vi phạm constraint, timeout) thì lệnh đầu đã
-- commit rồi và không thể rollback — để lại bộ đề rỗng không có câu hỏi, hoặc
-- lượt làm bài không có đáp án nào (điểm hiển thị sai vĩnh viễn).
-- Hàm plpgsql chạy trong transaction ngầm của Postgres nên hoặc thành công trọn
-- vẹn, hoặc không ghi gì cả.
--
-- security invoker: hàm chạy với quyền của người gọi, nên RLS vẫn được áp dụng
-- bình thường (không phải lối tắt vượt quyền).

-- Tạo bộ đề trắc nghiệm + toàn bộ câu hỏi.
-- p_questions: jsonb array [{ prompt, options: [], correct_option, explanation }]
create or replace function import_deck(
  p_subject_id uuid,
  p_title text,
  p_source_file_url text,
  p_questions jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_deck_id uuid;
begin
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'questions phải là danh sách không rỗng';
  end if;

  insert into decks (subject_id, title, source_file_url)
  values (p_subject_id, p_title, p_source_file_url)
  returning id into v_deck_id;

  insert into questions (deck_id, prompt, options, correct_option, explanation)
  select
    v_deck_id,
    q->>'prompt',
    q->'options',
    (q->>'correct_option')::int,
    nullif(q->>'explanation', '')
  from jsonb_array_elements(p_questions) as q;

  return v_deck_id;
end;
$$;

-- Tạo bộ từ vựng + toàn bộ từ.
-- p_words: jsonb array [{ en, vi, example, distractors: [] | null }]
create or replace function import_vocab_deck(
  p_title text,
  p_words jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_deck_id uuid;
begin
  if jsonb_typeof(p_words) <> 'array' or jsonb_array_length(p_words) = 0 then
    raise exception 'words phải là danh sách không rỗng';
  end if;

  insert into vocab_decks (title) values (p_title) returning id into v_deck_id;

  insert into vocab_words (deck_id, en, vi, example, distractors)
  select
    v_deck_id,
    w->>'en',
    w->>'vi',
    nullif(w->>'example', ''),
    case when jsonb_typeof(w->'distractors') = 'array' then w->'distractors' else null end
  from jsonb_array_elements(p_words) as w;

  return v_deck_id;
end;
$$;

-- Ghi 1 lượt làm bài + toàn bộ đáp án. Việc chấm điểm vẫn làm ở tầng ứng dụng
-- (src/lib/queries/attempts.ts) rồi truyền xuống đây đã chấm sẵn — hàm này chỉ
-- lo phần atomic của 2 lệnh insert.
-- p_answers: jsonb array [{ question_id, selected_option, is_correct }]
create or replace function record_attempt(
  p_deck_id uuid,
  p_started_at timestamptz,
  p_finished_at timestamptz,
  p_duration_seconds int,
  p_score numeric,
  p_total_questions int,
  p_answers jsonb
) returns attempts
language plpgsql
security invoker
as $$
declare
  v_attempt attempts;
begin
  insert into attempts (deck_id, started_at, finished_at, duration_seconds, score, total_questions)
  values (p_deck_id, p_started_at, p_finished_at, p_duration_seconds, p_score, p_total_questions)
  returning * into v_attempt;

  insert into attempt_answers (attempt_id, question_id, selected_option, is_correct)
  select
    v_attempt.id,
    (a->>'question_id')::uuid,
    nullif(a->>'selected_option', '')::int,
    (a->>'is_correct')::boolean
  from jsonb_array_elements(p_answers) as a;

  return v_attempt;
end;
$$;
