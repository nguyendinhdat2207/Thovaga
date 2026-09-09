# Thỏ & Gà

App học tập cá nhân — ôn tập môn học ở trường (HUST), Data & AI tự học, và TOEIC. Next.js
(App Router) + Supabase (Postgres, Auth, Storage).

Thiết kế gốc (tham chiếu, không phải code) nằm ở
`~/Downloads/design_handoff_tho_va_ga/`.

## Phạm vi hiện tại (MVP)

- 6 màn hình: trang chủ, chi tiết môn, làm quiz, kết quả, lịch sử, tải đề.
- 1 dạng câu hỏi: **trắc nghiệm 4 đáp án**, chấm điểm và lưu lịch sử đầy đủ.
- Đăng nhập bằng 1 tài khoản Supabase Auth (email/password), không có đăng ký công khai.
- Import bộ đề bằng cách dán JSON câu hỏi (ưu tiên cao nhất theo yêu cầu ban đầu).
- Upload file gốc (PDF/DOCX/ảnh) lên Supabase Storage — **chưa** tự trích câu hỏi bằng AI,
  xem TODO trong `src/app/api/decks/upload/route.ts`.
- Đọc hiểu TOEIC Part 7 (1 dạng còn lại trong thiết kế gốc) **chưa** được hiện thực hoá —
  schema hiện tại (`questions.options` + `correct_option`) chỉ mô tả trắc nghiệm.

### Từ vựng (flashcard + quiz + kho từ)

Mục riêng ở `/vocab`, tách khỏi mô hình `subjects/decks/questions` — dùng bảng riêng
`vocab_decks`/`vocab_words`/`vocab_progress` (xem `supabase/migrations/0003_vocab.sql`).

- **Flashcard** (`/vocab/flashcard?scope=due|deckId=...`): lật thẻ, tự đánh giá nhớ/chưa nhớ,
  tiến trình lưu kiểu Leitner (box 0-5, `next_review` tăng dần 0→1→2→4→7→15 ngày).
- **Quiz** (`/vocab/quiz?scope=all|deckId=...`): trắc nghiệm 4 đáp án tự sinh từ nghĩa các từ
  khác — server luôn tính lại đúng/sai (`src/lib/queries/vocab.ts#gradeVocabQuizAnswer`), không
  tin client.
- **Kho từ** (`/vocab/bank`): tìm kiếm + lọc theo bộ từ.
- **Thêm từ mới** (`/vocab/import`): dán danh sách `từ | nghĩa | ví dụ`, mỗi dòng 1 từ.

## Chạy local

1. Tạo project Supabase mới tại [supabase.com](https://supabase.com).
2. Chạy migration: `supabase/migrations/0001_init.sql` rồi `0002_seed_subjects.sql`
   (SQL Editor trên dashboard, hoặc `supabase db push` nếu dùng Supabase CLI).
3. Tạo bucket Storage tên `documents` nếu migration insert vào `storage.buckets` bị
   dashboard chặn — kiểm tra lại trong Storage > Buckets.
4. Tạo 1 tài khoản đăng nhập: Authentication > Users > Add user (email/password) — **tắt**
   "Confirm email" hoặc set email đã confirm ngay, vì app không có luồng xác nhận email.
5. Copy `.env.example` thành `.env.local`, điền `NEXT_PUBLIC_SUPABASE_URL` và
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` từ Project Settings > API. `SUPABASE_SERVICE_ROLE_KEY`
   hiện chưa được code dùng (mọi route đều chạy dưới session người dùng qua RLS) — điền vào
   phòng khi cần viết script quản trị sau này.
6. `npm install`
7. `npm run dev` → mở [http://localhost:3000](http://localhost:3000), đăng nhập bằng tài khoản
   đã tạo ở bước 4.
8. Vào `/upload`, dán JSON câu hỏi để tạo bộ đề đầu tiên. Ví dụ khớp với API
   `POST /api/decks/import`:

   ```json
   {
     "subject_id": "<uuid môn học, xem trong bảng subjects>",
     "title": "Chương 10 · Đồ thị",
     "questions": [
       {
         "prompt": "Thuật toán BFS có độ phức tạp thời gian là bao nhiêu?",
         "options": ["O(V log V)", "O(V + E)", "O(V²)", "O(E log V)"],
         "correct_option": 1,
         "explanation": "Mỗi đỉnh vào hàng đợi một lần, mỗi cạnh được xét một lần."
       }
     ]
   }
   ```

   Form ở `/upload` chỉ cần bạn dán mảng `questions` — môn học và tên bộ đề chọn qua UI.

## Cấu trúc backend

- `supabase/migrations/` — schema (`0001_init.sql`) + seed 5 môn học mẫu (`0002_seed_subjects.sql`).
- `src/lib/database.types.ts` — type Database viết tay khớp schema (Row/Insert/Update/Relationships).
- `src/lib/supabase/{client,server}.ts` — Supabase client cho Client Component / Server
  Component-Route Handler, theo convention `@supabase/ssr`.
- `src/proxy.ts` — refresh session + redirect `/login` nếu chưa đăng nhập (Next.js 16 đổi tên
  `middleware.ts` thành `proxy.ts`, xem `AGENTS.md`).
- `src/lib/queries/` — hàm truy vấn dùng chung giữa Server Component và Route Handler
  (`subjects.ts`, `decks.ts`, `decks-import.ts`, `attempts.ts`).
- `src/app/api/` — 6 route handler theo đúng yêu cầu: `GET /api/subjects`,
  `GET /api/decks/[id]`, `POST /api/attempts`, `GET /api/history`,
  `POST /api/decks/import`, `POST /api/decks/upload`.

**Điểm số luôn được server tính lại** từ `correct_option` lưu trong DB khi nhận
`POST /api/attempts` — không tin điểm số client gửi lên.

## Deploy

**Supabase:** giữ project đã tạo ở bước "Chạy local" — free tier đủ dùng cho 1 người dùng.

**Vercel:**

1. Push repo này lên GitHub.
2. Import repo vào [vercel.com/new](https://vercel.com/new).
3. Thêm 3 biến môi trường (Project Settings > Environment Variables): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy. Không cần cấu hình gì thêm — App Router + Route Handlers chạy trực tiếp trên
   Vercel Functions.

## Việc còn để TODO (đã ghi rõ trong code)

- Trích câu hỏi tự động từ file PDF/DOCX bằng AI sau khi upload
  (`src/app/api/decks/upload/route.ts`).
- Dạng câu hỏi flashcard và đọc hiểu đoạn văn (`supabase/migrations/0001_init.sql`) — cần
  thêm cột/bảng mới, nên bàn trước khi đổi schema.
