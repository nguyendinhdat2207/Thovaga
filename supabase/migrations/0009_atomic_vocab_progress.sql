-- Cập nhật tiến trình ôn tập (Leitner) bằng một lệnh duy nhất.
--
-- Trước đây tầng ứng dụng làm 3 bước: select tiến trình hiện tại → cộng bộ đếm
-- bằng JS → upsert lại. Hai request chồng nhau (bấm nhanh, hoặc mạng chậm khiến
-- request trước chưa xong) cùng đọc được giá trị cũ rồi cùng ghi đè, nên mất
-- một lượt đếm. `on conflict do update` để Postgres tự cộng trên giá trị đang
-- có trong bảng, không phải giá trị mà ứng dụng đọc được lúc trước.
--
-- Quy tắc Leitner giữ nguyên: đúng thì lên box (tối đa 5), sai thì về box 1;
-- next_review = hôm nay + số ngày theo box (0,1,2,4,7,15).
create or replace function apply_vocab_progress(p_word_id uuid, p_correct boolean)
returns vocab_progress
language plpgsql
security invoker
as $$
declare
  v_row vocab_progress;
begin
  insert into vocab_progress (word_id, box, correct, wrong, next_review, updated_at)
  -- Lần đầu gặp từ này: box trước đó coi như 0, nên đúng hay sai đều ra box 1
  -- (đúng: least(0+1,5)=1; sai: về 1) và ôn lại sau 1 ngày.
  values (
    p_word_id,
    1,
    case when p_correct then 1 else 0 end,
    case when p_correct then 0 else 1 end,
    app_today() + 1,
    now()
  )
  on conflict (word_id) do update set
    box = case
      when p_correct then least(vocab_progress.box + 1, 5)
      else 1
    end,
    correct = vocab_progress.correct + (case when p_correct then 1 else 0 end),
    wrong = vocab_progress.wrong + (case when p_correct then 0 else 1 end),
    next_review = app_today() + (
      case
        when p_correct then
          case least(vocab_progress.box + 1, 5)
            when 1 then 1 when 2 then 2 when 3 then 4 when 4 then 7 when 5 then 15
            else 1
          end
        else 1
      end
    ),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;
