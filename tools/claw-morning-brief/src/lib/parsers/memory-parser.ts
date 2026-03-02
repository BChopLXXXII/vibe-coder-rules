import * as fs from 'fs';
import * as path from 'path';
import { AgentNote, BriefItem } from '../types';

const DEFAULT_MEMORY_DIR = process.env.MEMORY_DIR || '/home/openclaw/.openclaw/workspace/memory';

interface MemoryParseResult {
  whatGotDone: BriefItem[];
  agentNotes: AgentNote[];
  needsAttention: BriefItem[];
  suggestedAction: string;
}

function extractStatus(line: string): 'complete' | 'partial' | 'failed' | 'info' {
  if (line.includes('✅') || line.toLowerCase().includes('complete') || line.toLowerCase().includes('shipped') || line.toLowerCase().includes('merged')) {
    return 'complete';
  }
  if (line.includes('❌') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('error') || line.toLowerCase().includes('broke')) {
    return 'failed';
  }
  if (line.includes('⚠️') || line.toLowerCase().includes('partial') || line.toLowerCase().includes('blocker') || line.toLowerCase().includes('blocked')) {
    return 'partial';
  }
  return 'info';
}

function parseMemoryFile(content: string): MemoryParseResult {
  const lines = content.split('\n');
  const whatGotDone: BriefItem[] = [];
  const agentNotes: AgentNote[] = [];
  const needsAttention: BriefItem[] = [];
  let suggestedAction = '';

  let currentSection = '';
  let currentSectionContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSection && currentSectionContent.length > 0) {
        agentNotes.push({
          section: currentSection,
          content: currentSectionContent.join('\n').trim(),
        });
      }
      currentSection = line.replace(/^#+\s*/, '').trim();
      currentSectionContent = [];
      continue;
    }

    if (currentSection) {
      currentSectionContent.push(line);
    }

    const trimmed = line.trim();
    const sectionLower = currentSection.toLowerCase();

    if (
      sectionLower.includes('built') ||
      sectionLower.includes('shipped') ||
      sectionLower.includes('what shipped') ||
      sectionLower.includes('goal') ||
      sectionLower.includes('nightshift') ||
      sectionLower.includes('done')
    ) {
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.replace(/^[-*]\s*/, '');
        if (text.length > 3) {
          whatGotDone.push({ text, status: extractStatus(text) });
        }
      }
    }

    if (
      sectionLower.includes('risk') ||
      sectionLower.includes('blocker') ||
      sectionLower.includes('attention') ||
      sectionLower.includes('failure') ||
      sectionLower.includes('issue')
    ) {
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.replace(/^[-*]\s*/, '');
        if (text.length > 3) {
          needsAttention.push({ text, status: extractStatus(text) });
        }
      }
    }

    if (
      sectionLower.includes('next') ||
      sectionLower.includes('suggested') ||
      sectionLower.includes('first action')
    ) {
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.replace(/^[-*]\s*/, '');
        if (!suggestedAction && text.length > 3) {
          suggestedAction = text;
        }
      }
    }
  }

  if (currentSection && currentSectionContent.length > 0) {
    agentNotes.push({
      section: currentSection,
      content: currentSectionContent.join('\n').trim(),
    });
  }

  return { whatGotDone, agentNotes, needsAttention, suggestedAction };
}

export function parseMemoryFiles(
  lookbackHours: number = 8,
  memoryDir: string = DEFAULT_MEMORY_DIR
): MemoryParseResult {
  const result: MemoryParseResult = {
    whatGotDone: [],
    agentNotes: [],
    needsAttention: [],
    suggestedAction: '',
  };

  if (!fs.existsSync(memoryDir)) {
    return result;
  }

  const now = Date.now();
  const cutoffMs = now - lookbackHours * 60 * 60 * 1000;

  const memoryFiles = fs.readdirSync(memoryDir)
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.md$/.test(file))
    .filter((file) => {
      try {
        const stat = fs.statSync(path.join(memoryDir, file));
        return stat.mtimeMs >= cutoffMs;
      } catch {
        return false;
      }
    })
    .sort()
    .reverse();

  // Fallback to today + yesterday if no file changed recently
  if (memoryFiles.length === 0) {
    const nowDate = new Date();
    for (let i = 0; i < 2; i++) {
      const d = new Date(nowDate.getTime() - i * 24 * 60 * 60 * 1000);
      const name = `${d.toISOString().split('T')[0]}.md`;
      if (fs.existsSync(path.join(memoryDir, name))) {
        memoryFiles.push(name);
      }
    }
  }

  for (const file of memoryFiles) {
    const filePath = path.join(memoryDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseMemoryFile(content);
      result.whatGotDone.push(...parsed.whatGotDone);
      result.agentNotes.push(...parsed.agentNotes.map((n) => ({ ...n, section: `${file.replace('.md', '')} — ${n.section}` })));
      result.needsAttention.push(...parsed.needsAttention);
      if (!result.suggestedAction && parsed.suggestedAction) {
        result.suggestedAction = parsed.suggestedAction;
      }
    } catch {
      // skip unreadable files
    }
  }

  const files = fs.readdirSync(memoryDir);
  for (const file of files) {
    if (file.startsWith('tool-scout-') && file.endsWith('.md')) {
      const filePath = path.join(memoryDir, file);
      try {
        const stat = fs.statSync(filePath);
        const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);
        if (ageHours <= lookbackHours) {
          result.agentNotes.push({
            section: `Tool Scout Report: ${file}`,
            content: '(Scout report generated within lookback window)',
          });
        }
      } catch {
        // skip
      }
    }
  }

  return result;
}
