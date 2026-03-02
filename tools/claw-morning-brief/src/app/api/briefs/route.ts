import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { BriefListItem } from '@/lib/types';

export async function GET() {
  try {
    const briefsDir = path.join(process.cwd(), 'briefs');

    if (!fs.existsSync(briefsDir)) {
      return NextResponse.json({ briefs: [] });
    }

    const files = fs.readdirSync(briefsDir)
      .filter((f) => f.startsWith('morning-brief-') && f.endsWith('.md'))
      .sort()
      .reverse();

    const briefs: BriefListItem[] = files.map((filename) => {
      const dateMatch = filename.match(/morning-brief-(\d{4}-\d{2}-\d{2})\.md/);
      const date = dateMatch ? dateMatch[1] : filename;
      
      let summary = '';
      let hasAttentionItems = false;
      let itemCount = 0;

      try {
        const content = fs.readFileSync(path.join(briefsDir, filename), 'utf-8');
        
        // Extract summary from "What Got Done" section
        const doneMatch = content.match(/## What Got Done\n([\s\S]*?)(?=\n## )/);
        if (doneMatch) {
          const items = doneMatch[1].trim().split('\n').filter((l) => l.startsWith('- '));
          itemCount = items.length;
          summary = items.slice(0, 3).map((l) => l.replace(/^- [✅⚠️❌ℹ️]+ /, '')).join('; ');
        }

        hasAttentionItems = content.includes('## Needs Your Attention') && 
          !content.includes('Nothing urgent');
      } catch {
        summary = 'Unable to read brief';
      }

      return { date, filename, summary, hasAttentionItems, itemCount };
    });

    return NextResponse.json({ briefs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list briefs' },
      { status: 500 }
    );
  }
}
