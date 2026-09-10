import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Thỏ & Gà",
  description: "App học tập cá nhân — môn ở trường, Data & AI, TOEIC",
};

// viewport-fit=cover bắt buộc phải có thì env(safe-area-inset-*) mới trả về
// giá trị thật (khác 0) — cần cho vùng Dynamic Island / thanh home-indicator
// trên iPhone, nhất là khi "Thêm vào Màn hình chính" (chạy không có thanh
// trình duyệt che chắn).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${baloo.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
