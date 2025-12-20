#!/usr/bin/env npx ts-node
/**
 * StackPulse Chainhooks Registration Script
 * 
 * Uses direct HTTP API calls with the correct Hiro Platform format
 */

import { request } from 'undici';

const API_KEY = process.env.HIRO_API_KEY;
const API_URL = `https://api.platform.hiro.so/v1/ext/${API_KEY}/chainhooks`;
const WEBHOOK_BASE_URL = 'https://stackpulse-b8fw.onrender.com/api/chainhooks';

// StackPulse contract addresses
const CONTRACTS = {
  registry: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.stackpulse-v2',
  alertManager: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.alert-manager-v2',
  feeVault: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.fee-vault-v2',
  badges: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.reputation-badges-v3',
  alexDex: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool-v1-1'
};

// Current block height (approximately - use recent block)
const START_BLOCK = 180000;

// Chainhook definitions in Hiro Platform format
// Using print_event scope with contains (the only reliable scope that works)
const CHAINHOOKS = [
  {
    name: 'StackPulse-Registrations',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.registry,
          contains: 'subscription'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/subscription-created`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  },
  {
    name: 'StackPulse-AlertsTriggered',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.alertManager,
          contains: 'alert'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/alert-triggered`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  },
  {
    name: 'StackPulse-FeesCollected',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.feeVault,
          contains: 'fee'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/fee-collected`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  },
  {
    name: 'StackPulse-BadgesEarned',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.badges,
          contains: 'badge'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/badge-earned`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  },
  // Contract call scopes for tracking function calls
  {
    name: 'StackPulse-NewSubscriptions',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'contract_call',
          contract_identifier: CONTRACTS.registry,
          method: 'register-and-subscribe'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/new-subscription`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  },
  {
    name: 'StackPulse-UpgradeSubscriptions',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'contract_call',
          contract_identifier: CONTRACTS.registry,
          method: 'upgrade-subscription'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/subscription-upgrade`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  },
  {
    name: 'StackPulse-CreateAlert',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'contract_call',
          contract_identifier: CONTRACTS.alertManager,
          method: 'create-alert'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/alert-created`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  }
];

async function registerChainhook(chainhook: any): Promise<{ success: boolean; uuid?: string; error?: string }> {
  try {
    const response = await request(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!
      },
      body: JSON.stringify(chainhook)
    });

    const data = await response.body.json() as any;
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      return { success: true, uuid: data.uuid || data.id };
    } else {
      return { success: false, error: JSON.stringify(data) };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listChainhooks(): Promise<any[]> {
  try {
    const response = await request(API_URL, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY!
      }
    });

    const data = await response.body.json() as any;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error listing chainhooks:', error);
    return [];
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ HIRO_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           StackPulse Chainhooks Registration                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // First check existing chainhooks
  console.log('📋 Checking existing chainhooks...');
  const existing = await listChainhooks();
  const stackpulseHooks = existing.filter((h: any) => h.name?.startsWith('StackPulse-'));
  
  if (stackpulseHooks.length > 0) {
    console.log(`\n⚠️  Found ${stackpulseHooks.length} existing StackPulse chainhooks:`);
    stackpulseHooks.forEach((h: any) => {
      console.log(`   - ${h.name} (${h.uuid})`);
    });
    console.log('\n');
  }

  // Register new chainhooks
  console.log('🚀 Registering StackPulse chainhooks...\n');
  
  let success = 0;
  let failed = 0;

  for (const hook of CHAINHOOKS) {
    process.stdout.write(`  Registering: ${hook.name}... `);
    
    const result = await registerChainhook(hook);
    
    if (result.success) {
      console.log(`✅ UUID: ${result.uuid}`);
      success++;
    } else {
      console.log(`❌ ${result.error}`);
      failed++;
    }
    
    // Small delay between registrations
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n────────────────────────────────────────────────────────────────');
  console.log(`\n✅ Registered: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (success > 0) {
    console.log('\n📋 Verifying registration...');
    const updatedList = await listChainhooks();
    const newStackpulseHooks = updatedList.filter((h: any) => h.name?.startsWith('StackPulse-'));
    console.log(`\n🎉 Total StackPulse chainhooks now registered: ${newStackpulseHooks.length}`);
    newStackpulseHooks.forEach((h: any) => {
      console.log(`   ✅ ${h.name}`);
    });
  }
}

main().catch(console.error);
