#!/usr/bin/env node

import { Command } from 'commander';
import { simpleGit, SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface ChangelogConfig {
  fromTag?: string;
  toTag?: string;
  outputFile?: string;
  includeMessages?: boolean;
  types?: {
    feat?: string;
    fix?: string;
    docs?: string;
    style?: string;
    refactor?: string;
    perf?: string;
    test?: string;
    chore?: string;
    break?: string;
  };
}

// Default commit type groupings
const DEFAULT_TYPES = {
  feat: { title: 'Features', emoji: '✨' },
  fix: { title: 'Bug Fixes', emoji: '🐛' },
  docs: { title: 'Documentation', emoji: '📚' },
  style: { title: 'Styles', emoji: '💄' },
  refactor: { title: 'Code Refactoring', emoji: '♻️' },
  perf: { title: 'Performance Improvements', emoji: '⚡️' },
  test: { title: 'Tests', emoji: '✅' },
  chore: { title: 'Chores', emoji: '🔧' },
  break: { title: 'Breaking Changes', emoji: '💥' }
};

const program = new Command();

program
  .name('changelog-hero')
  .description('Auto-generate CHANGELOG.md from git commits. Ship fast, keep users informed, zero effort.')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate changelog from git commits')
  .option('-f, --from <tag>', 'From tag (default: last tag)')
  .option('-t, --to <tag>', 'To tag (default: HEAD)')
  .option('-o, --output <file>', 'Output file (default: CHANGELOG.md)')
  .option('-m, --include-messages', 'Include full commit messages', false)
  .option('-c, --config <file>', 'Config file path')
  .action(async (options) => {
    try {
      const git: SimpleGit = simpleGit();
      
      // Check if git repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.log(chalk.red('Not a git repository'));
        process.exit(1);
      }
      
      // Get tags
      const tags = await git.tags();
      
      // Determine from/to
      let fromTag = options.from;
      let toTag = options.to;
      
      if (!fromTag && tags.latest) {
        fromTag = tags.latest;
      }
      
      if (!toTag) {
        toTag = 'HEAD';
      }
      
      console.log(chalk.blue(`Generating changelog: ${fromTag || 'initial'} → ${toTag}`));
      
      // Get log
      const logOptions: any = {
        format: '%s|%h|%an'
      };
      
      if (fromTag) {
        logOptions.from = fromTag;
        logOptions.to = toTag;
      }
      
      const logs = await git.log(logOptions);
      
      if (!logs.all || logs.all.length === 0) {
        console.log(chalk.yellow('No commits found'));
        process.exit(0);
      }
      
      // Group by type
      const commits = [...logs.all];
      const grouped: Record<string, typeof commits> = {};
      
      for (const commit of commits) {
        const match = commit.message.match(/^(\w+)(\(.+\))?:\s*(.+)/);
        if (match) {
          const type = match[1].toLowerCase();
          if (!grouped[type]) {
            grouped[type] = [];
          }
          grouped[type].push(commit);
        }
      }
      
      // Generate markdown
      let md = `# Changelog\n\n`;
      md += `Generated on ${new Date().toISOString().split('T')[0]}\n\n`;
      
      if (fromTag) {
        md += `## ${fromTag} → ${toTag}\n\n`;
      } else {
        md += `## Unreleased\n\n`;
      }
      
      // Output each type
      const typeOrder = ['feat', 'fix', 'break', 'perf', 'refactor', 'docs', 'style', 'test', 'chore'];
      
      for (const type of typeOrder) {
        if (grouped[type]) {
          const typeInfo = DEFAULT_TYPES[type as keyof typeof DEFAULT_TYPES];
          md += `### ${typeInfo?.emoji || ''} ${typeInfo?.title || type}\n\n`;
          
          for (const commit of grouped[type]) {
            const shortHash = commit.hash.substring(0, 7);
            const msg = commit.message.replace(/^\w+(\(.+\))?:\s*/, '');
            
            if (options.includeMessages) {
              md += `- ${msg} (${shortHash}, ${commit.author_name})\n`;
            } else {
              md += `- ${msg} (${shortHash})\n`;
            }
          }
          md += '\n';
        }
      }
      
      // Write to file
      const outputFile = options.output || 'CHANGELOG.md';
      fs.writeFileSync(outputFile, md);
      
      console.log(chalk.green(`✓ Generated ${outputFile}`));
      console.log(chalk.gray(`  Commits: ${logs.all.length}`));
      console.log(chalk.gray(`  Types: ${Object.keys(grouped).length}`));
      
    } catch (error: any) {
      console.log(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize changelog-hero config')
  .option('-o, --output <file>', 'Output file path', 'changelog-hero.json')
  .action((options) => {
    const config: ChangelogConfig = {
      outputFile: 'CHANGELOG.md',
      includeMessages: false,
      types: DEFAULT_TYPES as any
    };
    
    fs.writeFileSync(options.output, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✓ Created ${options.output}`));
  });

program.parse();
