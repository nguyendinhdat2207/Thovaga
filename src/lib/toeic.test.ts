import { describe, expect, it } from "vitest";
import {
  currentLessonNo,
  formatInboxForClaude,
  isMistakeType,
  isoWeekNumber,
  lessonState,
  ratio,
  scoreTone,
  zenlishQuizUrl,
} from "./toeic";

describe("zenlishQuizUrl", () => {
  it("ghép slug vào gốc stm-quizzes, có dấu / cuối", () => {
    expect(zenlishQuizUrl("fo_lesson-4_actual-1")).toBe(
      "https://zenlishtoeic.vn/stm-quizzes/fo_lesson-4_actual-1/"
    );
  });
});

describe("ratio / scoreTone", () => {
  it("tổng ≤ 0 → 0", () => {
    expect(ratio(3, 0)).toBe(0);
  });
  it("kẹp trong 0..1", () => {
    expect(ratio(7, 6)).toBe(1);
    expect(ratio(-1, 6)).toBe(0);
  });
  it("phân ngưỡng 80% / 50%", () => {
    expect(scoreTone(5, 6)).toBe("good");
    expect(scoreTone(3, 6)).toBe("ok");
    expect(scoreTone(2, 6)).toBe("low");
  });
});

describe("currentLessonNo / lessonState", () => {
  it("chưa tick bài nào → bài 1", () => {
    expect(currentLessonNo([{ lesson_no: 1, completed: false }])).toBe(1);
  });
  it("lấy bài lớn nhất đã tick + 1, kể cả tick nhảy cóc", () => {
    const ls = [
      { lesson_no: 1, completed: true },
      { lesson_no: 2, completed: false },
      { lesson_no: 3, completed: true },
    ];
    expect(currentLessonNo(ls)).toBe(4);
    expect(lessonState(2, false, 4)).toBe("missed");
    expect(lessonState(3, true, 4)).toBe("done");
    expect(lessonState(4, false, 4)).toBe("current");
    expect(lessonState(5, false, 4)).toBe("upcoming");
  });
});

describe("isMistakeType", () => {
  it("chỉ nhận khoá đã định nghĩa", () => {
    expect(isMistakeType("trap")).toBe(true);
    expect(isMistakeType("other")).toBe(false);
    expect(isMistakeType("toString")).toBe(false);
  });
});

describe("formatInboxForClaude", () => {
  it("đánh số, kèm nguồn và ngữ cảnh nếu có", () => {
    const text = formatInboxForClaude(
      [
        { raw_text: " comply w/ ", source: "Ca RC2 c5", context: "All staff must ___ the policy." },
        { raw_text: "merchandise", source: null, context: null },
      ],
      "tuần 43"
    );
    expect(text).toContain("sổ từ Zenlish tuần 43");
    expect(text).toContain("1. comply w/ — [Ca RC2 c5] — All staff must ___ the policy.");
    expect(text).toContain("2. merchandise");
    expect(text.endsWith("2. merchandise")).toBe(true);
  });
});

describe("isoWeekNumber", () => {
  it("tính tuần ISO", () => {
    expect(isoWeekNumber("2026-10-21")).toBe(43);
    expect(isoWeekNumber("2026-01-01")).toBe(1);
    expect(isoWeekNumber("2027-01-01")).toBe(53);
  });
});
