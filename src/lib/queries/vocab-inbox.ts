import { isMissingSchemaError } from "@/lib/queries/toeic";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, VocabInboxItem } from "@/lib/database.types";
import {
  INBOX_BATCH_MAX,
  INBOX_CONTEXT_MAX,
  INBOX_SOURCE_MAX,
  INBOX_TEXT_MAX,
} from "@/lib/toeic";

// "Sổ ghi nhanh": ghi vội từ lạ khi làm đề Zenlish, cuối tuần copy sang Claude
// chuẩn hoá rồi nhập lại thành bộ từ ở /vocab/import. Tách khỏi vocab_words —
// mục trong sổ chưa có nghĩa chuẩn nên không được lẫn vào Leitner/quiz.

export class VocabInboxError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface AddInboxItemInput {
  raw_text: string;
  context?: string | null;
  source?: string | null;
}

function optionalText(v: unknown, max: number): string | null {
  return typeof v === "string" ? v.trim().slice(0, max) || null : null;
}

export async function addInboxItem(
  supabase: SupabaseClient<Database>,
  input: AddInboxItemInput
): Promise<VocabInboxItem> {
  const raw = typeof input.raw_text === "string" ? input.raw_text.trim() : "";
  if (!raw) throw new VocabInboxError("Nhập từ hoặc cụm từ cần ghi.");
  if (raw.length > INBOX_TEXT_MAX) {
    throw new VocabInboxError(`Tối đa ${INBOX_TEXT_MAX} ký tự mỗi mục.`);
  }
  const { data, error } = await supabase
    .from("vocab_inbox")
    .insert({
      raw_text: raw,
      context: optionalText(input.context, INBOX_CONTEXT_MAX),
      source: optionalText(input.source, INBOX_SOURCE_MAX),
    })
    .select("*")
    .single<VocabInboxItem>();
  if (error) throw error;
  return data;
}

export async function getInboxItems(
  supabase: SupabaseClient<Database>,
  scope: "pending" | "processed"
): Promise<VocabInboxItem[]> {
  let q = supabase.from("vocab_inbox").select("*");
  q =
    scope === "pending"
      ? q.is("processed_at", null).order("created_at", { ascending: true })
      : q.not("processed_at", "is", null).order("processed_at", { ascending: false });
  const { data, error } = await q.limit(INBOX_BATCH_MAX);
  if (error) {
    // Chưa chạy migration 0018 thì coi như sổ trống thay vì sập trang.
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return data ?? [];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Đánh dấu đã xử lý — không xoá, để còn tra lại nguồn gốc 1 từ khi cần. */
export async function markInboxProcessed(
  supabase: SupabaseClient<Database>,
  input: { ids: unknown }
): Promise<number> {
  if (!Array.isArray(input.ids) || input.ids.length === 0) {
    throw new VocabInboxError("Chưa chọn mục nào.");
  }
  if (input.ids.length > INBOX_BATCH_MAX) {
    throw new VocabInboxError(`Tối đa ${INBOX_BATCH_MAX} mục mỗi lần.`);
  }
  const ids = input.ids.filter((x): x is string => typeof x === "string" && UUID_RE.test(x));
  if (ids.length !== input.ids.length) throw new VocabInboxError("Danh sách mục không hợp lệ.");

  const { data, error } = await supabase
    .from("vocab_inbox")
    .update({ processed_at: new Date().toISOString() })
    .in("id", ids)
    .is("processed_at", null)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
