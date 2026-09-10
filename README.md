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
- **Thêm từ mới** (`/vocab/import`): dán danh sách `từ | nghĩa | ví dụ`, mỗi dòng 1 từ, hoặc dùng
  chế độ "Dán Markdown" bên dưới.

### Import bằng Markdown (dùng cho đề đã OCR sẵn)

Cả `/upload` (trắc nghiệm) và `/vocab/import` (từ vựng) đều có nút **"Dán Markdown"** bên cạnh chế
độ dán thủ công cũ — dùng khi đã nhờ 1 phiên Claude khác (vd Claude.ai, chụp ảnh/PDF đề thi) OCR
ra file `.md` theo đúng cấu trúc dưới đây, rồi dán thẳng/chọn file vào web, không cần Claude Code
xử lý thủ công. Parser dùng chung ở `src/lib/markdown-import.ts`.

**Trắc nghiệm** — `/upload`, chế độ Markdown:
```
# Chương 5: Mạng máy tính
Subject: Mạng máy tính
Category: school

1. Giao thức nào hoạt động ở tầng transport?
A. HTTP
B. TCP
C. IP
D. Ethernet
Answer: B
Explanation: TCP là giao thức tầng transport.
```
- `Subject:` tự tìm môn đã có (không phân biệt hoa/thường) hoặc tự tạo môn mới — không còn bị giới
  hạn "chỉ chọn được môn có sẵn" như chế độ JSON.
- `Category:` (`school`/`data_ai`/`toeic`) chỉ cần khi tạo môn mới, mặc định `school`.
- Hỗ trợ nhãn tiếng Việt: `Đáp án:` thay `Answer:`, `Giải thích:` thay `Explanation:`.

**Từ vựng** — `/vocab/import`, chế độ Markdown:
```
# TOEIC Ngày 11

1. run
Meaning: chạy
Example: He runs every morning.
A. chạy
B. đi bộ
C. nhảy
D. bơi
Answer: A
```
- `Meaning:`/`Nghĩa:` tuỳ chọn — bỏ qua thì tự lấy theo đáp án đúng trong A-D.
- 3 lựa chọn còn lại tự lưu vào cột `distractors` (đáp án nhiễu khi làm quiz từ vựng), khó đoán
  hơn hẳn cách random nghĩa của từ khác.

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

- `supabase/migrations/` — schema, RLS, và các hàm Postgres. Từ `0006` trở đi, những thao
  tác ghi nhiều bảng và mọi phép cộng dồn/lọc theo ngày đều nằm ở DB (xem phần dưới).
- `src/lib/database.types.ts` — type Database viết tay khớp schema, gồm cả `Functions` cho
  các hàm gọi qua `supabase.rpc()`.
- `src/lib/supabase/server.ts` — Supabase client cho Server Component / Route Handler, bọc
  `cache()` của React để một request chỉ dựng một client.
- `src/proxy.ts` — refresh session + redirect `/login` nếu chưa đăng nhập (Next.js 16 đổi tên
  `middleware.ts` thành `proxy.ts`, xem `AGENTS.md`). Route `/api/*` nhận 401 JSON thay vì
  redirect sang trang HTML.
- `src/lib/api/route-helpers.ts` — `withAuth()` bọc mọi route handler: bắt buộc đăng nhập
  (bằng `getUser()`, có xác minh chữ ký JWT), giới hạn kích thước body, và chuẩn hoá lỗi.
- `src/lib/queries/` — hàm truy vấn dùng chung giữa Server Component và Route Handler
  (`subjects.ts`, `decks.ts`, `decks-import.ts`, `attempts.ts`, `vocab.ts`, `stats.ts`).
- `src/app/api/` — 9 route handler: `GET /api/subjects`, `GET /api/decks/[id]`,
  `POST /api/attempts`, `GET /api/history`, `POST /api/decks/import`,
  `POST /api/decks/upload`, `POST /api/vocab/{import,progress,sessions}`.

### Ba nguyên tắc của tầng ghi dữ liệu

1. **Không tin dữ liệu client gửi lên.** Điểm số luôn được server tính lại từ `correct_option`
   trong DB. Thời lượng phiên học cũng do server tự tính từ hai mốc thời gian, kẹp trong
   khoảng hợp lý (`src/lib/validate.ts`) — nếu không, chỉ cần sửa `started_at` là cột "tổng
   thời gian học" hỏng vĩnh viễn.
2. **Ghi nhiều bảng thì phải atomic.** Import bộ đề/bộ từ và ghi lượt làm bài đều đi qua hàm
   plpgsql (`0006_atomic_writes.sql`), không để lại bộ đề rỗng hay lượt làm bài không có
   đáp án khi lệnh thứ hai lỗi.
3. **Cộng dồn và lọc theo ngày làm ở Postgres.** `study_total_seconds`, `vocab_deck_stats`,
   `vocab_words_with_progress`… (`0008`, `0011`). Ngày "hôm nay" luôn theo giờ Việt Nam qua
   `app_today()` / `appToday()` — dùng ngày UTC thì khung 00:00–07:00 sáng bị tính sang hôm
   trước.

### Phân quyền

RLS khoá theo bảng `app_owners` (`0007_lock_to_owner.sql`), không phải theo
`auth.role() = 'authenticated'`. Khác biệt quan trọng: với cách cũ, bất kỳ ai tự đăng ký một
tài khoản ở project Supabase này đều đọc/xoá được toàn bộ dữ liệu.

> ⚠️ **Việc cần làm thủ công một lần:** vào Supabase Dashboard → Authentication → Sign In /
> Providers → tắt **Allow new users to sign up**. RLS đã chặn người lạ đọc dữ liệu, nhưng tắt
> đăng ký thì họ không tạo được tài khoản rác ngay từ đầu.

Muốn thêm người dùng thứ hai: `insert into app_owners (user_id) values ('<uuid>')` từ SQL
Editor. Mặc định là không có quyền.

## Deploy

**Supabase:** giữ project đã tạo ở bước "Chạy local" — free tier đủ dùng cho 1 người dùng.

**Vercel:**

1. Push repo này lên GitHub.
2. Import repo vào [vercel.com/new](https://vercel.com/new).
3. Thêm 3 biến môi trường (Project Settings > Environment Variables): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy. Không cần cấu hình gì thêm — App Router + Route Handlers chạy trực tiếp trên
   Vercel Functions.

## Kiểm thử

```bash
npm test        # chạy một lượt
npm run test:watch
```

Test tập trung vào phần logic thuần dễ hỏng âm thầm: trình đọc markdown
(`src/lib/markdown-import.test.ts`) và lớp xác thực dữ liệu client gửi lên
(`src/lib/validate.test.ts`).

## Việc còn để TODO (đã ghi rõ trong code)

- Trích câu hỏi tự động từ file PDF/DOCX bằng AI sau khi upload
  (`src/app/api/decks/upload/route.ts`).
- Dạng câu hỏi flashcard và đọc hiểu đoạn văn (`supabase/migrations/0001_init.sql`) — cần
  thêm cột/bảng mới, nên bàn trước khi đổi schema.
