/**
 * POST JSON, thử lại vài lần khi mất mạng hoặc server trả 5xx.
 *
 * Dùng cho các lần ghi kết quả học: nếu rớt mạng đúng lúc kết thúc phiên mà
 * chỉ gọi 1 lần thì cả phiên biến mất khỏi lịch sử. Lỗi 4xx (dữ liệu sai) thì
 * thử lại cũng vô ích nên dừng ngay. Trả về true nếu cuối cùng đã lưu được.
 */
export async function postJsonWithRetry(
  url: string,
  body: unknown,
  attempts = 3
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) return true;
      if (res.status < 500) return false;
    } catch {
      // mất mạng — thử lại
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return false;
}
