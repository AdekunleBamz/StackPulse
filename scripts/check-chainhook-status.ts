#!/usr/bin/env npx ts-node
/**
 * Chainhook Status Checker for StackPulse
 * 
 * Checks if:
 * 1. Server is healthy
 * 2. All chainhook endpoints exist
 * 3. Endpoints respond correctly
 * 
 * Usage:
 *   npx ts-node scripts/check-chainhook-status.ts
 */

const SERVER_URL = process.env.SERVER_URL || 'https://stackpulse-b8fw.onrender.com';

const CHAINHOOK_ENDPOINTS = [
  { name: 'Whale Transfer', path: '/api/chainhooks/whale-transfer' },
  { name: 'Contract Deployed', path: '/api/chainhooks/contract-deployed' },
  { name: 'NFT Mint', path: '/api/chainhooks/nft-mint' },
  { name: 'Token Launch', path: '/api/chainhooks/token-launch' },
  { name: 'Large Swap', path: '/api/chainhooks/large-swap' },
  { name: 'Subscription Created', path: '/api/chainhooks/subscription-created' },
  { name: 'Alert Triggered', path: '/api/chainhooks/alert-triggered' },
  { name: 'Fee Collected', path: '/api/chainhooks/fee-collected' },
  { name: 'Badge Earned', path: '/api/chainhooks/badge-earned' },
];

async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

async function checkEndpoint(path: string): Promise<{ exists: boolean; authRequired: boolean }> {
  try {
    const response = await fetch(`${SERVER_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apply: [], rollback: [] }),
    });
    
    // 401 = endpoint exists, just needs auth
    // 200 = endpoint exists and accepts (unlikely without auth)
    // 404 = endpoint doesn't exist
    
    if (response.status === 401) {
      return { exists: true, authRequired: true };
    } else if (response.status === 200) {
      return { exists: true, authRequired: false };
    } else if (response.status === 404) {
      return { exists: false, authRequired: false };
    }
    
    return { exists: true, authRequired: false };
  } catch {
    return { exists: false, authRequired: false };
  }
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           StackPulse Chainhook Status Checker                ║
╚══════════════════════════════════════════════════════════════╝
`);

  console.log(`Server: ${SERVER_URL}\n`);

  // Check server health
  console.log('1️⃣  Checking server health...');
  const healthy = await checkHealth();
  if (healthy) {
    console.log('   ✅ Server is healthy\n');
  } else {
    console.log('   ❌ Server is NOT healthy or unreachable\n');
    process.exit(1);
  }

  // Check each endpoint
  console.log('2️⃣  Checking chainhook endpoints...\n');
  
  let allGood = true;
  
  for (const endpoint of CHAINHOOK_ENDPOINTS) {
    const result = await checkEndpoint(endpoint.path);
    
    if (result.exists && result.authRequired) {
      console.log(`   ✅ ${endpoint.name.padEnd(22)} - Ready (auth required)`);
    } else if (result.exists) {
      console.log(`   ⚠️  ${endpoint.name.padEnd(22)} - Ready (no auth - security risk!)`);
    } else {
      console.log(`   ❌ ${endpoint.name.padEnd(22)} - NOT FOUND`);
      allGood = false;
    }
  }

  console.log(`\n${'─'.repeat(60)}\n`);

  // Summary
  if (allGood) {
    console.log(`✅ All ${CHAINHOOK_ENDPOINTS.length} chainhook endpoints are ready!`);
    console.log(`
⚠️  IMPORTANT: Endpoints being "ready" doesn't mean chainhooks are ACTIVE.

To activate chainhooks, you need to register them with Hiro Platform:

1. Go to https://platform.hiro.so
2. Sign up / Sign in  
3. Get your API key
4. Run: HIRO_API_KEY=your-key npx ts-node scripts/register-chainhooks.ts

Or use the Hiro Platform dashboard to manually add each chainhook.
`);
  } else {
    console.log('❌ Some endpoints are missing. Check your server code.');
  }
}

main().catch(console.error);
