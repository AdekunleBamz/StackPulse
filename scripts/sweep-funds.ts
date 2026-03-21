import { makeSTXTokenTransfer, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const DEPLOYER_ADDRESS = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';
const FIXED_FEE = 1000; // 0.001 STX fee per sweep

async function generateAccountKey(mnemonic: string) {
    const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
    return wallet.accounts[0].stxPrivateKey;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    const data = JSON.parse(fs.readFileSync('./scripts/test-wallets.json', 'utf8'));
    const wallets = data.wallets.slice(0, 25);

    console.log(`\n===========================================`);
    console.log(`STX FUND CONSOLIDATION (SWEEP)`);
    console.log(`===========================================\n`);

    for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        try {
            const balanceRes: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${w.address}/balances`).then(r => r.json());
            const balance = parseInt(balanceRes.stx.balance);

            if (balance > FIXED_FEE) {
                const amountToSweep = balance - FIXED_FEE;
                console.log(`[${i + 1}/25] Sweeping ${amountToSweep / 1000000} STX from ${w.address}...`);

                const privateKey = await generateAccountKey(w.mnemonic);
                const nonceRes: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${w.address}/nonces`).then(r => r.json());
                const nonce = nonceRes.possible_next_nonce;

                const tx = await makeSTXTokenTransfer({
                    recipient: DEPLOYER_ADDRESS,
                    amount: amountToSweep,
                    senderKey: privateKey,
                    network,
                    nonce,
                    fee: FIXED_FEE,
                    anchorMode: AnchorMode.Any,
                });

                const res = await broadcastTransaction(tx, network);
                console.log(`   TXID: ${res.txid || JSON.stringify(res)}`);

                // Wait 3 seconds between broadcasts to avoid rate limits
                await delay(3000);
            } else {
                console.log(`[${i + 1}/25] ${w.address}: Insufficient balance for sweep (${balance / 1000000} STX)`);
            }
        } catch (e: any) {
            console.error(`[${i + 1}/25] ${w.address}: Error: ${e.message}`);
        }
    }

    console.log(`\n🎉 Sweep process complete.`);
}

run();
