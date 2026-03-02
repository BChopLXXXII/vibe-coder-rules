import { NextResponse } from 'next/server';
import * as path from 'path';
import { generateBrief } from '@/lib/brief-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceDir = (body as Record<string, string>).workspaceDir || process.env.WORKSPACE_DIR || '/home/openclaw/.openclaw/workspace';
    const lookbackHours = parseInt((body as Record<string, string>).lookbackHours || process.env.LOOKBACK_HOURS || '8', 10);
    
    // Output briefs to the project's briefs/ directory
    const outputDir = path.join(process.cwd(), 'briefs');

    const brief = generateBrief(workspaceDir, lookbackHours, outputDir);

    return NextResponse.json({
      success: true,
      brief,
      message: `Brief generated for ${brief.date}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating brief',
      },
      { status: 500 }
    );
  }
}
