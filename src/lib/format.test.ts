import { describe, it, expect } from "vitest";
import { formatMinutesShort, computeScore, optionLetter } from "./format";

describe("formatMinutesShort", () => {
  it("dưới 60 phút thì để nguyên số phút", () => {
    expect(formatMinutesShort(0)).toBe("0");
    expect(formatMinutesShort(8)).toBe("8");
    expect(formatMinutesShort(59)).toBe("59");
  });

  it("tròn giờ thì bỏ phần phút", () => {
    expect(formatMinutesShort(60)).toBe("1h");
    expect(formatMinutesShort(120)).toBe("2h");
  });

  it("lẻ phút thì đệm 0 để chuỗi luôn cùng độ dài", () => {
    expect(formatMinutesShort(63)).toBe("1h03");
    expect(formatMinutesShort(95)).toBe("1h35");
  });
});

describe("computeScore", () => {
  it("quy đổi số câu đúng ra thang 10", () => {
    expect(computeScore(20, 20)).toBe(10);
    expect(computeScore(10, 20)).toBe(5);
    expect(computeScore(1, 3)).toBe(3.3);
  });

  it("không chia cho 0 khi bộ đề rỗng", () => {
    expect(computeScore(0, 0)).toBe(0);
  });
});

describe("optionLetter", () => {
  // Trước đây là mảng cứng 6 phần tử nên đề trên 6 lựa chọn hiện "undefined".
  it("sinh nhãn quá chữ F", () => {
    expect(optionLetter(0)).toBe("A");
    expect(optionLetter(5)).toBe("F");
    expect(optionLetter(11)).toBe("L");
  });
});
