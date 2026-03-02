import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync-engine";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = runSync();
  return NextResponse.json(result);
}
