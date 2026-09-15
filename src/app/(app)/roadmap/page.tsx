import { createClient } from "@/lib/supabase/server";
import { getRoadmapOverview } from "@/lib/queries/roadmap";
import { RoadmapPath } from "@/components/roadmap/RoadmapPath";

export default async function RoadmapPage() {
  const supabase = await createClient();
  const overview = await getRoadmapOverview(supabase);

  return <RoadmapPath initialOverview={overview} />;
}
