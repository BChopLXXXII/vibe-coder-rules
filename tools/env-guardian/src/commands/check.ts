import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { EnvSchema, EnvVar } from '../templates';

interface CheckOptions {
  schema?: string;
  env?: string;
}

export async function check(options: CheckOptions): Promise<void> {
  const schemaPath = options.schema || '.env.schema.json';
  const envPath = options.env || '.env';

  // Load schema
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    console.log('Run "env-guardian init" first to create a schema');
    process.exit(1);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  let schema: EnvSchema;

  try {
    schema = JSON.parse(schemaContent);
  } catch {
    console.error(`❌ Invalid JSON in ${schemaPath}`);
    process.exit(1);
  }

  if (!schema.vars || !Array.isArray(schema.vars)) {
    console.error(`❌ Invalid schema: missing "vars" array`);
    process.exit(1);
  }

  // Load env file
  let envVars: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    envVars = dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
  } else if (envPath !== '.env') {
    console.error(`❌ Env file not found: ${envPath}`);
    process.exit(1);
  }

  // Check for missing required vars
  const missing: EnvVar[] = [];
  const present: string[] = [];

  for (const envVar of schema.vars) {
    if (envVar.required && !envVars[envVar.name] && !envVar.default) {
      missing.push(envVar);
    } else if (envVars[envVar.name] || envVar.default) {
      present.push(envVar.name);
    }
  }

  // Print results
  console.log('\n🔍 Env Guardian Check\n');
  console.log(`Schema: ${schemaPath}`);
  console.log(`Env: ${envPath}\n`);

  if (present.length > 0) {
    console.log(`✅ Present (${present.length}):`);
    present.forEach(name => {
      const val = envVars[name] ? envVars[name].substring(0, 8) + '...' : '(default)';
      console.log(`   ${name}`);
    });
    console.log('');
  }

  if (missing.length > 0) {
    console.log(`❌ Missing Required (${missing.length}):`);
    missing.forEach(envVar => {
      console.log(`   ${envVar.name}`);
      if (envVar.description) {
        console.log(`      → ${envVar.description}`);
      }
    });
    console.log('\n⚠️  Deploy will likely fail. Add these vars before deploying.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present!');
  console.log('🚀 Ready to deploy.\n');
}
