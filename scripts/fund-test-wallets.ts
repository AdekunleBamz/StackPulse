import { makeSTXTokenTransfer, broadcastTransaction, AnchorMode, getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
import { generateSecretKey, generateWallet } from '@stacks/wallet-sdk';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const AMOUNT_MICRO_STX = 120000; // 0.12 STX
const TX_FEE_USTX = 1000; // 0.001 STX
const WALLET_COUNT = 25;

async function derivePrivateKeyFromMnemonic(mnemonic: string) {
    const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
    const account = wallet.accounts[0];
    return account.stxPrivateKey;
}

async function run() {
    const walletsPath = './scripts/test-wallets.json';
    if (!fs.existsSync(walletsPath)) {
        console.log(`Wallets file not found at ${walletsPath}. Generating new test wallets...`);
        const wallets = [];
        for (let i = 0; i < WALLET_COUNT; i++) {
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
        console.log(`✅ Generated ${WALLET_COUNT} test wallets and saved to ${walletsPath}`);
        console.log(`\n⚠️  ACTION REQUIRED: Wallet 1 (${wallets[0].address}) will be used to fund the other wallets.`);
        console.log(`Please send some STX (e.g. 2 STX) to: ${wallets[0].address}`);
        console.log(`Once funded, run this script again to distribute funds to the remaining ${WALLET_COUNT - 1} test wallets.\n`);
        process.exit(0);
    }

    const data = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
    const wallets = data.wallets.slice(0, WALLET_COUNT);
    
    if (wallets.length === 0) {
        console.error("Error: No wallets found in test-wallets.json.");
        process.exit(1);
    }

    const firstWallet = wallets[0];
    let SENDER_KEY = firstWallet.privateKey;
    const SENDER_ADDRESS = firstWallet.address;

    // Backward-compatible with wallet files that only store mnemonic + address.
    if (!SENDER_KEY && firstWallet.mnemonic) {
        SENDER_KEY = await derivePrivateKeyFromMnemonic(firstWallet.mnemonic);
        console.log("Derived sender private key from mnemonic in test-wallets.json.");
    }

    if (!SENDER_KEY || !SENDER_ADDRESS) {
        console.error("Error: First wallet must include address and either privateKey or mnemonic.");
        process.exit(1);
    }

    let nonceRes: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${SENDER_ADDRESS}/nonces`).then(r => r.json());
    let nonce = nonceRes.possible_next_nonce;

    console.log(`Starting funding for ${wallets.length - 1} wallets from ${SENDER_ADDRESS}...`);
    console.log(`- Per wallet transfer: ${AMOUNT_MICRO_STX} uSTX (0.12 STX)`);
    console.log(`- Gas fee per tx: ${TX_FEE_USTX} uSTX (0.001 STX)`);

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
                fee: TX_FEE_USTX,
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
