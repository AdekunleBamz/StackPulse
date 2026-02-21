#!/usr/bin/env npx ts-node
/**
 * StackPulse Chainhooks Manager
 * 
 * Uses the official @hirosystems/chainhooks-client SDK
 * 
 * Commands:
 *   list     - List all registered chainhooks
 *   status   - Check status of all chainhooks
 *   register - Register all chainhooks
 *   enable   - Enable all chainhooks
 *   disable  - Disable all chainhooks
 *   delete   - Delete all chainhooks
 * 
 * Usage:
 *   HIRO_API_KEY=your-key npx ts-node scripts/manage-chainhooks.ts list
 *   HIRO_API_KEY=your-key npx ts-node scripts/manage-chainhooks.ts register
 */

import { ChainhooksClient, CHAINHOOKS_BASE_URL } from '@hirosystems/chainhooks-client';

const WEBHOOK_BASE_URL = 'https://stackpulse-b8fw.onrender.com/api/chainhooks';

// StackPulse contract addresses
const CONTRACTS = {
  registry: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.stackpulse-v2',
  alertManager: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.alert-manager-v2',
  feeVault: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.fee-vault-v2',
  badges: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.reputation-badges-v-j3',
  alexDex: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool-v1-1'
};

// Chainhook definitions using the SDK format
const CHAINHOOK_DEFINITIONS = [
  {
    name: 'stackpulse-stx-transfers',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{ type: 'stx_transfer' as const }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/whale-transfer`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-contract-deploy',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{ type: 'contract_deploy' as const }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/contract-deployed`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-nft-mints',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{ type: 'nft_mint' as const }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/nft-mint`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-ft-mints',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{ type: 'ft_mint' as const }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/token-launch`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-alex-swaps',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{
        type: 'contract_call' as const,
        contract_identifier: CONTRACTS.alexDex,
        function_name: 'swap-helper'
      }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/large-swap`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-registrations',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{
        type: 'contract_log' as const,
        contract_identifier: CONTRACTS.registry
      }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/subscription-created`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-alerts',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{
        type: 'contract_log' as const,
        contract_identifier: CONTRACTS.alertManager
      }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/alert-triggered`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-fees',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{
        type: 'contract_log' as const,
        contract_identifier: CONTRACTS.feeVault
      }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/fee-collected`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  },
  {
    name: 'stackpulse-badges',
    chain: 'stacks' as const,
    network: 'mainnet' as const,
    filters: {
      events: [{
        type: 'contract_log' as const,
        contract_identifier: CONTRACTS.badges
      }]
    },
    action: {
      type: 'http_post' as const,
      url: `${WEBHOOK_BASE_URL}/badge-earned`
    },
    options: {
      decode_clarity_values: true,
      enable_on_registration: true
    }
  }
];

async function getClient(): Promise<ChainhooksClient> {
  const apiKey = process.env.HIRO_API_KEY;
  if (!apiKey) {
    console.error(`
╔════════════════════════════════════════════════════════════════╗
║  ERROR: HIRO_API_KEY environment variable not set              ║
╠════════════════════════════════════════════════════════════════╣
║  Get your API key from: https://platform.hiro.so               ║
║                                                                ║
║  Then run:                                                     ║
║  HIRO_API_KEY=your-key npx ts-node scripts/manage-chainhooks.ts║
╚════════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  return new ChainhooksClient({
    baseUrl: CHAINHOOKS_BASE_URL.mainnet,
    apiKey
  });
}

async function listChainhooks() {
  const client = await getClient();
  console.log('\n📋 Fetching registered chainhooks...\n');
  
  try {
    const response = await client.getChainhooks({ limit: 60 });
    
    if (response.results.length === 0) {
      console.log('  No chainhooks registered yet.\n');
      return;
    }
    
    console.log(`  Found ${response.total} chainhook(s):\n`);
    console.log('  ─'.repeat(40));
    
    for (const hook of response.results) {
      const status = hook.status?.enabled ? '✅ Enabled' : '❌ Disabled';
      console.log(`  ${status} | ${hook.definition.name}`);
      console.log(`           UUID: ${hook.uuid}`);
      console.log(`           Network: ${hook.definition.network}`);
      console.log('');
    }
  } catch (error: any) {
    console.error('Error listing chainhooks:', error.message);
  }
}

async function checkStatus() {
  const client = await getClient();
  console.log('\n🔍 Checking API status...\n');
  
  try {
    const status = await client.getStatus();
    console.log(`  API Status: ${status.status}`);
    console.log(`  Version: ${status.server_version}`);
    console.log('');
    
    // Also list chainhooks
    await listChainhooks();
  } catch (error: any) {
    console.error('Error checking status:', error.message);
  }
}

async function registerChainhooks() {
  const client = await getClient();
  console.log('\n🚀 Registering chainhooks...\n');
  
  let success = 0;
  let failed = 0;
  
  for (const def of CHAINHOOK_DEFINITIONS) {
    try {
      console.log(`  Registering: ${def.name}...`);
      const result = await client.registerChainhook(def as any);
      console.log(`  ✅ Registered! UUID: ${result.uuid}`);
      console.log(`     Enabled: ${result.status?.enabled}`);
      success++;
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n  ─`.repeat(30));
  console.log(`\n  Results: ${success} registered, ${failed} failed\n`);
}

async function enableAllChainhooks(enable: boolean) {
  const client = await getClient();
  const action = enable ? 'Enabling' : 'Disabling';
  console.log(`\n⚡ ${action} all chainhooks...\n`);
  
  try {
    const response = await client.getChainhooks({ limit: 60 });
    
    for (const hook of response.results) {
      try {
        await client.enableChainhook(hook.uuid, enable);
        console.log(`  ✅ ${hook.definition.name}: ${enable ? 'Enabled' : 'Disabled'}`);
      } catch (error: any) {
        console.log(`  ❌ ${hook.definition.name}: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

async function deleteAllChainhooks() {
  const client = await getClient();
  console.log('\n🗑️  Deleting all chainhooks...\n');
  
  try {
    const response = await client.getChainhooks({ limit: 60 });
    
    for (const hook of response.results) {
      try {
        await client.deleteChainhook(hook.uuid);
        console.log(`  ✅ Deleted: ${hook.definition.name}`);
      } catch (error: any) {
        console.log(`  ❌ Failed to delete ${hook.definition.name}: ${error.message}`);
      }
    }
    
    console.log('\n  Done!\n');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

async function main() {
  const command = process.argv[2] || 'status';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           StackPulse Chainhooks Manager                       ║
╚═══════════════════════════════════════════════════════════════╝
`);

  switch (command) {
    case 'list':
      await listChainhooks();
      break;
    case 'status':
      await checkStatus();
      break;
    case 'register':
      await registerChainhooks();
      break;
    case 'enable':
      await enableAllChainhooks(true);
      break;
    case 'disable':
      await enableAllChainhooks(false);
      break;
    case 'delete':
      await deleteAllChainhooks();
      break;
    default:
      console.log(`
  Available commands:
    list     - List all registered chainhooks
    status   - Check API status and list chainhooks
    register - Register all StackPulse chainhooks
    enable   - Enable all chainhooks
    disable  - Disable all chainhooks
    delete   - Delete all chainhooks
    
  Usage:
    HIRO_API_KEY=your-key npx ts-node scripts/manage-chainhooks.ts <command>
`);
  }
}

main().catch(console.error);
