import { NextResponse } from "next/server";
import { getStatus } from "@/lib/sync-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getStatus();
  return NextResponse.json(status);
}
