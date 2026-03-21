import { makeSTXTokenTransfer, broadcastTransaction, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const AMOUNT_MICRO_STX = 38000; // 0.038 STX

async function run() {
    const walletsPath = './scripts/test-wallets.json';
    if (!fs.existsSync(walletsPath)) {
        console.error(`Error: Wallets file not found at ${walletsPath}`);
        console.log("Please create a 'test-wallets.json' file in the scripts directory with the following structure:");
        console.log(JSON.stringify({ wallets: [{ address: "ST...", privateKey: "..." }] }, null, 2));
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
    const wallets = data.wallets.slice(0, 25);
    
    if (wallets.length === 0 || !wallets[0].privateKey) {
        console.error("Error: No wallets found or first wallet missing privateKey.");
        process.exit(1);
    }

    const SENDER_KEY = wallets[0].privateKey;
    const SENDER_ADDRESS = wallets[0].address;

    let nonceRes: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${SENDER_ADDRESS}/nonces`).then(r => r.json());
    let nonce = nonceRes.possible_next_nonce;

    console.log(`Starting funding for ${wallets.length - 1} wallets from ${SENDER_ADDRESS}...`);

    for (let i = 1; i < wallets.length; i++) {
        const w = wallets[i];
        console.log(`[${i}/${wallets.length - 1}] Funding ${w.address} (Nonce: ${nonce})`);

        try {
            const tx = await makeSTXTokenTransfer({
                recipient: w.address,
                amount: AMOUNT_MICRO_STX,
                senderKey: SENDER_KEY,
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
