import { useCallback, useEffect, useRef } from "react";

/**
 * Lưu phiên làm DỞ khi người dùng rời đi giữa chừng.
 *
 * Rời đi có 2 kiểu và cần bắt cả hai: đóng tab/tải lại (`pagehide`) và chuyển
 * trang trong app bằng nút back/Link (component unmount — `pagehide` KHÔNG
 * chạy). Dùng `fetch(..., { keepalive: true })` để request không bị huỷ khi
 * trang đang đóng.
 *
 * `build` trả về body cần gửi, hoặc null nếu không có gì để lưu (chưa trả lời
 * câu nào, hoặc phiên đã xong và được lưu bằng đường chính). Mỗi lần mount chỉ
 * lưu dở tối đa 1 lần để unmount + pagehide không ghi trùng.
 */
export function useSaveOnLeave(url: string, build: () => unknown | null) {
  const buildRef = useRef(build);
  const savedRef = useRef(false);

  useEffect(() => {
    buildRef.current = build;
  });

  const flush = useCallback(() => {
    if (savedRef.current) return;
    const body = buildRef.current();
    if (!body) return;
    savedRef.current = true;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Đang rời trang, không còn cách báo lỗi cho người dùng.
    });
  }, [url]);

  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);
}
