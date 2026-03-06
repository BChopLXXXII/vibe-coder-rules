import * as fs from 'fs';
import * as path from 'path';
import { getTemplate, getTemplateNames, EnvSchema } from '../templates';

interface InitOptions {
  template?: string;
  output?: string;
}

export async function init(options: InitOptions): Promise<void> {
  const { template, output } = options;

  if (template) {
    // Use template
    const schema = getTemplate(template);
    if (!schema) {
      console.error(`❌ Unknown template: ${template}`);
      console.log(`Available templates: ${getTemplateNames().join(', ')}`);
      process.exit(1);
    }

    fs.writeFileSync(output || '.env.schema.json', JSON.stringify(schema, null, 2));
    console.log(`✅ Created ${output || '.env.schema.json'} from "${template}" template`);
    return;
  }

  // Check for existing .env or .env.example
  const envPaths = ['.env', '.env.example', '.env.local'];
  let existingVars: string[] = [];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const vars = content
        .split('\n')
        .filter(line => line && !line.startsWith('#') && line.includes('='))
        .map(line => line.split('=')[0].trim());
      existingVars = [...existingVars, ...vars];
      console.log(`📄 Found ${vars.length} vars in ${envPath}`);
    }
  }

  if (existingVars.length > 0) {
    // Generate schema from existing vars
    const schema: EnvSchema = {
      vars: [...new Set(existingVars)].map(name => ({
        name,
        required: true,
        description: `Auto-detected from existing env file`,
      })),
    };

    fs.writeFileSync(output || '.env.schema.json', JSON.stringify(schema, null, 2));
    console.log(`✅ Created ${output || '.env.schema.json'} with ${schema.vars.length} variables`);
    return;
  }

  // No existing env found - show help
  console.log('🔍 No .env file found.');
  console.log('\nUsage:');
  console.log('  env-guardian init                    # Create empty schema');
  console.log('  env-guardian init -t <template>      # Use a template');
  console.log('\nAvailable templates:');
  getTemplateNames().forEach(name => {
    console.log(`  - ${name}`);
  });

  // Create empty schema
  const emptySchema: EnvSchema = { vars: [] };
  fs.writeFileSync(output || '.env.schema.json', JSON.stringify(emptySchema, null, 2));
  console.log(`\n✅ Created empty ${output || '.env.schema.json'}`);
}
