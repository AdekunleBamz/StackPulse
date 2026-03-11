/**
 * Register Chainhooks Script
 * Registers all chainhooks with the Chainhook server
 */

import { ChainhooksClient } from '@hirosystems/chainhooks-client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Chainhook server configuration
const CHAINHOOK_SERVER_URL = process.env.CHAINHOOK_SERVER_URL || 'http://localhost:20443';
const CHAINHOOK_API_KEY = process.env.CHAINHOOK_API_KEY || 'dev-key';

/**
 * Load and register all chainhooks
 */
async function registerChainhooks() {
  console.log('🚀 Registering chainhooks...');
  
  const client = new ChainhooksClient({
    baseUrl: CHAINHOOK_SERVER_URL,
    apiKey: CHAINHOOK_API_KEY
  });

  // Chainhook files to register
  const chainhookFiles = [
    '1-whale-transfer-alert.json',
    '2-new-contract-deployed.json',
    '3-nft-mint-tracker.json',
    '4-token-launch-detector.json',
    '5-large-swap-alert.json',
    '6-user-subscription-created.json',
    '7-alert-triggered.json',
    '8-fee-collected.json',
    '9-badge-earned.json'
  ];

  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  for (const filename of chainhookFiles) {
    try {
      const filePath = join(__dirname, '../../../chainhooks', filename);
      const chainhookData = readFileSync(filePath, 'utf-8');
      const chainhook = JSON.parse(chainhookData);

      console.log(`📝 Registering ${filename}...`);
      
      const result = await client.registerChainhook(chainhook);
      console.log(`✅ ${filename} registered successfully: ${result.uuid}`);
      
      results.push({ name: filename, success: true });
    } catch (error) {
      console.error(`❌ Failed to register ${filename}:`, error);
      results.push({ 
        name: filename, 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Summary
  console.log('\n📊 Registration Summary:');
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ Successfully registered: ${successCount}/${totalCount}`);
  
  if (successCount < totalCount) {
    console.log('\n❌ Failed registrations:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }

  return results;
}

// Run the script
if (require.main === module) {
  registerChainhooks()
    .then(() => {
      console.log('\n🎉 Chainhook registration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Chainhook registration failed:', error);
      process.exit(1);
    });
}

export { registerChainhooks };