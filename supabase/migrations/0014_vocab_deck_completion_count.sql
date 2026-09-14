-- "Số lần đã học" mỗi bộ từ — đếm vĩnh viễn, không phụ thuộc lịch ôn Leitner.
--
-- Vấn đề đang có: vòng tròn ✓ ở trang /vocab hiện chỉ có nghĩa "hôm nay không
-- còn từ nào đến hạn" (dueCount = 0). Đây là trạng thái LỊCH ÔN, không phải
-- "đã học bao nhiêu lần" — nên hôm sau, khi box Leitner đẩy vài từ quay lại
-- đến hạn, dấu ✓ biến mất, trông như hôm qua chưa học gì dù thực tế đã hoàn
-- thành nguyên bộ. Cần một con số ĐẾM RIÊNG, cộng dồn mãi mãi.
--
-- vocab_sessions trước đây không lưu bộ nào — mỗi phiên flashcard/quiz chỉ có
-- mode/word_count/correct_count, không biết gắn với deck nào. Thêm deck_id:
-- NULL khi phiên trải trên nhiều bộ (vd "Ôn hôm nay", "Quiz tất cả từ", "Từ
-- sai tuần này" — không nên cộng dồn vào riêng bộ nào); có giá trị khi mở
-- Flashcard/Quiz từ đúng 1 bộ cụ thể ở trang /vocab.

alter table vocab_sessions
  add column if not exists deck_id uuid references vocab_decks(id) on delete set null;
-- on delete set null (không phải cascade): xoá 1 bộ từ không nên xoá luôn
-- lịch sử "đã học bao nhiêu phút" của những phiên đó — chỉ mất phần gắn với
-- bộ cụ thể, phiên vẫn tính vào tổng thời gian học chung.

create index if not exists vocab_sessions_deck_id_idx on vocab_sessions(deck_id);

-- Thêm completed_count vào hàm thống kê mỗi bộ (đã dùng ở trang /vocab).
-- Dùng subquery tương quan thay vì join thẳng vocab_sessions vào cùng câu với
-- vocab_words/vocab_progress — join thẳng sẽ nhân chéo (số từ × số phiên) rồi
-- phải đếm distinct để bù lại, tốn hơn nhiều so với 1 subquery có index.
-- Đổi shape kết quả (thêm cột completed_count) nên phải drop trước —
-- Postgres không cho CREATE OR REPLACE khi số/loại cột OUT thay đổi.
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
    (select count(*) from vocab_sessions s where s.deck_id = d.id) as completed_count
  from vocab_decks d
  left join vocab_words w on w.deck_id = d.id
  left join vocab_progress p on p.word_id = w.id
  group by d.id, d.title, d.created_at
  order by d.created_at;
$$;
