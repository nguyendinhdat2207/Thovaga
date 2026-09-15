-- "Lộ trình 2 tháng đầu" — checklist 48 ngày (8 tuần × 6 ngày, nghỉ Chủ nhật),
-- chia Tháng 1 (24 ngày) / Tháng 2 (24 ngày). Nội dung tĩnh (đề bài, checkpoint)
-- tách khỏi tiến trình tick của người dùng, đúng tinh thần "questions" (tĩnh)
-- vs "attempts" (động) đã dùng cho phần trắc nghiệm.

create table if not exists roadmap_days (
  day int primary key,
  month int not null,
  week int not null,
  week_title text not null,
  memo text not null,
  tasks jsonb not null,
  checkpoint text not null
);

-- roadmap_progress tách theo user_id (khác các bảng khác trong app, vốn dùng
-- chung 1 bộ dữ liệu cho toàn bộ chủ sở hữu qua is_app_owner()): lộ trình học
-- là tiến trình CÁ NHÂN, nếu sau này có người dùng thứ hai (xem app_owners),
-- mỗi người cần tiến trình tick riêng, không lẫn vào nhau.
create table if not exists roadmap_progress (
  user_id uuid not null default auth.uid(),
  day int not null references roadmap_days(day) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists roadmap_progress_user_idx on roadmap_progress(user_id);

alter table roadmap_days enable row level security;
alter table roadmap_progress enable row level security;

-- roadmap_days là nội dung tĩnh (đề bài) — chỉ đọc, không cho client tự
-- sửa/xoá qua API (giống cách questions không có policy insert/update/delete
-- cho client thường).
create policy "owner read roadmap_days" on roadmap_days
  for select using (is_app_owner());

-- roadmap_progress: chỉ thấy/sửa được tiến trình CỦA CHÍNH MÌNH, và vẫn phải
-- là chủ sở hữu app (is_app_owner()) — hai điều kiện cộng lại, không phải một
-- người dùng Supabase bất kỳ nào cũng chạm được vào bảng này.
create policy "own roadmap_progress" on roadmap_progress
  for all
  using (user_id = auth.uid() and is_app_owner())
  with check (user_id = auth.uid() and is_app_owner());

-- Áp cùng cơ chế khoá chống xoá hàng loạt đã dùng cho dữ liệu từ vựng
-- (protect_vocab_table(), migration 0012) — 48 ngày nội dung đã dọn tay kỹ,
-- không có lý do gì để mất sạch vì 1 migration/SQL chạy nhầm sau này.
drop trigger if exists protect_delete on roadmap_days;
create trigger protect_delete after delete on roadmap_days
  referencing old table as old_rows
  for each statement execute function protect_vocab_table();

drop trigger if exists protect_truncate on roadmap_days;
create trigger protect_truncate before truncate on roadmap_days
  for each statement execute function protect_vocab_table();

-- Seed 48 ngày từ supabase/seed/roadmap-2-thang-dau.json (đã sửa lỗi mã hoá
-- UTF-8 của file gốc). Dùng upsert để chạy lại migration này an toàn.
insert into roadmap_days (day, month, week, week_title, memo, tasks, checkpoint) values
(1,1,1,'SQL cơ bản, Python, Linux','Cài PostgreSQL + Docker. Rà lại CV.','["Sáng: Cài Docker Desktop – chạy PostgreSQL bằng container. Cài DBeaver hoặc pgAdmin. Nạp sample database `dvdrental`.","Chiều: Rà CV – mở BrainWatch, TCB Direction, FireBite, UniHybrid, viết ra giấy chính xác mình tự tay làm phần nào.","Tối: Làm 1 đề TOEIC chuẩn đoán đầy đủ, ghi lại điểm."]','Kết nối được vào database và chạy được `SELECT 1;`'),
(2,1,1,'SQL cơ bản, Python, Linux','[LS] chương 1–3 · SELECT, FROM, cột dẫn xuất','["Sáng: `[LS]` ch.1 (Background), ch.2 (Creating and Populating a Database), ch.3 (Query Primer)","Chiều: `[PDA]` ch.2 Python Language Basics – lướt nhanh phần đã biết từ JS, chú ý indentation, `None`, không có `let/const`","Tối: TOEIC – phân tích lỗi sai của đề chuẩn đoán, xác định yếu Listening hay Reading"]','Viết được `SELECT` có alias, cột tính toán, `DISTINCT`'),
(3,1,1,'SQL cơ bản, Python, Linux','[LS] chương 4 · WHERE, các toán tử lọc','["Sáng: `[LS]` ch.4 (Filtering) – `=`, `<>`, `IN`, `BETWEEN`, `LIKE`, `IS NULL`, `AND/OR/NOT`","Chiều: `[PDA]` ch.3 Built-in Data Structures – list, tuple, dict, set, list comprehension","Tối: TOEIC Part 5 + bắt đầu thói quen 30 từ/ngày (Anki, tự tạo deck)"]','Giải thích được vì sao `NULL = NULL` cho kết quả không phải TRUE'),
(4,1,1,'SQL cơ bản, Python, Linux','Linux terminal · điều hướng, quyền, pipe','["Sáng: `[LS]` làm lại toàn bộ bài tập cuối ch.3 và ch.4, không nhìn đáp án","Chiều: Linux – `cd`, `ls`, `pwd`, `mkdir`, `rm`, `cp`, `mv`, `cat`, `head`, `tail`, `grep`, `find`, `chmod`, pipe `|`, redirect `>` `>>`","Nguồn: *The Linux Command Line* (linuxcommand.org, miễn phí) phần 1–2","Tối: TOEIC"]','Di chuyển và thao tác file hoàn toàn bằng terminal, không dùng GUI'),
(5,1,1,'SQL cơ bản, Python, Linux','[LS] chương 5 · JOIN nhiều bảng','["Sáng: `[LS]` ch.5 (Querying Multiple Tables) – INNER JOIN, join 3 bảng, self join","Chiều: `[PDA]` ch.2 phần function, scope; viết script Python đọc file CSV, xử lý, ghi ra file mới","Tối: TOEIC"]','Viết được query JOIN 3 bảng không cần tra cú pháp'),
(6,1,1,'SQL cơ bản, Python, Linux','[LS] chương 6 · UNION, INTERSECT, EXCEPT','["Sáng: `[LS]` ch.6 (Working with Sets) – `UNION` vs `UNION ALL`, hiểu vì sao `UNION ALL` nhanh hơn","Chiều: Bắt đầu đọc lướt `[FDE]` phần I (Foundation and Building Blocks) – chưa cần hiểu hết, chỗ để có khung","Tối: TOEIC"]','Chốt tuần: có CV đã sửa đúng thực tế; viết được query lọc + JOIN không tra tài liệu'),
(7,1,2,'Aggregate, subquery, Docker','[LS] chương 8 · GROUP BY, HAVING','["Sáng: `[LS]` ch.8 (Grouping and Aggregates) – `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP BY`, `HAVING`","Chiều: `[PDA]` ch.4 NumPy Basics – array, indexing, slicing, broadcasting","Tối: TOEIC"]','Giải thích được vì sao `WHERE` lọc trước `GROUP BY` còn `HAVING` lọc sau'),
(8,1,2,'Aggregate, subquery, Docker','Thứ tự thực thi SQL · FROM→WHERE→GROUP BY→HAVING→SELECT→ORDER BY','["Sáng: Học kỹ thứ tự thực thi thật. Tự trả lời: vì sao không dùng được alias của `SELECT` trong `WHERE` nhưng dùng được trong `ORDER BY`?","Chiều: `[PDA]` ch.5 Getting Started with pandas – Series, DataFrame","Tối: TOEIC"]','Vẽ được sơ đồ thứ tự thực thi từ trí nhớ'),
(9,1,2,'Aggregate, subquery, Docker','[LS] chương 9 · Subquery','["Sáng: `[LS]` ch.9 (Subqueries) – subquery trong `WHERE`, trong `FROM`, correlated subquery","Chiều: `[PDA]` ch.6 Data Loading – đọc/ghi CSV, JSON","Tối: TOEIC"]','Phân biệt được subquery thường và correlated subquery, biết cái nào chậm hơn và vì sao'),
(10,1,2,'Aggregate, subquery, Docker','Docker · image, container, compose','["Sáng: `[LS]` ch.10 (Joins Revisited) – outer join, cross join","Chiều: Docker – image khác container, Dockerfile cơ bản, `docker-compose.yml`, volume, network","Nguồn: Docker official \"Get Started\" + kênh TechWorld with Nana","Thực hành: viết `docker-compose.yml` chạy PostgreSQL + pgAdmin cùng lúc","Tối: TOEIC"]','Dựng được 2 service bằng một lệnh `docker compose up`'),
(11,1,2,'Aggregate, subquery, Docker','[LS] chương 11 + 7 · CASE WHEN, hàm xử lý chuỗi/số/ngày','["Sáng: `[LS]` ch.11 (Conditional Logic) và ch.7 (Data Generation, Manipulation, Conversion)","Chiều: `[PDA]` ch.7 Data Cleaning – xử lý missing data, đổi kiểu dữ liệu","Tối: TOEIC – làm đề full test #1"]','Dùng `CASE WHEN` để phân nhóm dữ liệu trong `SELECT` và trong `GROUP BY`'),
(12,1,2,'Aggregate, subquery, Docker','Ôn tuần 2 · làm lại toàn bộ bài tập ch.8–11','["Sáng: Làm lại bài tập `[LS]` ch.8 đến ch.11, không nhìn đáp án","Chiều: `[PDA]` ch.8 Data Wrangling – merge, join, concat (đối chiếu trực tiếp với SQL JOIN)","Tối: TOEIC"]','Chốt tuần: làm cùng một phép tính bằng cả SQL lẫn Pandas, thấy được hai cách tương đương'),
(13,1,3,'Window function, Pandas nâng cao','[LS] chương 16 · Analytic/Window functions – phần được hỏi nhiều nhất khi phỏng vấn','["Sáng: `[LS]` ch.16 (Analytic Functions) phần đầu – khái niệm `OVER()`, `PARTITION BY`, `ORDER BY` trong window","Chiều: `[PDA]` ch.10 Data Aggregation and Group Operations","Tối: TOEIC"]','Hiểu được window function khác `GROUP BY` ở chỗ nào (không gộp dòng)'),
(14,1,3,'Window function, Pandas nâng cao','ROW_NUMBER, RANK, DENSE_RANK – phân biệt ba cái','["Sáng: `[LS]` ch.16 phần ranking functions. Viết query \"top 3 mỗi nhóm\".","Chiều: Tiếp `[PDA]` ch.10 – `groupby` nâng cao, `agg`, `transform`","Tối: TOEIC"]','Nêu được kết quả khác nhau của 3 hàm khi có giá trị trùng'),
(15,1,3,'Window function, Pandas nâng cao','LAG, LEAD, SUM() OVER – so sánh dòng trước/sau','["Sáng: `[LS]` ch.16 phần còn lại – `LAG`, `LEAD`, running total bằng `SUM() OVER`","Chiều: `[PDA]` ch.11 Time Series (đọc lướt) – đủ để hiểu dữ liệu theo thời gian","Tối: TOEIC"]','Tính được \"chênh lệch so với dòng trước\" và \"tổng lũy kế\" bằng window function'),
(16,1,3,'Window function, Pandas nâng cao','Git · commit, branch, merge. Tạo repo project.','["Sáng: `[LS]` ch.14 (Views) và ch.15 (Metadata) – đọc nhanh","Chiều: Git – `init`, `add`, `commit`, `push`, `pull`, `branch`, `merge`, xử lý conflict","Nguồn: *Pro Git* (git-scm.com/book, miễn phí) chương 1–3","Thực hành: tạo repo GitHub cho project fraud detection, commit script đầu tiên","Tối: TOEIC"]','Có repo trên GitHub, đã push được code'),
(17,1,3,'Window function, Pandas nâng cao','Tải PaySim · EDA đầu tiên bằng Pandas','["Sáng: Ôn window function – viết lại 5 query từ trí nhớ","Chiều: Tải PaySim (kaggle.com/datasets/ealaxi/paysim1). EDA bằng Pandas: tỉ lệ fraud, phân bố theo `type`, thống kê `amount`","Tối: TOEIC – đề full test #2"]','Hiểu rõ từng cột của PaySim, biết tỉ lệ fraud là bao nhiêu'),
(18,1,3,'Window function, Pandas nâng cao','Ôn tuần 3 · làm 10 câu DataLemur mức Easy/Medium','["Sáng: 10 câu DataLemur hoặc LeetCode Database, viết ra giấy trước khi gõ máy","Chiều: Load PaySim vào PostgreSQL bằng Python (psycopg2 hoặc SQLAlchemy)","Tối: TOEIC"]','Chốt tuần: PaySim đã nằm trong PostgreSQL, query được bằng SQL'),
(19,1,4,'Thiết kế database, index, transaction','[LS] chương 12 · Transaction, ACID','["Sáng: `[LS]` ch.12 (Transactions) – `COMMIT`, `ROLLBACK`, `SAVEPOINT`, khái niệm ACID","Chiều: `CREATE TABLE`, kiểu dữ liệu, constraint: `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT`","Tối: TOEIC"]','Giải thích được ACID bằng ví dụ chuyển tiền'),
(20,1,4,'Thiết kế database, index, transaction','Chuẩn hóa 1NF, 2NF, 3NF – và khi nào cố tình phá chuẩn','["Sáng: Học chuẩn hóa. Tự thiết kế schema cho một bài toán quản lý giao dịch đơn giản.","Chiều: Vẽ ERD bằng draw.io cho schema vừa thiết kế","Tối: TOEIC"]','Chỉ ra được một bảng đang vi phạm 3NF và cách tách ra'),
(21,1,4,'Thiết kế database, index, transaction','[LS] chương 13 · Index – khi nào giúp, khi nào làm chậm','["Sáng: `[LS]` ch.13 (Indexes and Constraints) – B-tree, index trên nhiều cột","Chiều: Thực hành trên PaySim trong PostgreSQL: đo thời gian query trước và sau khi thêm index","Tối: TOEIC"]','Có số liệu thật: query X giây trước, Y giây sau khi thêm index'),
(22,1,4,'Thiết kế database, index, transaction','EXPLAIN ANALYZE · đọc execution plan','["Sáng: PostgreSQL docs, mục \"Using EXPLAIN\" – đọc hết, ngắn thôi","Chiều: Chạy `EXPLAIN ANALYZE` trên các query PaySim. Nhận diện sequential scan và index scan.","Tối: TOEIC"]','Nhìn execution plan chỉ ra được query nào đang thiếu index'),
(23,1,4,'Thiết kế database, index, transaction','Script ETL đầu tiên · CSV – Pandas – PostgreSQL','["Sáng: Ôn – 10 câu DataLemur","Chiều: Viết script ETL hoàn chỉnh: đọc PaySim CSV – làm sạch bằng Pandas – ghi vào PostgreSQL. Push lên GitHub kèm README.","Tối: TOEIC"]','Script chạy được từ đầu đến cuối bằng một lệnh'),
(24,1,4,'Thiết kế database, index, transaction','Chốt tháng 1 · làm case study 1 của 8 Week SQL Challenge','["Sáng: Danny''s Diner (case study 1 tại 8weeksqlchallenge.com) – làm hết, không nhìn đáp án","Chiều: đọc `[FDE]` phần II, chương về Data Storage và Ingestion","Tối: TOEIC – đề full test #3"]','CHỐT THÁNG 1: SQL vững · Python đủ dùng · biết Docker, Git, Linux · CV đã sửa · có script ETL trên GitHub'),
(25,2,5,'Oracle SQL','Cài Oracle 21c XE + SQL Developer','["Sáng: Cài Oracle 21c XE (hoặc dùng livesql.oracle.com nếu máy yếu). Cài SQL Developer. Nạp schema HR.","Chiều: Tạo tài khoản Oracle Dev Gym (devgym.oracle.com), làm workout \"How Good Are You at PL/SQL?\" để biết mình đang ở đâu – làm sai hết cũng không sao, đây là bài đo mốc","Tối: TOEIC"]','Kết nối được vào Oracle, query được schema HR'),
(26,2,5,'Oracle SQL','Oracle khác PostgreSQL · DUAL, ROWNUM, FETCH FIRST, NVL','["Sáng: Học các khác biệt: bảng `DUAL`, `ROWNUM` vs `FETCH FIRST`, `NVL` vs `COALESCE`, `DECODE`","Nguồn: Oracle *SQL Language Reference* (tra cứu) + Oracle Dev Gym phần SQL","Chiều: Chuyển toàn bộ query PostgreSQL tuần 1–3 sang cú pháp Oracle – cách học nhanh nhất","Tối: TOEIC"]','Nêu được 5 khác biệt cụ thể giữa Oracle và PostgreSQL'),
(27,2,5,'Oracle SQL','Hàm ngày tháng Oracle · SYSDATE, TO_DATE, ADD_MONTHS','["Sáng: `SYSDATE`, `TO_DATE`, `TO_CHAR`, `ADD_MONTHS`, `MONTHS_BETWEEN`, `TRUNC` trên ngày","Chiều: Dev Gym – làm quiz phần SQL về date functions và conversion","Tối: TOEIC"]','Viết được query nhóm giao dịch theo tháng bằng hàm Oracle'),
(28,2,5,'Oracle SQL','MERGE statement – nền cho SCD sau này','["Sáng: `MERGE` – cú pháp `WHEN MATCHED` / `WHEN NOT MATCHED`","Chiều: Thực hành `MERGE` trên bảng test: cập nhật dòng đã có, chèn dòng mới","Tối: TOEIC"]','Viết được `MERGE` hoàn chỉnh và giải thích vì sao nó thay được cặp UPDATE+INSERT'),
(29,2,5,'Oracle SQL','Load 500K dòng PaySim vào Oracle','["Sáng: Ôn – Dev Gym workout phần SQL","Chiều: Load 500 nghìn dòng PaySim vào Oracle (chưa cần cả 6,3 triệu). Viết query thống kê cơ bản.","Tối: TOEIC"]','Có dữ liệu thật trong Oracle, query được'),
(30,2,5,'Oracle SQL','Ôn tuần 5 · case study 2 (Pizza Runner)','["Sáng: Pizza Runner – 8 Week SQL Challenge case study 2, phần A và B","Chiều: đọc `[FEU]` chương Language Fundamentals – cấu trúc block PL/SQL","Tối: TOEIC – đề full test #4"]','Chốt tuần: viết được mọi query Oracle tương đương với PostgreSQL đã học'),
(31,2,6,'PL/SQL nền tảng','[FEU] Language Fundamentals · block, biến, %TYPE, %ROWTYPE','["Sáng: `[FEU]` chương Language Fundamentals – `DECLARE` / `BEGIN` / `EXCEPTION` / `END`, khai báo biến, `%TYPE`, `%ROWTYPE`","Chiều: Gõ lại toàn bộ ví dụ trong chương vào SQL Developer, chạy thật","Tối: TOEIC"]','Viết được anonymous block có biến, chạy ra kết quả bằng `DBMS_OUTPUT`'),
(32,2,6,'PL/SQL nền tảng','[FEU] Conditional Control + Loops · IF, CASE, các loại LOOP','["Sáng: `[FEU]` chương Conditional and Sequential Control và Iterative Processing with Loops","Chiều: Dev Gym – quiz về Loops in PL/SQL, The WHILE-LOOP Statement, Case Expressions","Tối: TOEIC"]','Phân biệt được basic LOOP, WHILE LOOP, FOR LOOP và khi nào dùng cái nào'),
(33,2,6,'PL/SQL nền tảng','[FEU] Exception Handlers – chương quan trọng nhất về nghề','["Sáng: `[FEU]` chương Exception Handlers – đọc rất kỹ, đặc biệt phần `WHEN OTHERS` và `RAISE_APPLICATION_ERROR`","Chiều: Dev Gym – quiz về Error Management, RAISE_APPLICATION_ERROR, Exceptions Raised in Declaration Section, User-Defined Exceptions","Tối: TOEIC"]','Giải thích được vì sao `WHEN OTHERS THEN NULL` là lỗi nghiêm trọng, kèm ví dụ hậu quả thật'),
(34,2,6,'PL/SQL nền tảng','[FEU] Data Retrieval · cursor implicit, explicit, FOR loop','["Sáng: `[FEU]` chương Data Retrieval – implicit cursor, explicit cursor, cursor FOR loop, cursor attributes (`%FOUND`, `%ROWCOUNT`)","Chiều: Dev Gym – quiz về Cursor FOR Loops, SQL in PL/SQL, Declaring REF CURSOR","Tối: TOEIC"]','Viết được cả 3 kiểu cursor cho cùng một bài toán, biết kiểu nào gọn nhất'),
(35,2,6,'PL/SQL nền tảng','[FEU] Records và Collections (đọc lướt) – nền cho BULK COLLECT','["Sáng: `[FEU]` chương Records và Collections – đọc lướt, đủ để hiểu associative array và nested table","Chiều: Dev Gym – quiz về Collections","Tối: TOEIC"]','Khai báo và dùng được một collection để chứa nhiều dòng dữ liệu'),
(36,2,6,'PL/SQL nền tảng','Ôn tuần 6 · viết stored procedure đầu tiên có exception handling','["Sáng: Tự viết một procedure trên dữ liệu PaySim: nhận `account_id`, trả về tổng giao dịch, có xử lý trường hợp không tìm thấy","Chiều: `[FEU]` chương DML and Transaction Management – `COMMIT`, `ROLLBACK`, `SAVEPOINT` trong PL/SQL","Tối: TOEIC"]','Chốt tuần: procedure chạy đúng, có exception handling đầy đủ, không nuốt lỗi'),
(37,2,7,'Package, hiệu năng, warehouse','[FEU] Procedures, Functions, Parameters · IN, OUT, IN OUT','["Sáng: `[FEU]` chương Procedures, Functions, and Parameters – procedure khác function, các loại tham số","Chiều: Viết lại procedure ngày 36 thành function, so sánh hai cách","Tối: TOEIC"]','Trả lời được \"khi nào dùng procedure, khi nào dùng function\"'),
(38,2,7,'Package, hiệu năng, warehouse','[FEU] Packages – chương MB Bank hỏi trực tiếp','["Sáng: `[FEU]` chương Packages – package specification, package body, biến package-level, overloading","Chiều: đọc thêm bài blog của Feuerstein trên blogs.oracle.com về package (loạt bài PL/SQL nhiều phần)","Tối: TOEIC"]','Giải thích được lợi ích của package so với để procedure rời rạc'),
(39,2,7,'Package, hiệu năng, warehouse','[FEU] Optimizing PL/SQL · BULK COLLECT, FORALL, context switch','["Sáng: `[FEU]` chương Optimizing PL/SQL Performance – `BULK COLLECT`, `FORALL`, `LIMIT`","Chiều: đo benchmark thật: xử lý 100 nghìn dòng bằng loop thường, rồi bằng `BULK COLLECT`. Ghi lại chênh lệch giây.","Tối: TOEIC"]','Có số liệu benchmark thật – đây là thứ để kể trong phỏng vấn'),
(40,2,7,'Package, hiệu năng, warehouse','[FEU] Triggers · mutating table error','["Sáng: `[FEU]` chương Triggers – các loại trigger, thứ tự kích hoạt, mutating table error","Chiều: Dev Gym – quiz về Transaction Processing in PL/SQL, Restrictions on use of FORALL","Tối: TOEIC"]','Giải thích được mutating table error xảy ra khi nào và cách tránh'),
(41,2,7,'Package, hiệu năng, warehouse','[KIM] chương 1–2 · Star Schema, fact và dimension','["Sáng: `[KIM]` chương 1 (Data Warehousing, BI, and Dimensional Modeling Primer) và chương 2 (Kimball Dimensional Modeling Techniques Overview)","Chiều: Thiết kế star schema cho PaySim trên giấy: `fact_transaction` + `dim_account`, `dim_time`, `dim_type`","Tối: TOEIC"]','Có sơ đồ star schema vẽ ra, giải thích được vì sao thiết kế như vậy'),
(42,2,7,'Package, hiệu năng, warehouse','[KIM] chương 3 + SCD Type 2 bằng MERGE','["Sáng: `[KIM]` chương 3 (Retail Sales) – ví dụ kinh điển về dimensional modeling. Học SCD Type 1, 2, 3.","Chiều: Implement SCD Type 2 cho `dim_account` bằng `MERGE` – thêm cột `valid_from`, `valid_to`, `is_current`","Tối: TOEIC"]','Chốt tuần: SCD Type 2 chạy được, thử đổi thông tin một tài khoản và thấy dòng lịch sử được giữ lại'),
(43,2,8,'Tuần build – Batch Layer','Build · staging table + load toàn bộ PaySim','["Cả ngày: Tạo staging table trong Oracle. Load toàn bộ 6,3 triệu dòng PaySim (dùng SQL*Loader hoặc external table nếu Python chậm).","Tối: TOEIC"]','Có 6,3 triệu dòng trong Oracle'),
(44,2,8,'Tuần build – Batch Layer','Build · transform staging – star schema bằng PL/SQL','["Cả ngày: Viết procedure transform từ staging sang `fact_transaction` và các dimension. Dùng `BULK COLLECT` cho phần xử lý theo lô.","Tối: TOEIC"]','Star schema đã có dữ liệu, đếm số dòng khớp với staging'),
(45,2,8,'Tuần build – Batch Layer','Build · package tính aggregate','["Cả ngày: Viết package gồm các procedure/function tính: tổng giao dịch theo ngày, top tài khoản rủi ro, tỉ lệ fraud theo `type`. Có exception handling đầy đủ.","Tối: TOEIC"]','Package chạy được, gọi từng procedure ra kết quả đúng'),
(46,2,8,'Tuần build – Batch Layer','Partition + index · đo trước và sau','["Sáng: Partition `fact_transaction` theo thời gian (Range partition). Học partition pruning.","Nguồn: Oracle *Database VLDB and Partitioning Guide*, chỉ đọc chương về Range partitioning","Chiều: Thêm index – B-tree cho cột lọc thường xuyên, Bitmap cho cột ít giá trị (`type`, `isFraud`). Chạy `EXPLAIN PLAN` trước và sau.","Tối: TOEIC"]','Bảng số liệu benchmark: query X giây trước, Y giây sau khi partition + index'),
(47,2,8,'Tuần build – Batch Layer','Viết README + đẩy toàn bộ lên GitHub','["Sáng: Viết README: mô tả bài toán, kiến trúc, sơ đồ star schema, cách chạy, bảng số liệu benchmark, hạn chế hiện tại","Chiều: Dọn code, commit theo từng phần rõ ràng, push lên GitHub","Tối: TOEIC"]','Repo GitHub nhìn vào là hiểu được project làm gì'),
(48,2,8,'Tuần build – Batch Layer','CHỐT THÁNG 2 · cập nhật CV và rải hồ sơ đợt 1','["Sáng: Làm lại Dev Gym workout \"How Good Are You at PL/SQL?\" – so sánh với kết quả ngày 25 để thấy mình tiến bao xa","Chiều: Cập nhật CV với project mới. Nộp hồ sơ đợt 1: MB Bank, Techcombank, VPBank và các vị trí fresher/intern thiên về SQL/Oracle.","Tối: TOEIC – đề full test #5"]','CHỐT THÁNG 2: batch layer chạy từ CSV đến báo cáo · package PL/SQL tự viết · có số liệu benchmark thật · CV cập nhật · đã nộp hồ sơ')
on conflict (day) do update set
  month = excluded.month,
  week = excluded.week,
  week_title = excluded.week_title,
  memo = excluded.memo,
  tasks = excluded.tasks,
  checkpoint = excluded.checkpoint;
