import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/route-helpers";
import { getSubjectsWithProgress } from "@/lib/queries/subjects";

export const GET = withAuth(async ({ supabase }) => {
  const subjects = await getSubjectsWithProgress(supabase);
  return NextResponse.json({ subjects });
});
