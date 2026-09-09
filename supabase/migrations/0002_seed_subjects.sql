-- Seed vài môn học mẫu để có nơi import bộ đề vào ngay sau khi deploy.
-- Không seed sẵn deck/câu hỏi/lịch sử — dữ liệu thật do bạn tự import qua
-- POST /api/decks/import hoặc màn "Tải đề lên".

insert into subjects (name, category)
select v.name, v.category
from (values
  ('Cấu trúc dữ liệu & Thuật toán', 'school'),
  ('Cơ sở dữ liệu', 'school'),
  ('SQL nâng cao', 'data_ai'),
  ('Apache Spark', 'data_ai'),
  ('TOEIC · Part 5 Ngữ pháp', 'toeic')
) as v(name, category)
where not exists (select 1 from subjects s where s.name = v.name);
