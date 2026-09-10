-- Cho phép lưu sẵn 3 đáp án nhiễu (đã soạn thủ công, dễ gây nhầm lẫn hơn là
-- lấy ngẫu nhiên nghĩa của các từ khác) cho mỗi từ, dùng trong quiz.
-- NULL = chưa có, quiz runner sẽ fallback về cách random cũ.
alter table vocab_words add column if not exists distractors jsonb;
