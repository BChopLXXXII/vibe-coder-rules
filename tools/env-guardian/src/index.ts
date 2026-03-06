#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

interface EnvSchema {
  version: string;
  required: string[];
  optional?: string[];
  templates?: Record<string, string[]>;
}

const program = new Command();

// Built-in templates
const TEMPLATES: Record<string, string[]> = {
  'nextjs': [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_URL',
    'NODE_ENV'
  ],
  'nextjs-supabase': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_DB_PASSWORD'
  ],
  'stripe': [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ],
  'resend': [
    'RESEND_API_KEY',
    'FROM_EMAIL',
    'FROM_NAME'
  ],
  'openai': [
    'OPENAI_API_KEY',
    'OPENAI_ORGANIZATION'
  ]
};

function loadEnvFile(envPath?: string): Record<string, string> {
  const targetPath = envPath || '.env';
  
  if (!fs.existsSync(targetPath)) {
    return {};
  }
  
  const result = dotenv.parse(fs.readFileSync(targetPath));
  return result;
}

function getTemplateVars(template: string): string[] {
  const vars = TEMPLATES[template];
  if (!vars) {
    console.log(chalk.red(`Unknown template: ${template}`));
    console.log(chalk.yellow('Available templates:'));
    Object.keys(TEMPLATES).forEach(t => console.log(`  - ${t}`));
    process.exit(1);
  }
  return vars;
}

program
  .name('env-guardian')
  .description('Validate all env vars before deploy. Never crash on startup from missing API keys.')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a .env.schema.json file from a template or custom vars')
  .option('-t, --template <name>', 'Template to use (nextjs, nextjs-supabase, stripe, resend, openai)')
  .option('-o, --output <file>', 'Output file path', '.env.schema.json')
  .option('-m, --merge', 'Merge with existing schema', false)
  .action((options) => {
    let required: string[] = [];
    
    if (options.template) {
      required = getTemplateVars(options.template);
      console.log(chalk.blue(`Using template: ${options.template}`));
    }
    
    let schema: EnvSchema = {
      version: '1.0.0',
      required,
      optional: [],
      templates: TEMPLATES
    };
    
    if (options.merge && fs.existsSync(options.output)) {
      const existing = JSON.parse(fs.readFileSync(options.output, 'utf-8'));
      const existingRequired = new Set([...existing.required, ...required]);
      schema.required = Array.from(existingRequired);
    }
    
    fs.writeFileSync(options.output, JSON.stringify(schema, null, 2));
    console.log(chalk.green(`✓ Created ${options.output}`));
    console.log(chalk.gray(`  Required vars: ${schema.required.length}`));
  });

program
  .command('check')
  .description('Check .env against schema')
  .option('-e, --env <file>', 'Path to .env file', '.env')
  .option('-s, --schema <file>', 'Path to schema file', '.env.schema.json')
  .option('-w, --warn', 'Warn on missing optional vars', false)
  .action((options) => {
    // Load schema
    if (!fs.existsSync(options.schema)) {
      console.log(chalk.red(`Schema not found: ${options.schema}`));
      console.log(chalk.yellow('Run `env-guardian init` first to create a schema.'));
      process.exit(1);
    }
    
    const schema: EnvSchema = JSON.parse(fs.readFileSync(options.schema, 'utf-8'));
    const envVars = loadEnvFile(options.env);
    
    // Check required vars
    const missing: string[] = [];
    const present: string[] = [];
    
    for (const required of schema.required) {
      if (!envVars[required]) {
        missing.push(required);
      } else {
        present.push(required);
      }
    }
    
    // Check optional vars
    const optionalMissing: string[] = [];
    const optionalPresent: string[] = [];
    
    if (schema.optional) {
      for (const optional of schema.optional) {
        if (!envVars[optional]) {
          optionalMissing.push(optional);
        } else {
          optionalPresent.push(optional);
        }
      }
    }
    
    // Report results
    console.log(chalk.bold('\n🔍 Env Guardian Report\n'));
    
    if (present.length > 0) {
      console.log(chalk.green('✓ Present:'));
      present.forEach(v => console.log(`  ${chalk.green('✓')} ${v}`));
    }
    
    if (missing.length > 0) {
      console.log(chalk.red('\n✗ Missing required:'));
      missing.forEach(v => console.log(`  ${chalk.red('✗')} ${v}`));
    }
    
    if (options.warn && optionalMissing.length > 0) {
      console.log(chalk.yellow('\n⚠ Missing optional:'));
      optionalMissing.forEach(v => console.log(`  ${chalk.yellow('⚠')} ${v}`));
    }
    
    // Exit code
    if (missing.length > 0) {
      console.log(chalk.red(`\n❌ FAILED: ${missing.length} required var(s) missing\n`));
      process.exit(1);
    } else {
      console.log(chalk.green(`\n✅ PASSED: All required vars present\n`));
      process.exit(0);
    }
  });

program
  .command('templates')
  .description('List available templates')
  .action(() => {
    console.log(chalk.bold('\n📋 Available Templates\n'));
    Object.entries(TEMPLATES).forEach(([name, vars]) => {
      console.log(chalk.blue(`${name}:`));
      vars.forEach(v => console.log(`  - ${v}`));
      console.log();
    });
  });

program.parse();
