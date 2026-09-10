import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/route-helpers";
import { getHistory } from "@/lib/queries/attempts";

export const GET = withAuth(async ({ supabase }) => {
  return NextResponse.json(await getHistory(supabase));
});
