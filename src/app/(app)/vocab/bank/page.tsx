import { createClient } from "@/lib/supabase/server";
import { getVocabDecks, getVocabWords } from "@/lib/queries/vocab";
import { appToday } from "@/lib/queries/stats";
import { VocabBank } from "@/components/vocab/VocabBank";

export default async function VocabBankPage() {
  const supabase = await createClient();
  const [decks, words] = await Promise.all([
    getVocabDecks(supabase),
    getVocabWords(supabase),
  ]);

  // Ngày "hôm nay" tính ở server theo giờ Việt Nam — nếu để component tự lấy
  // ngày UTC thì nhãn "Đến hạn" sai vào khung 00:00-07:00 sáng.
  return <VocabBank decks={decks} words={words} today={appToday()} />;
}
