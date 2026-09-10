/**
 * Trộn ngẫu nhiên (Fisher–Yates) tại chỗ và trả về chính mảng đó.
 *
 * Chỉ gọi ở phía server hoặc trong event handler — gọi lúc render component sẽ
 * cho kết quả khác nhau giữa server và client, gây lệch hydration.
 */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Như shuffleInPlace nhưng không đụng vào mảng gốc. */
export function shuffled<T>(arr: readonly T[]): T[] {
  return shuffleInPlace(arr.slice());
}
