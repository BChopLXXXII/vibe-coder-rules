export interface EnvVar {
  name: string;
  required: boolean;
  description?: string;
  default?: string;
}

export interface EnvSchema {
  $schema?: string;
  vars: EnvVar[];
}

export const templates: Record<string, EnvSchema> = {
  nextjs: {
    vars: [
      { name: 'NEXT_PUBLIC_API_URL', required: false, description: 'Your API base URL' },
      { name: 'NEXT_PUBLIC_APP_URL', required: false, description: 'Your app URL', default: 'http://localhost:3000' },
    ],
  },
  supabase: {
    vars: [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anon key' },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', required: false, description: 'Supabase service role key (server-side only)' },
    ],
  },
  stripe: {
    vars: [
      { name: 'STRIPE_SECRET_KEY', required: true, description: 'Stripe secret key' },
      { name: 'STRIPE_PUBLISHABLE_KEY', required: true, description: 'Stripe publishable key' },
      { name: 'STRIPE_WEBHOOK_SECRET', required: false, description: 'Stripe webhook secret' },
      { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true, description: 'Stripe publishable key for client' },
    ],
  },
};

export function getTemplate(name: string): EnvSchema | null {
  return templates[name.toLowerCase()] || null;
}

export function getTemplateNames(): string[] {
  return Object.keys(templates);
}
