#!/usr/bin/env npx ts-node
/**
 * StackPulse V3 Chainhooks Registration Script
 * 
 * Registers chainhooks for V3 contracts on Hiro Platform
 * Uses direct HTTP API calls with the correct Hiro Platform format
 */

import { request } from 'undici';

const API_KEY = process.env.HIRO_API_KEY;
const API_URL = `https://api.platform.hiro.so/v1/ext/${API_KEY}/chainhooks`;
const WEBHOOK_BASE_URL = 'https://stackpulse-b8fw.onrender.com/api/chainhooks';

// StackPulse V3 contract addresses
const CONTRACTS = {
  registry: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.stackpulse-v3',
  alertManager: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.alert-manager-v3',
  feeVault: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.fee-vault-v3',
  badges: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.reputation-badges-v3',
  alexDex: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool-v1-1'
};

// Get current block height - should be updated before running
// Use: curl https://api.mainnet.hiro.so/v2/info | jq '.stacks_tip_height'
const START_BLOCK = 5403581;

// V3 Chainhook definitions in Hiro Platform format
const CHAINHOOKS = [
  // Print event chainhooks for tracking contract events
  {
    name: 'StackPulse-V3-Registrations',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.registry,
          contains: 'user-registered'
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
    name: 'StackPulse-V3-AlertsTriggered',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.alertManager,
          contains: 'alert-triggered'
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
    name: 'StackPulse-V3-FeesCollected',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.feeVault,
          contains: 'fee-collected'
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
    name: 'StackPulse-V3-BadgesEarned',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'print_event',
          contract_identifier: CONTRACTS.badges,
          contains: 'badge-earned'
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
    name: 'StackPulse-V3-NewSubscriptions',
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
    name: 'StackPulse-V3-UpgradeSubscriptions',
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
    name: 'StackPulse-V3-CreateAlert',
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
  },
  // Blockchain-wide monitoring chainhooks
  {
    name: 'StackPulse-V3-WhaleTransfers',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'stx_event',
          actions: ['transfer']
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/whale-transfer`,
            authorization_header: ''
          }
        },
        start_block: START_BLOCK,
        decode_clarity_values: true
      }
    }
  },
  {
    name: 'StackPulse-V3-LargeSwaps',
    chain: 'stacks',
    version: 1,
    networks: {
      mainnet: {
        if_this: {
          scope: 'contract_call',
          contract_identifier: CONTRACTS.alexDex,
          method: 'swap-helper'
        },
        then_that: {
          http_post: {
            url: `${WEBHOOK_BASE_URL}/large-swap`,
            authorization_header: 'Bearer stackpulse-secret'
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
      return { success: true, uuid: data.chainhookUuid || data.uuid || data.id };
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

async function deleteChainhook(uuid: string): Promise<boolean> {
  try {
    const response = await request(`${API_URL}/${uuid}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': API_KEY!
      }
    });
    return response.statusCode === 200 || response.statusCode === 204;
  } catch (error) {
    console.error('Error deleting chainhook:', error);
    return false;
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ HIRO_API_KEY environment variable is required');
    console.error('   Usage: HIRO_API_KEY=your_key npx ts-node scripts/register-stackpulse-chainhooks-v3.ts');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         StackPulse V3 Chainhooks Registration                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('📋 V3 Contract Addresses:');
  console.log(`   Registry:      ${CONTRACTS.registry}`);
  console.log(`   Alert Manager: ${CONTRACTS.alertManager}`);
  console.log(`   Fee Vault:     ${CONTRACTS.feeVault}`);
  console.log(`   Badges:        ${CONTRACTS.badges}`);
  console.log('');

  // First check existing chainhooks
  console.log('📋 Checking existing chainhooks...');
  const existing = await listChainhooks();
  const stackpulseHooks = existing.filter((h: any) => h.name?.startsWith('StackPulse-'));
  const v3Hooks = stackpulseHooks.filter((h: any) => h.name?.includes('-V3-'));
  const v2Hooks = stackpulseHooks.filter((h: any) => !h.name?.includes('-V3-'));
  const existingV3Names = new Set(v3Hooks.map((h: any) => h.name));
  
  if (v2Hooks.length > 0) {
    console.log(`\n⚠️  Found ${v2Hooks.length} existing V2 chainhooks:`);
    v2Hooks.forEach((h: any) => {
      console.log(`   - ${h.name} (${h.uuid})`);
    });
    console.log('\n   Note: V2 chainhooks will remain active. Delete manually if needed.\n');
  }

  if (v3Hooks.length > 0) {
    console.log(`\n✅ Found ${v3Hooks.length} existing V3 chainhooks:`);
    v3Hooks.forEach((h: any) => {
      console.log(`   - ${h.name} (${h.uuid})`);
    });
    console.log('\n');
  }

  // Register new V3 chainhooks (skip already registered)
  console.log('🚀 Registering V3 chainhooks...\n');
  
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const hook of CHAINHOOKS) {
    // Skip if already registered
    if (existingV3Names.has(hook.name)) {
      console.log(`  ⏭️  Skipping: ${hook.name} (already registered)`);
      skipped++;
      continue;
    }
    
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
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (success > 0 || skipped > 0) {
    console.log('\n📋 Verifying registration...');
    const updatedList = await listChainhooks();
    const newV3Hooks = updatedList.filter((h: any) => h.name?.includes('-V3-'));
    console.log(`\n🎉 Total V3 chainhooks now registered: ${newV3Hooks.length}`);
    newV3Hooks.forEach((h: any) => {
      console.log(`   ✅ ${h.name}`);
    });
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    V3 Migration Complete!                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n📝 Next Steps:');
  console.log('   1. Deploy V3 contracts to mainnet');
  console.log('   2. Update frontend environment variables');
  console.log('   3. Deploy frontend to Vercel');
  console.log('   4. Deploy backend to Render');
  console.log('   5. Test end-to-end flow\n');
}

main().catch(console.error);
