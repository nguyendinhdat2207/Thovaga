import { describe, it, expect } from "vitest";
import { parseQuizMarkdown, parseVocabMarkdown, MarkdownParseError } from "./markdown-import";

// Parser này là nơi dễ hỏng nhất mà lại không ai kiểm tra được bằng mắt: nó
// nhận file markdown do một phiên Claude khác OCR ra, cấu trúc mỗi lần một
// khác. Một lỗi regex ở đây làm sai lệch cả bộ đề mà không có dấu hiệu gì.

describe("parseQuizMarkdown", () => {
  const sample = `# Chương 5: Mạng máy tính
Subject: Mạng máy tính
Category: school

1. Giao thức nào ở tầng transport?
A. HTTP
B. TCP
C. IP
D. Ethernet
Answer: B
Explanation: TCP là giao thức tầng transport.

2. IP viết tắt của gì?
A. Internet Protocol
B. Internal Path
Answer: A
`;

  it("đọc được tiêu đề, tên môn và category từ phần header", () => {
    const parsed = parseQuizMarkdown(sample);
    expect(parsed.title).toBe("Chương 5: Mạng máy tính");
    expect(parsed.subjectName).toBe("Mạng máy tính");
    expect(parsed.category).toBe("school");
  });

  it("chuyển chữ cái đáp án thành chỉ số 0-based", () => {
    const parsed = parseQuizMarkdown(sample);
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[0].correct_option).toBe(1); // B
    expect(parsed.questions[0].explanation).toBe("TCP là giao thức tầng transport.");
    expect(parsed.questions[1].correct_option).toBe(0); // A
    expect(parsed.questions[1].explanation).toBeNull();
  });

  // Từng có lỗi thật: regex chỉ nhận [A-Da-d] nên các lựa chọn E, F... bị bỏ
  // qua, và câu nào có đáp án đúng từ E trở đi thì import sai đáp án.
  it("nhận lựa chọn quá chữ D (E, F, ...)", () => {
    const parsed = parseQuizMarkdown(`# Đề nhiều lựa chọn

1. Chọn số lớn nhất?
A. 1
B. 2
C. 3
D. 4
E. 5
F. 6
Answer: F
`);
    expect(parsed.questions[0].options).toHaveLength(6);
    expect(parsed.questions[0].correct_option).toBe(5);
  });

  it("nhận nhãn tiếng Việt Đáp án/Giải thích", () => {
    const parsed = parseQuizMarkdown(`# Đề tiếng Việt

1. 2 + 2 = ?
A. 3
B. 4
Đáp án: B
Giải thích: Cộng hai số.
`);
    expect(parsed.questions[0].correct_option).toBe(1);
    expect(parsed.questions[0].explanation).toBe("Cộng hai số.");
  });

  it("nhiều đáp án đúng thì lấy chữ cái đầu (DB chỉ lưu được 1)", () => {
    const parsed = parseQuizMarkdown(`# Đề

1. Chọn các số chẵn?
A. 1
B. 2
C. 4
Answer: B, C
`);
    expect(parsed.questions[0].correct_option).toBe(1);
  });

  it("báo lỗi kèm số câu khi thiếu dòng Answer", () => {
    expect(() =>
      parseQuizMarkdown(`# Đề

1. Câu có đáp án?
A. x
B. y
Answer: A

2. Câu thiếu đáp án?
A. x
B. y
`)
    ).toThrow(/Câu 2/);
  });

  it("báo lỗi khi Answer trỏ tới lựa chọn không tồn tại", () => {
    expect(() =>
      parseQuizMarkdown(`# Đề

1. Câu hỏi?
A. x
B. y
Answer: D
`)
    ).toThrow(MarkdownParseError);
  });

  it("báo lỗi khi thiếu tiêu đề # ở đầu file", () => {
    expect(() => parseQuizMarkdown("1. Câu hỏi?\nA. x\nB. y\nAnswer: A")).toThrow(
      MarkdownParseError
    );
  });
});

describe("parseVocabMarkdown", () => {
  it("lấy nghĩa từ dòng Meaning và lưu các lựa chọn còn lại làm đáp án nhiễu", () => {
    const parsed = parseVocabMarkdown(`# TOEIC Ngày 11

1. run
Meaning: chạy
Example: He runs every morning.
A. chạy
B. đi bộ
C. nhảy
D. bơi
Answer: A
`);
    expect(parsed.title).toBe("TOEIC Ngày 11");
    expect(parsed.words[0].en).toBe("run");
    expect(parsed.words[0].vi).toBe("chạy");
    expect(parsed.words[0].example).toBe("He runs every morning.");
    expect(parsed.words[0].distractors).toEqual(["đi bộ", "nhảy", "bơi"]);
  });

  it("không có dòng Meaning thì lấy nghĩa theo đáp án đúng", () => {
    const parsed = parseVocabMarkdown(`# Bộ từ

1. walk
A. bơi
B. đi bộ
Answer: B
`);
    expect(parsed.words[0].vi).toBe("đi bộ");
    expect(parsed.words[0].distractors).toEqual(["bơi"]);
  });

  it("chỉ có Meaning, không có lựa chọn thì distractors là null", () => {
    const parsed = parseVocabMarkdown(`# Bộ từ

1. swim
Nghĩa: bơi
`);
    expect(parsed.words[0].vi).toBe("bơi");
    expect(parsed.words[0].distractors).toBeNull();
  });

  it("báo lỗi khi từ không có cả Meaning lẫn lựa chọn", () => {
    expect(() => parseVocabMarkdown("# Bộ từ\n\n1. swim\n")).toThrow(/swim/);
  });
});
