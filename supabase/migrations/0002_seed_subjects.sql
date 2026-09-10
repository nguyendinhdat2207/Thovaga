-- Migration này trước đây seed 5 môn học mẫu (Cấu trúc dữ liệu, Cơ sở dữ liệu,
-- SQL nâng cao, Apache Spark, TOEIC Part 5) để có chỗ import đề ngay sau khi
-- deploy.
--
-- Đã bỏ phần seed: các môn mẫu đó không còn dùng và đã bị xoá khỏi cơ sở dữ
-- liệu thật; nếu giữ lại, mỗi lần dựng lại DB từ đầu chúng sẽ quay về. Môn học
-- nay được tạo tự động khi import file markdown có dòng "Subject:".
--
-- Giữ lại file (thay vì xoá) để thứ tự đánh số migration không đứt quãng.
select 1;
