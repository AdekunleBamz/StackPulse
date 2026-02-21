import { makeSTXTokenTransfer, broadcastTransaction, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const DEPLOYER_KEY = '36d230b26febd3291768ada53aee49d8e395d3ef3c0b8598e4263b44338cf24a0101'; // Compressed PK format
const AMOUNT_MICRO_STX = 38000; // 0.038 STX

async function run() {
    const data = JSON.parse(fs.readFileSync('/Users/apple/aegis-vault/scripts/test-wallets.json', 'utf8'));
    const wallets = data.wallets.slice(0, 25);

    let nonceRes: any = await fetch("https://api.mainnet.hiro.so/extended/v1/address/SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT/nonces").then(r => r.json());
    let nonce = nonceRes.possible_next_nonce;

    console.log(`Starting funding for 25 wallets with 0.038 STX each...`);

    for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        console.log(`[${i + 1}/25] Funding ${w.address} (Nonce: ${nonce})`);

        try {
            const tx = await makeSTXTokenTransfer({
                recipient: w.address,
                amount: AMOUNT_MICRO_STX,
                senderKey: DEPLOYER_KEY,
                network,
                nonce,
                fee: 250,
                anchorMode: AnchorMode.Any,
            });

            const res = await broadcastTransaction(tx, network);
            console.log(`   Result: ${res.txid || JSON.stringify(res)}`);
            nonce++;
        } catch (e) {
            console.error(`   Failed:`, e);
        }
    }
}

run();
