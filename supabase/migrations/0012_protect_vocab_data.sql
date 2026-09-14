-- Khoá dữ liệu từ vựng khỏi việc bị xoá nhầm bởi các lần sửa code/migration
-- sau này (kể cả do chính tôi chạy nhầm câu SQL), cộng thêm lớp sao lưu tự
-- động để có đường lùi nếu chẳng may việc khoá bị gỡ nhầm.
--
-- Hai lớp phòng thủ độc lập:
--   1. Trigger chặn TRUNCATE và DELETE hàng loạt trên vocab_decks/vocab_words/
--      vocab_progress/vocab_sessions — phải chủ động gõ 1 dòng xác nhận thì
--      mới xoá được, tránh việc 1 câu lệnh gõ nhầm/migration lỗi xoá sạch dữ
--      liệu ngay lập tức.
--   2. Snapshot tự động mỗi ngày (qua pg_cron) lưu toàn bộ decks+words+progress
--      dưới dạng jsonb — nếu lớp 1 bị vượt qua (kể cả cố ý mà làm sai), vẫn
--      khôi phục lại được từ snapshot gần nhất.
--
-- Ứng dụng KHÔNG có đường xoá vocab_words/vocab_decks nào (đã kiểm tra
-- src/lib/queries/vocab.ts và src/app/api/vocab/*) nên lớp khoá này không ảnh
-- hưởng người dùng thường — chỉ chặn thao tác SQL trực tiếp.

-- ============================================================
-- LỚP 1: chặn TRUNCATE / DELETE hàng loạt
-- ============================================================

create or replace function protect_vocab_table() returns trigger
language plpgsql
as $$
declare
  deleted_count bigint;
  override text := current_setting('app.allow_destructive_vocab_ops', true);
  max_rows_without_override constant int := 20;
begin
  if tg_op = 'TRUNCATE' then
    if override is distinct from 'yes' then
      raise exception
        'Bị chặn: TRUNCATE % có thể xoá sạch dữ liệu từ vựng đã upload. '
        'Nếu chắc chắn muốn làm, chạy trước trong CÙNG transaction: '
        'set local app.allow_destructive_vocab_ops = ''yes'';',
        tg_table_name;
    end if;
    return null;
  end if;

  if tg_op = 'DELETE' then
    select count(*) into deleted_count from old_rows;
    if deleted_count > max_rows_without_override and override is distinct from 'yes' then
      raise exception
        'Bị chặn: câu lệnh này xoá % dòng khỏi % cùng lúc (giới hạn % dòng nếu '
        'không xác nhận). Nếu chắc chắn muốn làm, chạy trước trong CÙNG '
        'transaction: set local app.allow_destructive_vocab_ops = ''yes'';',
        deleted_count, tg_table_name, max_rows_without_override;
    end if;
    return null;
  end if;

  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['vocab_decks', 'vocab_words', 'vocab_progress', 'vocab_sessions'] loop
    execute format('drop trigger if exists protect_delete on %I', t);
    execute format(
      'create trigger protect_delete after delete on %I '
      'referencing old table as old_rows '
      'for each statement execute function protect_vocab_table()',
      t
    );

    execute format('drop trigger if exists protect_truncate on %I', t);
    execute format(
      'create trigger protect_truncate before truncate on %I '
      'for each statement execute function protect_vocab_table()',
      t
    );
  end loop;
end $$;

-- ============================================================
-- LỚP 2: snapshot tự động mỗi ngày
-- ============================================================

create table if not exists vocab_backups (
  id uuid primary key default gen_random_uuid(),
  taken_at timestamptz not null default now(),
  deck_count int not null,
  word_count int not null,
  payload jsonb not null
);

create index if not exists vocab_backups_taken_at_idx on vocab_backups(taken_at desc);

alter table vocab_backups enable row level security;
-- Không policy nào cho client — chỉ đọc được qua SQL Editor/psql khi cần khôi
-- phục, không lộ qua REST API.

-- Gói toàn bộ decks + words + progress vào 1 dòng jsonb. Giữ 30 bản gần nhất
-- (mỗi ngày 1 bản = đủ dùng 1 tháng), tự xoá bản cũ hơn để bảng không phình vô hạn.
create or replace function snapshot_vocab_data() returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into vocab_backups (deck_count, word_count, payload)
  select
    (select count(*) from vocab_decks),
    (select count(*) from vocab_words),
    jsonb_build_object(
      'decks', (select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) from vocab_decks d),
      'words', (select coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb) from vocab_words w),
      'progress', (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from vocab_progress p)
    );

  delete from vocab_backups
  where id not in (
    select id from vocab_backups order by taken_at desc limit 30
  );
end;
$$;

-- Chạy mỗi ngày lúc 19:00 UTC (~2h sáng giờ Việt Nam — ngoài giờ học).
select cron.schedule(
  'snapshot-vocab-daily',
  '0 19 * * *',
  $$select snapshot_vocab_data()$$
)
where not exists (select 1 from cron.job where jobname = 'snapshot-vocab-daily');

-- Lấy ngay 1 bản snapshot làm mốc, không đợi tới giờ chạy tự động đầu tiên.
select snapshot_vocab_data();
