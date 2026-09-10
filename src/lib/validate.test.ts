import { describe, it, expect } from "vitest";
import { parseSessionWindow, toCount, ValidationError, MAX_SESSION_SECONDS } from "./validate";

// Đây là lớp chắn duy nhất giữa dữ liệu do trình duyệt gửi lên và cột thống kê
// "tổng thời gian học" — sai ở đây thì số liệu hỏng vĩnh viễn và không có cách
// nào biết dòng nào đúng, dòng nào rác.

describe("parseSessionWindow", () => {
  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

  it("tính duration bằng giây từ hai mốc thời gian", () => {
    const w = parseSessionWindow(iso(-120_000), iso(0));
    expect(w.durationSeconds).toBe(120);
  });

  it("kẹp phiên dài bất thường về mức trần", () => {
    // Ví dụ để tab mở qua đêm, hoặc ai đó gửi started_at 10 năm trước.
    const w = parseSessionWindow("2015-01-01T00:00:00.000Z", iso(0));
    expect(w.durationSeconds).toBe(MAX_SESSION_SECONDS);
  });

  it("từ chối finished_at ở tương lai", () => {
    expect(() => parseSessionWindow(iso(-1000), iso(86_400_000))).toThrow(ValidationError);
  });

  it("cho phép lệch đồng hồ nhỏ giữa máy người dùng và server", () => {
    expect(() => parseSessionWindow(iso(-1000), iso(5_000))).not.toThrow();
  });

  it("từ chối finished_at trước started_at", () => {
    expect(() => parseSessionWindow(iso(0), iso(-60_000))).toThrow(ValidationError);
  });

  it("từ chối chuỗi không phải thời gian", () => {
    expect(() => parseSessionWindow("hôm qua", iso(0))).toThrow(ValidationError);
  });

  it("từ chối kiểu dữ liệu sai", () => {
    expect(() => parseSessionWindow(null, undefined)).toThrow(ValidationError);
  });
});

describe("toCount", () => {
  it("nhận số nguyên không âm", () => {
    expect(toCount(0, "x")).toBe(0);
    expect(toCount(42, "x")).toBe(42);
  });

  it("nhận chuỗi số vì JSON có thể gửi dạng chuỗi", () => {
    expect(toCount("12", "x")).toBe(12);
  });

  it("cắt phần thập phân", () => {
    expect(toCount(3.9, "x")).toBe(3);
  });

  it("từ chối chuỗi rác thay vì âm thầm coi là 0", () => {
    expect(() => toCount("abc", "word_count")).toThrow(/word_count/);
  });

  it("từ chối số âm", () => {
    expect(() => toCount(-5, "x")).toThrow(ValidationError);
  });

  it("từ chối null và NaN", () => {
    expect(() => toCount(null, "x")).toThrow(ValidationError);
    expect(() => toCount(NaN, "x")).toThrow(ValidationError);
  });
});
