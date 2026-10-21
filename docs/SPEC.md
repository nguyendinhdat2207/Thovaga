# Thỏ & Gà — Spec & quy tắc code

Tài liệu này là **nguồn quy tắc** khi sửa/thêm code. Mô tả tính năng và hướng dẫn chạy/deploy nằm ở
[README.md](../README.md); file này tập trung vào *cấu trúc, quy ước và những điều không được phá*.

> Next.js ở đây là **16.x có breaking changes** (xem [AGENTS.md](../AGENTS.md)): trước khi dùng API
> Next mà chưa chắc, đọc `node_modules/next/dist/docs/`. Ví dụ đã gặp: `middleware.ts` đổi thành
> `proxy.ts`; `params`/`searchParams` là `Promise`; layout dùng helper type `LayoutProps<"/">`.

Ký hiệu: **MUST** = bắt buộc, **SHOULD** = nên, **MUST NOT** = cấm.

---

## 1. Tổng quan

App học tập cá nhân (1 người dùng). Next.js App Router + React 19 + Tailwind v4 + Supabase
(Postgres, Auth, Storage). Deploy Vercel (region `iad1`), DB ở US. Ngôn ngữ UI, comment, thông báo
lỗi: **tiếng Việt**. Tên định danh code (biến, hàm, cột DB): **tiếng Anh**.

Hai miền dữ liệu độc lập, **không trộn**:

| Miền | Bảng | Màn hình |
|---|---|---|
| Trắc nghiệm | `subjects` → `decks` → `questions`, `attempts`, `attempt_answers` | `/`, `/subjects/[id]`, `/quiz/[deckId]`, `/history`, `/upload` |
| Từ vựng | `vocab_decks`, `vocab_words`, `vocab_progress`, `vocab_sessions`, `vocab_mistake_entries` | `/vocab/*` |
| Lộ trình | `roadmap_days` (tĩnh), `roadmap_progress` (theo user) | `/roadmap` |

Chỉ có **thời gian học** là thống kê chung của hai miền đầu (`study_total_seconds`,
`study_seconds_by_day`) — nằm ở `src/lib/queries/stats.ts`.

## 2. Cấu trúc thư mục

```
src/
  app/
    (app)/            # nhóm route cần đăng nhập, bọc bởi AppChrome (layout.tsx)
    api/              # Route Handlers — mỏng, chỉ gọi withAuth + hàm trong lib/queries
    login/            # trang đăng nhập + Server Actions (signIn/signOut)
  components/
    ui/               # nguyên tử dùng chung (Button, LinkButton, ProgressBar, Mascot)
    <miền>/           # quiz/, vocab/, roadmap/, subjects/, upload/, login/
  lib/
    api/route-helpers.ts   # withAuth, readJsonBody, toErrorResponse
    queries/               # TOÀN BỘ truy cập DB; mỗi miền một file
    supabase/              # server.ts (client theo request), middleware.ts (refresh session)
    database.types.ts      # type Database viết tay
    validate.ts, format.ts, shuffle.ts, markdown-import.ts, constants.ts
  proxy.ts            # auth gate (Next 16)
supabase/migrations/  # 0001…NNNN, chạy tuần tự
supabase/seed/        # dữ liệu tĩnh (roadmap)
```

Quy tắc đặt file:

- Alias import: `@/…` → `src/…`. **MUST** dùng alias, không dùng `../../`.
- Logic nghiệp vụ/truy vấn **MUST** nằm ở `src/lib/queries/<miền>.ts`. Route handler và Server
  Component chỉ gọi hàm ở đó, **MUST NOT** viết `supabase.from(...)` trực tiếp trong `page.tsx` hay
  `route.ts`.
- Hàm thuần (không I/O) **SHOULD** tách riêng và có test (`format.ts`, `validate.ts`,
  `markdown-import.ts`, `buildRoadmapOverview`) để dùng được cả server lẫn client.
- Component client đặt trong `src/components/<miền>/`, tên `PascalCase.tsx`, một component chính
  mỗi file. Trang (`page.tsx`) là Server Component, lấy dữ liệu rồi truyền props xuống.

## 3. Quy ước TypeScript / React

- `strict: true`. **MUST NOT** dùng `any`; ép kiểu `as unknown as T` chỉ chấp nhận ở biên nhận body
  JSON chưa xác thực (route → hàm query phải tự validate). Với nested select PostgREST, dùng
  `.returns<T>()` / `.maybeSingle<T>()` thay vì ép kiểu.
- Mặc định là Server Component. Chỉ thêm `"use client"` khi cần state/effect/event handler.
- **Hydration**: **MUST NOT** gọi `Math.random()`/`Date.now()` trong lúc render. Xáo trộn
  (`shuffled`, `shuffleInPlace` ở `lib/shuffle.ts`) **chỉ ở server hoặc trong event handler**. Mốc
  thời gian khởi tạo bằng `useState(() => new Date())`.
- `searchParams`/`params` trong page là `Promise` → `await` trước khi dùng.
- ESLint: `eslint-config-next` (core-web-vitals + typescript). `eslint-disable` chỉ dùng khi thật sự
  cần và **phải kèm lý do** (hiện có ở `react-hooks/exhaustive-deps` cho effect chạy 1 lần khi
  `done`).
- Comment: giải thích **vì sao** (bối cảnh, lỗi đã gặp, quyết định), không lặp lại code. Giữ văn phong
  hiện có — tiếng Việt, ngắn gọn, nêu hậu quả nếu làm sai.

## 4. Tầng API

### 4.1 Route Handler

- **MUST** bọc bằng `withAuth()` (`lib/api/route-helpers.ts`). Hàm này: tạo client Supabase, gọi
  `auth.getUser()` (xác minh JWT; **MUST NOT** thay bằng `getSession()`), trả 401 JSON nếu chưa đăng
  nhập, và chuẩn hoá lỗi qua `toErrorResponse`.
- Không được dựa vào `proxy.ts` để bảo vệ API — `withAuth` là lớp phòng thủ độc lập.
- Body JSON đọc bằng `readJsonBody(req)` (giới hạn 2 MB, trả 400 nếu sai). Route upload file có
  trần riêng 25 MB.
- Route giữ **mỏng**: parse → gọi hàm trong `lib/queries` → `NextResponse.json`. Mã trạng thái:
  `201` khi tạo mới, `200` khi cập nhật, `404` khi không tìm thấy, `400` khi input sai, `401` chưa
  đăng nhập.
- Hình dạng trả về: thành công `{ <tên tài nguyên>: … }` hoặc `{ ok: true }`; lỗi `{ error: string }`.

### 4.2 Lỗi

- Lỗi nghiệp vụ = class kế thừa `Error` có thuộc tính `status: number` (`RecordAttemptError`,
  `ImportDeckError`, `ImportVocabError`, `VocabSessionError`, `VocabProgressError`,
  `MistakePackError`, `RoadmapError`, `ValidationError`, `BadRequestError`). Message là câu tiếng
  Việt hiển thị thẳng cho người dùng, nên **MUST** trả được ra ngoài.
- Mọi lỗi khác (lỗi Postgres/Supabase) **MUST NOT** lộ message ra client — `toErrorResponse` log
  `console.error("[api] …")` và trả chung "Có lỗi ở hệ thống, thử lại sau nhé." (500). Trong query,
  chỉ cần `if (error) throw error;`.
- Thêm lỗi mới: tạo class có `status`, **không** cần sửa `toErrorResponse` (nó nhận mọi `Error` có
  `status` kiểu number).
- `ValidationError` (từ `validate.ts`) là lỗi tầng thấp; hàm query bắt và đổi sang lỗi miền của mình
  (xem `recordAttempt`, `recordVocabSession`).

### 4.3 Danh sách endpoint

| Method & path | Hàm | Ghi chú |
|---|---|---|
| `GET /api/subjects` | `getSubjectsWithProgress` | |
| `GET /api/decks/[id]` | `getDeckWithQuestions` | 404 nếu không có |
| `POST /api/decks/import` | `importDeck` | tối đa `MAX_QUESTIONS_PER_IMPORT` = 500 câu |
| `POST /api/decks/upload` | (inline) | multipart, ≤ 25 MB, bucket riêng tư `documents`, path `${user.id}/…` |
| `POST /api/attempts` | `recordAttempt` | server tự chấm điểm |
| `GET /api/history` | `getHistory` | tối đa `HISTORY_PAGE_SIZE` = 50 lượt |
| `POST /api/vocab/import` | `importVocabDeck` | tối đa `MAX_WORDS_PER_IMPORT` = 500 từ |
| `POST /api/vocab/progress` | `updateVocabProgress` / `gradeVocabQuizAnswer` | rẽ nhánh theo `mode` |
| `POST /api/vocab/sessions` | `recordVocabSession` | |
| `POST /api/vocab/mistakes/clear` | `clearMistakePack` | chỉ `VocabQuizRunner` gọi |
| `POST /api/roadmap/progress` | `setRoadmapProgress` | upsert theo `(user_id, day)` |
| `POST /api/toeic/results` | `recordToeicResult` | điểm tự nhập sau khi làm đề Zenlish; `total` phải khớp `question_count` nếu đề có |
| `POST /api/toeic/progress` | `setToeicLessonProgress` | upsert theo `(user_id, lesson_id)` |
| `POST /api/vocab/inbox` | `addInboxItem` | ghi 1 từ vào Sổ ghi nhanh (≤ 300 ký tự) |
| `POST /api/vocab/inbox/processed` | `markInboxProcessed` | đánh dấu đã xử lý, tối đa 500 id/lần |

Thêm endpoint mới → cập nhật bảng này.

## 5. Nguyên tắc dữ liệu (không được phá)

1. **Không tin client.** Điểm, đúng/sai, thời lượng, `user_id` đều do server/DB tính.
   - Chấm trắc nghiệm: so `selected_option` với `questions.correct_option` trong DB, kiểm tra mọi
     `question_id` tồn tại và thuộc đúng `deck_id`.
   - Chấm quiz từ vựng: `gradeVocabQuizAnswer` so `picked` với `vocab_words.vi` trong DB.
   - Thời lượng: client chỉ gửi `started_at`/`finished_at`; `parseSessionWindow` kiểm tra ISO hợp lệ,
     `finished_at` không ở tương lai (sai số 60 s), `finished ≥ started`, rồi tự tính
     `durationSeconds` và **kẹp ≤ `MAX_SESSION_SECONDS`** (4 giờ).
   - Số đếm: `toCount()` (nguyên, không âm, từ chối null/""/NaN); `correct_count ≤ word_count`.
   - `user_id` của `roadmap_progress` lấy từ `default auth.uid()` ở DB, không nhận từ body.
2. **Ghi nhiều bảng phải atomic** → hàm plpgsql gọi bằng `supabase.rpc()` (`import_deck`,
   `import_vocab_deck`, `record_attempt`). **MUST NOT** ghi nhiều bước từ app khi phải cùng thành
   công hoặc cùng thất bại.
3. **Cộng dồn / lọc theo ngày làm ở Postgres** (`study_total_seconds`, `study_seconds_by_day`,
   `vocab_deck_stats`, `vocab_words_with_progress`, `apply_vocab_progress`, `attempt_summary`).
   **MUST NOT** tải cả bảng về rồi reduce/filter ở JS. Phép đọc–cộng–ghi **MUST** nằm trong một câu
   lệnh `on conflict do update` (tránh mất lượt đếm khi 2 request chồng nhau).
4. **Múi giờ Việt Nam.** "Hôm nay" = `app_today()` (SQL) / `appToday()` (`stats.ts`),
   `APP_TIMEZONE = "Asia/Ho_Chi_Minh"`. **MUST NOT** dùng ngày UTC (00:00–07:00 sáng sẽ bị tính là
   hôm qua). Khi parse `YYYY-MM-DD` thành `Date`, ghép `T00:00:00` để không bị lùi ngày.
5. **Giới hạn kích thước.** Mọi đường nhập đều có trần (2 MB body, 25 MB file, 500 câu/từ mỗi lần
   import, 500 ký tự ghi chú roadmap). Thêm đường nhập mới → đặt trần tương tự.
6. **Trộn thứ tự ở server**, không gửi cả "pool" xuống client chỉ để bốc ngẫu nhiên (xem
   `getVocabQuizItems`, `attachQuizOptions`).

## 6. Supabase & phân quyền

- **Client**: `lib/supabase/server.ts#createClient()` (đã bọc `cache()` → 1 client/request). Mọi
  query chạy dưới session người dùng, tức là dưới **RLS**. Service-role key hiện **không** được
  code dùng; **MUST NOT** thêm đường dùng nó ở phía request của người dùng.
- **Proxy** (`src/proxy.ts` → `lib/supabase/middleware.ts#updateSession`): refresh session, chưa
  đăng nhập → redirect `/login?next=…` (route `/api/*` → 401 JSON, **không** redirect). Công khai
  chỉ có `/login*` và `/api/auth*`. Đã đăng nhập mà vào `/login` → về `/`.
- **RLS** khoá theo `is_app_owner()` (bảng `app_owners`, `security definer`,
  `set search_path = public`), **không** theo `auth.role() = 'authenticated'`. Bảng mới **MUST**:
  `enable row level security` + policy `for all using (is_app_owner()) with check (is_app_owner())`.
  Riêng dữ liệu theo người dùng (`roadmap_progress`) kiểm cả `user_id = auth.uid()` lẫn
  `is_app_owner()`.
- Hàm SQL mới dùng `security invoker` (để RLS còn hiệu lực) trừ khi buộc phải bỏ qua RLS (như
  `is_app_owner`, `snapshot_vocab_data`) — khi đó **MUST** `set search_path = public`.
- Đăng nhập: Server Action `signIn` chỉ trả về **mã lỗi cố định** (`invalid_credentials`,
  `rate_limited`, `unknown`) qua query string, trang login tự dịch; **MUST NOT** đẩy
  `error.message` thô của Supabase vào URL/UI. `next` **MUST** qua `safeNextPath` (chặn open
  redirect: phải bắt đầu `/` và không `//`).
- Không có đăng ký công khai; tắt "Allow new users to sign up" trên Supabase (việc thủ công).

## 7. Migration

- File `supabase/migrations/NNNN_mo_ta.sql`, số tăng liên tục (hiện đến `0020`). **MUST NOT** sửa
  migration đã chạy; sửa schema = tạo migration mới.
- Mở đầu mỗi file là comment tiếng Việt nêu **lý do** thay đổi (xem `0016`).
- Viết idempotent khi được (`if not exists`, `create or replace`, `drop … if exists`). Đổi chữ ký
  hàm (kiểu trả về/tham số) phải `drop function` trước (xem `0014`).
- Sau khi đổi schema hoặc hàm RPC: **cập nhật tay** `src/lib/database.types.ts` (bảng `Tables` và
  `Functions`) — file này viết tay, không sinh tự động.
- Dữ liệu từ vựng được bảo vệ bởi `protect_vocab_table()` (chặn `TRUNCATE` và xoá > 20 dòng/lệnh) +
  snapshot hằng ngày vào `vocab_backups`. Muốn xoá hàng loạt có chủ đích: trong cùng transaction
  chạy `set local app.allow_destructive_vocab_ops = 'yes';`. **MUST NOT** thêm đường xoá
  `vocab_words`/`vocab_decks` vào ứng dụng. Bảng vòng đời ngắn như `vocab_mistake_entries` thì cố ý
  *không* gắn trigger này.
- Hằng số lặp giữa SQL và TS **phải đổi cả hai nơi cùng lúc**: gói từ sai = 50 dòng
  (`VOCAB_MISTAKE_PACK_SIZE` ↔ `record_mistake_entry` trong `0016`); số ngày roadmap = 48
  (`ROADMAP_TOTAL_DAYS` ↔ seed `roadmap-2-thang-dau.json`); giới hạn TOEIC/Sổ ghi nhanh
  (`TOEIC_MAX_QUESTIONS` = 200, `TOEIC_NOTE_MAX` = 500, `INBOX_TEXT_MAX` = 300, `INBOX_CONTEXT_MAX` = 500,
  `INBOX_SOURCE_MAX` = 80 ↔ check constraint trong `0018`).
- Nội dung TOEIC (`0019`) và 23 bộ từ TOEIC (`0020`) **sinh từ** `supabase/seed/toeic/*.json` —
  sửa nội dung thì sửa JSON rồi sinh lại migration mới (upsert theo khoá), không sửa tay `0019`.

## 8. Quy tắc nghiệp vụ theo miền

### 8.1 Trắc nghiệm

- Chỉ 1 dạng: nhiều lựa chọn, **đúng 1 đáp án** (`options: string[]`, `correct_option: index`).
  Validate khi import: ≥ 2 lựa chọn, `correct_option` trong `[0, options.length)`, `prompt` không
  rỗng.
- Nhãn lựa chọn dùng `optionLetter(i)` (A, B, …, tới Z) — không dùng mảng cứng.
- `computeScore(correct, total)` = `round(correct/total*100)/10` (thang 10, 1 chữ số thập phân);
  `total ≤ 0` → 0. `formatScore` dùng `toFixed(1)`.
- Tiến độ môn = số deck có ≥ 1 attempt / tổng deck. Số lượt & điểm TB toàn lịch sử lấy từ RPC
  `attempt_summary` (không reduce trên 50 dòng đầu).
- `importDeck`: nhận `subject_id` *hoặc* `subject_name` (tìm không phân biệt hoa/thường, chưa có thì
  tạo, `subject_category` mặc định `school`; giá trị: `school | data_ai | toeic`).

### 8.2 Từ vựng

- **Leitner**: box 0–5, `next_review` lần lượt +0/1/2/4/7/15 ngày; đúng → tăng box (tối đa 5), sai →
  về box 1. Tính hết trong `apply_vocab_progress`.
- **Flashcard** (`mode: "flashcard"`) là tự đánh giá → tin `know` của người dùng, **không** ghi kho
  từ sai. **Quiz** (`mode: "quiz"`) → server chấm; sai thì `record_mistake_entry`. Lỗi ghi kho từ sai
  chỉ `console.error`, **không** làm hỏng việc chấm (tính năng phụ).
- **Ôn hôm nay** (`scope=due`, không `deckId`) tối đa `DAILY_REVIEW_LIMIT` = 100 từ/phiên; ôn đúng 1
  bộ (`deckId`) thì không giới hạn. Số trên nút ở `/vocab` **phải khớp** giới hạn này.
- **Quiz** cần ≥ `VOCAB_QUIZ_OPTION_COUNT` (4) từ, nếu không `notFound()`. Mỗi câu = 1 đáp án đúng +
  3 nhiễu; ưu tiên `distractors` soạn tay, không có thì bốc ngẫu nhiên nghĩa từ khác trong toàn kho.
  Quiz gói từ sai không yêu cầu ≥ 4 từ.
- **Kho từ sai**: mỗi lần sai = **1 dòng mới** (không gộp, không reset theo thời gian). Gộp thành gói
  50 dòng; gói hiện tại đầy mới mở gói kế (advisory lock chống race). Gói **chỉ bị xoá** khi ôn
  **đúng 100%** cả gói trong 1 lượt (kể cả dòng trùng từ) — `VocabQuizRunner` là nơi *duy nhất* gọi
  `POST /api/vocab/mistakes/clear`. **MUST NOT** thêm nút xoá tay.
- **Số lần đã học** của bộ = số phiên hoàn thành có `vocab_sessions.deck_id` đó, cộng dồn vĩnh viễn.
  Chỉ gắn `deck_id` khi mở từ đúng 1 bộ; các phiên đa bộ ("Ôn hôm nay", "Quiz tất cả từ", ôn gói) để
  `deck_id = null`. Màu vòng tròn theo `dueCount`, số trong vòng ưu tiên `completedCount`.
- Import từ vựng: mỗi từ cần `en` và `vi` không rỗng; `example` rỗng → `null`; `distractors` rỗng →
  `null`.

### 8.2b Lưu & xem lại kết quả

- Mọi phiên làm xong **MUST** lưu được và xem lại được: trắc nghiệm qua `attempts` +
  `attempt_answers` (`/history` → trang kết quả), từ vựng qua `vocab_sessions.answers` (snapshot
  `en/vi/picked/correct`, `/vocab/history`). **MUST NOT** thêm job xoá/dọn dữ liệu theo thời gian
  vào các bảng này. Danh sách lịch sử **MUST** phân trang chứ không cắt cụt.
- Ghi phiên từ client dùng `postJsonWithRetry` (`lib/client/post-json.ts`), không `fetch` một lần.
- Phiên làm dở lưu bằng `useSaveOnLeave` (`lib/client/use-save-on-leave.ts`) với `completed=false`; mọi thống kê so sánh (điểm TB, điểm cao nhất, tiến độ môn, số lần đã học) **MUST** chỉ tính `completed = true`.
- Ngoại lệ có chủ đích: Kho từ sai chỉ ghi câu sai (đúng thì bỏ qua).

### 8.3 Lộ trình

- 48 ngày = 8 tuần × 6 ngày (nghỉ Chủ nhật), chia Tháng 1/2. Không khoá tuyến tính (tick ngày bất kỳ).
- `currentDay` = **ngày lớn nhất đã tick + 1** (1 nếu chưa tick) — *không* phải "ngày trống đầu tiên",
  nếu không sẽ không bao giờ có trạng thái "bỏ lỡ" (viền cam). Quy tắc này nằm trong
  `buildRoadmapOverview` (hàm thuần, dùng cả server lẫn client sau khi tick lạc quan).
- `day` ∈ [1, 48] nguyên; `note` cắt còn 500 ký tự, rỗng → `null`.
- `roadmap_days` chỉ đọc (có trigger chống xoá hàng loạt), seed một lần từ file JSON.

### 8.3b TOEIC theo sách Zenlish

- 6 sách (`toeic_books`: Foundation, Beginner, Camp Bomb LC/RC, Submarine LC/RC) → bài
  (`toeic_lessons`, id `<book>-NN`) → đề (`toeic_quizzes`, khoá = slug Zenlish). Ba bảng này là nội
  dung tĩnh: chỉ đọc qua RLS, có trigger chống xoá hàng loạt.
- App **không** nhúng/sao chép đề: link mở `https://zenlishtoeic.vn/stm-quizzes/<slug>/` ở tab mới
  (`zenlishQuizUrl`). Làm xong người học tự nhập điểm → `toeic_quiz_results` (append-only, nhiều lần).
- Quy tắc đối chiếu đã kiểm: trên web "RC k" của Camp Bomb/Submarine = **Lesson k của sách Đọc**
  ("Lesson N" trong slug là số buổi học chung LC/RC, không phải số bài sách).
- Bài hiện tại = **bài lớn nhất đã đánh dấu xong + 1** (`currentLessonNo`), cùng logic 8.3.
- Thống kê đề (lần làm, điểm gần nhất, tốt nhất) cộng dồn ở Postgres bằng `toeic_quiz_stats()`.
- Tiến trình/kết quả/Sổ ghi nhanh tách theo `user_id` như `roadmap_progress`.

### 8.3c Sổ ghi nhanh từ mới (`vocab_inbox`)

- Ghi thô (`raw_text` + câu gốc + nguồn), **không** tạo `vocab_words` trực tiếp: cuối tuần copy
  (`formatInboxForClaude`) sang Claude chuẩn hoá thành `từ | nghĩa | ví dụ`, nhập qua `/vocab/import`
  (luôn tạo bộ mới), rồi đánh dấu `processed_at`. Không có đường xoá trong app.

### 8.4 Import Markdown

Parser dùng chung ở `lib/markdown-import.ts` cho cả trắc nghiệm và từ vựng; có test. Quy tắc:

- Tiêu đề bắt buộc: dòng `# Tên`. Mục đánh số `1.` hoặc `1)`. Lựa chọn `A.` hoặc `A)` (mọi chữ cái,
  ≥ 2 lựa chọn với trắc nghiệm). Nhãn hỗ trợ cả tiếng Việt: `Đáp án`, `Giải thích`, `Nghĩa`, `Ví dụ`.
- `Answer` nhiều chữ cái ("D, E") → chỉ lấy chữ cái **đầu tiên** (DB chỉ có 1 đáp án đúng).
- Lỗi parse ném `MarkdownParseError` với message tiếng Việt chỉ rõ số câu/mục.
- Đổi định dạng → cập nhật test trong `markdown-import.test.ts` **và** mục "Import bằng Markdown"
  trong README.

## 9. Giao diện

- **Design token** nằm ở `globals.css` (`:root` + `@theme inline`): `bg`, `yellow`, `orange`, `green`,
  `ink`, `ink-muted`, `ink-faint`, `border`, `track`… Dùng utility Tailwind theo token
  (`bg-yellow`, `text-ink-muted`, `border-border`). **MUST NOT** hard-code màu mới; thêm màu = thêm
  token ở *cả* `:root` và `@theme inline`. (Ngoại lệ hiện có: màu bóng/viền nút trong
  `button-styles.ts`.)
- **Font**: `font-display` (Baloo 2) cho tiêu đề/nút, `font-body` (Nunito) cho nội dung. Cả hai có
  subset `vietnamese`.
- **Nút**: dùng `Button` / `LinkButton` (variant `solid | ghost | danger`, size `sm | md | lg`) — kiểu
  3D viền dày + bóng đặc, lún khi `:active`. **MUST NOT** tự viết nút kiểu khác.
- Thanh tiến độ: `ProgressBar` (tự kẹp 0–100). Linh vật: `Mascot`.
- Khung trang: `max-w-[1160px] mx-auto px-5 py-6 pb-10` (trang hẹp hơn: quiz/roadmap dùng
  `max-w-[720px]`). Tiêu đề trang `font-display font-extrabold text-[28px]`; mô tả phụ
  `font-bold text-sm text-ink-muted`.
- Trạng thái rỗng: khung `border border-dashed border-border-dashed rounded-2xl p-5 text-center` kèm
  link đến nơi tạo dữ liệu.
- `AppChrome` ẩn header/nav khi đang làm bài (`/quiz/*` trừ `/result`, `/vocab/flashcard`,
  `/vocab/quiz`). Thêm màn hình "toàn màn" → cập nhật `hideChrome`. Thêm mục nav → sửa `NAV_ITEMS`
  (thanh dưới mobile hiện `grid-cols-6` cho 6 mục — thêm mục thứ 7 phải chỉnh lại).
- **Mobile-first / iPhone PWA**: `viewport-fit=cover`; vùng an toàn dùng `env(safe-area-inset-*)`.
  Mọi UI phải dùng được ở ≥ 320 px.
- `input[type="file"]` bị ẩn toàn cục (CSS) → phải có nút/label kích hoạt riêng.

## 10. Quy ước phía client (component chạy phiên học)

Áp dụng cho `QuizRunner`, `FlashcardRunner`, `VocabQuizRunner`, `RoadmapPath`:

- **Phản hồi lạc quan**: hiện kết quả ngay bằng dữ liệu có sẵn ở client, rồi mới gọi API. Lỗi mạng khi
  lưu tiến trình/phiên được **nuốt có chủ đích** (comment nêu lý do) — không chặn người học.
  Ngoại lệ phải hiện lỗi và cho thử lại: nộp bài trắc nghiệm (`QuizRunner` có `submitError`) vì mất
  kết quả là mất cả lượt làm.
- Ghi phiên học **đúng 1 lần** khi hoàn thành, bảo vệ bằng `useRef` (`sessionSavedRef`) — không dựa
  vào state vì effect có thể chạy lại.
- Gọi API bằng `fetch` + `Content-Type: application/json`; đọc `body.error` khi `!res.ok`.
- Kết quả cuối (đúng/sai, điểm) **luôn** lấy từ server khi liên quan dữ liệu lưu (xem 5.1); UI chỉ tính
  tạm để hiển thị tức thì.

## 11. Kiểm thử

- Vitest, môi trường `node`, chỉ chạy `src/**/*.test.ts` (không có môi trường DOM).
- Có test cho: `format`, `validate`, `markdown-import`. Logic thuần mới (parser, validator, hàm
  tính toán) **MUST** kèm test cùng thư mục, tên `<file>.test.ts`.
- Không có test cho tầng query/DB hay component; thay bằng kiểm tra tay. Khi sửa luật ở SQL (Leitner,
  gói từ sai, thống kê ngày) **SHOULD** nêu rõ cách đã kiểm tra trong commit/PR.
- Trước khi coi là xong: `npm run lint`, `npm test`, `npm run build` (build chạy type-check của
  Next) đều phải sạch.

## 12. Quy trình commit

- Commit message **tiếng Việt**, ngắn, động từ đứng đầu, mô tả thay đổi hành vi
  (vd. "Giới hạn "Ôn hôm nay" tối đa 100 từ/phiên…"). Một commit = một thay đổi nhất quán.
- Đổi hành vi người dùng thấy được → cập nhật README (phần mô tả tính năng) và file này nếu đụng
  quy tắc.
- Env cần: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (bắt buộc),
  `SUPABASE_SERVICE_ROLE_KEY` (hiện chưa dùng). **MUST NOT** commit `.env*`.

## 13. Checklist khi thêm tính năng

1. Schema: viết migration mới (RLS owner, index, ràng buộc `check`) → cập nhật `database.types.ts`.
2. Nếu ghi nhiều bảng hoặc cộng dồn → hàm plpgsql + `rpc()`; nếu không → query thường.
3. Hàm query + class lỗi (có `status`) trong `lib/queries/<miền>.ts`; validate mọi input, đặt trần kích
   thước, **không tin client**.
4. Route handler mỏng với `withAuth`; cập nhật bảng endpoint (mục 4.3).
5. Page (Server Component) lấy dữ liệu → component client nếu cần tương tác; dùng token màu và
   `Button`/`LinkButton`.
6. Test cho logic thuần; chạy lint + test + build.
7. Cập nhật README/SPEC.

## 14. Nợ kỹ thuật & điểm cần lưu ý (phát hiện khi rà soát)

Chưa sửa; ghi lại để tránh hiểu nhầm hoặc xử lý khi có dịp.

| # | Vấn đề | Vị trí | Gợi ý |
|---|---|---|---|
| 1 | Comment `currentDay` ghi "ngày đầu tiên chưa tick", **ngược** với code (ngày lớn nhất đã tick + 1) | `queries/roadmap.ts` (interface `RoadmapOverview`) | Sửa comment theo mục 8.3 |
| 2 | Comment `deck_id` còn nhắc "Từ sai tuần này" (tính năng đã thay bằng Kho từ sai ở `0016`) | `queries/vocab.ts` (`RecordVocabSessionInput`) | Cập nhật tên |
| 3 | README ghi "9 route handler" và đề cập `.env.example`; thực tế có 12 route và **không có** `.env.example` | `README.md` | Cập nhật số / thêm file mẫu |
| 4 | 7 class lỗi giống hệt nhau (`message` + `status`) lặp ở nhiều file | `queries/*`, `validate.ts`, `route-helpers.ts` | Gom về 1 `HttpError(message, status)` dùng chung |
| 5 | Hằng số 50 (gói từ sai) và 48 (ngày roadmap) lặp giữa SQL và TS | `0016`, `queries/vocab.ts`, `queries/roadmap.ts` | Giữ đồng bộ thủ công (mục 7) hoặc truyền qua tham số |
| 6 | `clearMistakePack` không tự xác minh "đã đúng 100%" — tin luồng gọi từ client | `queries/vocab.ts` | Chấp nhận được với app 1 người dùng; nếu mở rộng cần kiểm tra ở server |
| 7 | `getMeaningPool` tải toàn bộ cột `vi` của kho cho mỗi lần dựng quiz | `queries/vocab.ts` | Cân nhắc RPC lấy ngẫu nhiên N nghĩa khi kho lớn |
| 8 | `getSubjectsWithProgress` tải toàn bộ `attempts` (chỉ `deck_id, score, created_at`) rồi lọc ở JS — trái nguyên tắc 5.3 khi lịch sử lớn | `queries/subjects.ts` | Chuyển sang RPC/aggregate |
| 9 | `getHistory` gọi tuần tự 2 lượt (decks rồi subjects) có thể gộp bằng nested select | `queries/attempts.ts` | Dùng `select("*, deck:decks(title, subject:subjects(name))")` |
| 10 | Chưa có test cho tầng query và component; `lint`/`test`/`build` chưa chạy trong lần rà soát này vì `node_modules` chưa cài | — | `npm install` rồi chạy kiểm tra |
| 11 | Màu bóng/viền nút hard-code ngoài token | `ui/button-styles.ts` | Đưa vào token nếu thêm variant mới |
| 12 | `package.json` lock `next@16.3.4`, `vitest@^5` — API có thể khác tài liệu quen thuộc | — | Đọc docs trong `node_modules` khi nghi ngờ |
