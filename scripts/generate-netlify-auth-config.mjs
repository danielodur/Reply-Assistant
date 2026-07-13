#!/usr/bin/env node
/**
 * Writes netlify-auth/auth/config.js from env (Netlify build or local apps/web/.env).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, 'apps/web/.env') });
dotenv.config({ path: path.join(root, 'apps/api/.env') });

const supabaseUrl = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
  console.error('[generate-netlify-auth-config] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const outPath = path.join(root, 'netlify-auth/auth/config.js');
const contents = `/** Generated — do not commit secrets if this repo is public */
window.AUTH_CONFIG = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  appDeepLinkBase: 'reply-assistant://auth/callback',
};
`;

fs.writeFileSync(outPath, contents, 'utf8');
console.log('[generate-netlify-auth-config] Wrote', outPath);
