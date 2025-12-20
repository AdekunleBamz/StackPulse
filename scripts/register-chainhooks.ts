#!/usr/bin/env npx ts-node
/**
 * Chainhook Registration Script for StackPulse
 * 
 * This script registers all chainhooks with Hiro's Platform API.
 * 
 * Prerequisites:
 * 1. Create account at https://platform.hiro.so
 * 2. Get your API key from the dashboard
 * 3. Set HIRO_API_KEY environment variable
 * 
 * Usage:
 *   HIRO_API_KEY=your-api-key npx ts-node scripts/register-chainhooks.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const HIRO_PLATFORM_API = 'https://api.platform.hiro.so';

interface ChainhookConfig {
  name: string;
  chain: string;
  network: string;
  version: number;
  filters: Record<string, unknown>;
  options: Record<string, unknown>;
  action: {
    http: {
      url: string;
      method: string;
      authorization_header?: string;
    };
  };
  description?: string;
}

async function registerChainhook(apiKey: string, config: ChainhookConfig): Promise<boolean> {
  try {
    const response = await fetch(`${HIRO_PLATFORM_API}/v1/chainhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: config.name,
        network: config.network,
        predicate: {
          chain: config.chain,
          ...config.filters,
        },
        action: config.action,
        start_block: config.options.start_at_block_height,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to register ${config.name}:`, error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Registered: ${config.name} (ID: ${result.id || 'N/A'})`);
    return true;
  } catch (error) {
    console.error(`❌ Error registering ${config.name}:`, error);
    return false;
  }
}

async function listChainhooks(apiKey: string): Promise<void> {
  try {
    const response = await fetch(`${HIRO_PLATFORM_API}/v1/chainhooks`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to list chainhooks:', await response.text());
      return;
    }

    const hooks = await response.json();
    console.log('\n📋 Registered Chainhooks:');
    console.log('─'.repeat(50));
    
    if (Array.isArray(hooks) && hooks.length > 0) {
      hooks.forEach((hook: { id: string; name: string; status: string; network: string }) => {
        console.log(`  • ${hook.name} (${hook.network}) - Status: ${hook.status}`);
      });
    } else {
      console.log('  No chainhooks registered yet.');
    }
  } catch (error) {
    console.error('Error listing chainhooks:', error);
  }
}

async function main() {
  const apiKey = process.env.HIRO_API_KEY;
  
  if (!apiKey) {
    console.error(`
╔════════════════════════════════════════════════════════════════╗
║  ERROR: HIRO_API_KEY environment variable not set              ║
╠════════════════════════════════════════════════════════════════╣
║  To register chainhooks with Hiro Platform:                    ║
║                                                                ║
║  1. Go to https://platform.hiro.so                             ║
║  2. Create an account or sign in                               ║
║  3. Navigate to API Keys section                               ║
║  4. Generate a new API key                                     ║
║  5. Run this script with:                                      ║
║                                                                ║
║     HIRO_API_KEY=your-key npx ts-node register-chainhooks.ts   ║
╚════════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  const chainhooksDir = path.join(__dirname, '..', 'chainhooks');
  
  if (!fs.existsSync(chainhooksDir)) {
    console.error(`Chainhooks directory not found: ${chainhooksDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(chainhooksDir).filter(f => f.endsWith('.json'));
  
  console.log(`\n🚀 StackPulse Chainhook Registration\n`);
  console.log(`Found ${files.length} chainhook configurations\n`);

  // First, list existing chainhooks
  await listChainhooks(apiKey);
  
  console.log('\n📤 Registering Chainhooks...\n');
  
  let success = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(chainhooksDir, file);
    const config: ChainhookConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const result = await registerChainhook(apiKey, config);
    result ? success++ : failed++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Results: ${success} registered, ${failed} failed`);
  
  // List again to confirm
  await listChainhooks(apiKey);
}

main().catch(console.error);
