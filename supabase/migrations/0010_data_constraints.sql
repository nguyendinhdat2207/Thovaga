-- Ràng buộc để dữ liệu vô nghĩa không lọt vào bảng được, kể cả khi tầng ứng
-- dụng có lỗi hoặc ai đó ghi thẳng qua API.
--
-- Quan trọng nhất là questions: `options` chỉ khai jsonb (nên một chuỗi hay
-- một object cũng hợp lệ) và `correct_option` là int không giới hạn, nên một
-- câu hỏi trỏ đáp án đúng ra ngoài danh sách lựa chọn vẫn lưu được — lúc làm
-- bài thì không đáp án nào được chấm đúng và không có cách nào biết vì sao.

alter table questions
  add constraint questions_options_is_array
    check (jsonb_typeof(options) = 'array'),
  add constraint questions_options_min_length
    check (jsonb_array_length(options) >= 2),
  add constraint questions_correct_option_in_range
    check (correct_option >= 0 and correct_option < jsonb_array_length(options));

alter table vocab_words
  add constraint vocab_words_distractors_is_array
    check (distractors is null or jsonb_typeof(distractors) = 'array');

-- Số đếm không thể âm, và số câu đúng không thể vượt tổng số câu.
alter table attempts
  add constraint attempts_duration_non_negative check (duration_seconds >= 0),
  add constraint attempts_total_questions_positive check (total_questions > 0),
  add constraint attempts_score_in_range check (score >= 0 and score <= 10);

alter table vocab_sessions
  add constraint vocab_sessions_duration_non_negative check (duration_seconds >= 0),
  add constraint vocab_sessions_counts_non_negative check (word_count >= 0 and correct_count >= 0),
  add constraint vocab_sessions_correct_not_over_total check (correct_count <= word_count);

alter table vocab_progress
  add constraint vocab_progress_box_in_range check (box >= 0 and box <= 5),
  add constraint vocab_progress_counts_non_negative check (correct >= 0 and wrong >= 0);
