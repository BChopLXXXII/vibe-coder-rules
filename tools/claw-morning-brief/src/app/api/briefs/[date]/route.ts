import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const briefsDir = path.join(process.cwd(), 'briefs');
    const filePath = path.join(briefsDir, `morning-brief-${date}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `No brief found for ${date}` },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    return NextResponse.json({
      date,
      content,
      filename: `morning-brief-${date}.md`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read brief' },
      { status: 500 }
    );
  }
}
