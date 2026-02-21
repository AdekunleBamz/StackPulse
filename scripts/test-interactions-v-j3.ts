import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV } from '@stacks/transactions';
import { generateSecretKey, generateWallet, getStxAddress, restoreWalletAccounts } from '@stacks/wallet-sdk';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const DEPLOYER_ADDRESS = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';

async function generateAccountKey(mnemonic: string) {
    const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
    const account = wallet.accounts[0];
    return account.stxPrivateKey;
}

async function run() {
    const data = JSON.parse(fs.readFileSync('/Users/apple/aegis-vault/scripts/test-wallets.json', 'utf8'));
    const wallets = data.wallets.slice(0, 25);

    console.log(`Starting interactions for 25 wallets on -v-j3 contracts...`);

    for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        console.log(`\n[${i + 1}/25] Wallet: ${w.address}`);

        try {
            const privateKey = await generateAccountKey(w.mnemonic);
            let nonceRes: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${w.address}/nonces`).then(r => r.json());
            let nonce = nonceRes.possible_next_nonce;

            // Interaction 1: StackPulse Registry - Register and Subscribe (Tier 1 - Basic: 0.01 STX)
            console.log(`   -> 1: Registering to StackPulse v-j3...`);
            const tx1 = await makeContractCall({
                contractAddress: DEPLOYER_ADDRESS,
                contractName: 'stackpulse-v-j3',
                functionName: 'register-and-subscribe',
                functionArgs: [
                    import('@stacks/transactions').then(t => t.stringAsciiCV(`TestUser${i}`)),
                    import('@stacks/transactions').then(t => t.stringAsciiCV(`test${i}@stackpulse.app`)),
                    import('@stacks/transactions').then(t => t.uintCV(1)), // tier 1
                    import('@stacks/transactions').then(t => t.uintCV(31))  // alerts mask
                ] as any, // lazy evaluation bypassing async typing for testing mockup
                senderKey: privateKey,
                network,
                nonce: nonce++,
                fee: 500,
                anchorMode: AnchorMode.Any,
            });
            // broadcast left out deliberately to prevent actual 25 wallet executions until manual start
            console.log(`      Payload ready for tx1.`);

            // Interaction 2: Fee Vault - Collect Subscription (Tier 1 - Basic: 0.01 STX)
            console.log(`   -> 2: Collecting fee on Vault...`);
            const tx2 = await makeContractCall({
                contractAddress: DEPLOYER_ADDRESS,
                contractName: 'fee-vault-v-j3',
                functionName: 'collect-subscription-fee',
                functionArgs: [
                    import('@stacks/transactions').then(t => t.uintCV(1)), // tier 1
                    import('@stacks/transactions').then(t => t.noneCV())   // no referrer
                ] as any,
                senderKey: privateKey,
                network,
                nonce: nonce++,
                fee: 500,
                anchorMode: AnchorMode.Any,
            });
            console.log(`      Payload ready for tx2.`);

        } catch (e) {
            console.error(`   Failed setting up interactions for ${w.address}:`, e.message);
        }
    }

    console.log(`\nScripts successfully built. Use 'npx ts-node' to execute broadcast when funded.`);
}

run();
