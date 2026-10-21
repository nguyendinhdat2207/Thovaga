import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getInboxItems } from "@/lib/queries/vocab-inbox";
import { appToday } from "@/lib/queries/stats";
import { isoWeekNumber } from "@/lib/toeic";
import { InboxList } from "@/components/vocab/InboxList";

export default async function VocabInboxPage() {
  const supabase = await createClient();
  const items = await getInboxItems(supabase, "pending");
  const weekLabel = `tuần ${isoWeekNumber(appToday())}`;

  return (
    <div className="max-w-[720px] mx-auto px-5 py-6 pb-16">
      <Link href="/vocab" className="font-bold text-[13px] text-ink-muted mb-3 inline-block">
        ← Từ vựng
      </Link>
      <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink">
        Sổ ghi nhanh từ mới
      </h1>
      <p className="font-bold text-sm text-ink-muted mt-0.5 mb-6">
        Ghi vội từ lạ khi làm đề — cuối tuần copy sang Claude chuẩn hoá rồi nhập thành bộ từ.
      </p>
      <InboxList
        initialItems={items.map(({ id, raw_text, context, source, created_at }) => ({
          id,
          raw_text,
          context,
          source,
          created_at,
        }))}
        weekLabel={weekLabel}
      />
    </div>
  );
}
