import { NextResponse } from "next/server";
import { loadConfig, saveConfig } from "@/lib/config";
import { ensureConfigTargetsForSource } from "@/lib/sync-engine";
import { BroadcastConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(loadConfig());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<BroadcastConfig>;
  const prepared = ensureConfigTargetsForSource({
    sourcePath: body.sourcePath ?? loadConfig().sourcePath,
    targets: body.targets ?? loadConfig().targets,
  });

  const config = saveConfig(prepared);
  return NextResponse.json(config);
}
