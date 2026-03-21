import { makeSTXTokenTransfer, broadcastTransaction, AnchorMode, PostConditionMode, getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
import { generateSecretKey, generateWallet } from '@stacks/wallet-sdk';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const AMOUNT_MICRO_STX = 38000; // 0.038 STX

async function run() {
    const walletsPath = './scripts/test-wallets.json';
    if (!fs.existsSync(walletsPath)) {
        console.log(`Wallets file not found at ${walletsPath}. Generating new test wallets...`);
        const wallets = [];
        for (let i = 0; i < 25; i++) {
            const secretKey = generateSecretKey(256);
            const wallet = await generateWallet({ secretKey, password: 'password' });
            const account = wallet.accounts[0];
            const privateKey = account.stxPrivateKey;
            const address = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);
            
            wallets.push({
                address,
                privateKey,
                mnemonic: secretKey
            });
        }
        
        fs.writeFileSync(walletsPath, JSON.stringify({ wallets }, null, 2));
        console.log(`✅ Generated 25 test wallets and saved to ${walletsPath}`);
        console.log(`\n⚠️  ACTION REQUIRED: Wallet 1 (${wallets[0].address}) will be used to fund the other wallets.`);
        console.log(`Please send some STX (e.g. 2 STX) to: ${wallets[0].address}`);
        console.log(`Once funded, run this script again to distribute funds to the remaining 24 test wallets.\n`);
        process.exit(0);
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
