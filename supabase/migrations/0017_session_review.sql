-- Lưu chi tiết từng phiên học từ vựng để xem lại về sau, và khoá dữ liệu kết
-- quả làm bài khỏi bị xoá hàng loạt.
--
-- Trước đây vocab_sessions chỉ giữ số đếm (word_count/correct_count) nên sau
-- khi làm xong không có cách nào biết mình đã đúng/sai từ nào. Thêm:
--   - title: nhãn hiển thị trong danh sách (vd "Ôn gói 3 · từ sai").
--   - answers: ảnh chụp (snapshot) từng từ của phiên — chép luôn chữ en/vi thay
--     vì chỉ lưu word_id, để lịch sử vẫn đọc được dù từ sau này bị sửa/xoá.
-- Kho từ sai (vocab_mistake_entries) KHÔNG đổi: vẫn chỉ ghi câu sai.

alter table vocab_sessions
  add column if not exists title text,
  add column if not exists answers jsonb not null default '[]'::jsonb;

create index if not exists vocab_sessions_created_at_desc_idx on vocab_sessions(created_at desc);

-- Kết quả làm bài trắc nghiệm cũng là dữ liệu không được mất: dùng chung trigger
-- chặn TRUNCATE / xoá hàng loạt (> 20 dòng/lệnh) đã có cho dữ liệu từ vựng.
-- Xoá 1 bộ đề vẫn cascade được attempts của nó nếu ≤ 20 dòng; vượt thì phải
-- xác nhận bằng: set local app.allow_destructive_vocab_ops = 'yes';
do $$
declare
  t text;
begin
  foreach t in array array['attempts', 'attempt_answers'] loop
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

-- ============================================================
-- Phiên làm DỞ (thoát giữa chừng) cũng được lưu.
-- completed = false đánh dấu phiên chưa làm hết. Phiên dở vẫn tính vào thời
-- gian học và xem lại được, nhưng KHÔNG tính vào: số lần đã học của bộ từ,
-- tiến độ môn, điểm trung bình/điểm cao nhất (vì điểm dở dang tính trên số
-- câu đã làm, không so sánh được với bài làm trọn vẹn).
-- ============================================================
alter table attempts add column if not exists completed boolean not null default true;
alter table vocab_sessions add column if not exists completed boolean not null default true;

drop function if exists record_attempt(uuid, timestamptz, timestamptz, int, numeric, int, jsonb);

create or replace function record_attempt(
  p_deck_id uuid,
  p_started_at timestamptz,
  p_finished_at timestamptz,
  p_duration_seconds int,
  p_score numeric,
  p_total_questions int,
  p_answers jsonb,
  p_completed boolean default true
) returns attempts
language plpgsql
security invoker
as $$
declare
  v_attempt attempts;
begin
  insert into attempts (deck_id, started_at, finished_at, duration_seconds, score, total_questions, completed)
  values (p_deck_id, p_started_at, p_finished_at, p_duration_seconds, p_score, p_total_questions, p_completed)
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

-- Điểm trung bình chỉ tính bài làm trọn vẹn; số lượt tính tất cả.
create or replace function attempt_summary()
returns table (attempt_count bigint, average_score numeric)
language sql
stable
security invoker
as $$
  select count(*), coalesce(avg(score) filter (where completed), 0) from attempts;
$$;

drop function if exists vocab_deck_stats();

create function vocab_deck_stats()
returns table (
  id uuid, title text, created_at timestamptz,
  word_count bigint, due_count bigint, completed_count bigint
)
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
    ) as due_count,
    (select count(*) from vocab_sessions s where s.deck_id = d.id and s.completed) as completed_count
  from vocab_decks d
  left join vocab_words w on w.deck_id = d.id
  left join vocab_progress p on p.word_id = w.id
  group by d.id, d.title, d.created_at
  order by d.created_at;
$$;
