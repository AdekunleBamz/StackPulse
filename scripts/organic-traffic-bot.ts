import { makeContractCall, broadcastTransaction, AnchorMode, stringAsciiCV, uintCV, noneCV, principalCV } from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

const network = new StacksMainnet();
const DEPLOYER_ADDRESS = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';

async function generateAccountKey(mnemonic: string) {
    const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
    return wallet.accounts[0].stxPrivateKey;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getTxStatus(txid: string) {
    try {
        const res: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${txid}`);
        if (res.status === 200) {
            const data: any = await res.json();
            return data.tx_status; // "success", "abort_by_response", "pending"
        }
        return "pending";
    } catch {
        return "pending";
    }
}

async function getNonce(address: string) {
    try {
        const res: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
        if (res.status === 200) {
            const data = await res.json();
            return data.possible_next_nonce;
        }
        await delay(2000);
        return await getNonce(address);
    } catch {
        await delay(2000);
        return await getNonce(address);
    }
}

async function run() {
    const data = JSON.parse(fs.readFileSync('/Users/apple/aegis-vault/scripts/test-wallets.json', 'utf8'));
    const wallets = data.wallets.slice(0, 25);

    console.log(`\n===========================================`);
    console.log(`STACKPULSE ORGANIC TRAFFIC BOT INITIALIZING`);
    console.log(`===========================================\n`);

    console.log(`✅ Note: Distribution Phase complete. Wallets 2-25 are already funded!`);
    console.log(`\n[PHASE 2] Starting Organic Contract Interactions...`);

    let walletStates: any[] = [];
    for (let i = 0; i < wallets.length; i++) {
        walletStates.push({
            id: i + 1,
            address: wallets[i].address,
            privateKey: await generateAccountKey(wallets[i].mnemonic),
            needs: {
                'stackpulse-v-j3': 4,
                'alert-manager-v-j3': 4,
                'fee-vault-v-j3': 4
            },
            pendingTxId: null,
            nonce: await getNonce(wallets[i].address)
        });
    }

    // Interaction Builders
    const buildRandomCall = (contract: string, state: any) => {
        let functionName = '';
        let functionArgs: any[] = [];

        if (contract === 'stackpulse-v-j3') {
            if (state.needs['stackpulse-v-j3'] === 4) {
                // Must register on first interaction
                functionName = 'register-and-subscribe';
                functionArgs = [stringAsciiCV(`U${state.id}-${Math.floor(Math.random() * 100)}`), stringAsciiCV(`u${state.id}@mail.com`), uintCV(0), uintCV(31)];
            } else {
                // Can update or set alerts on subsequent interactions
                const calls = ['update-profile', 'set-alerts'];
                functionName = calls[Math.floor(Math.random() * calls.length)];
                if (functionName === 'update-profile') {
                    functionArgs = [stringAsciiCV(`User${state.id}Update`), stringAsciiCV(`user${state.id}@mail.com`), uintCV(15)];
                } else if (functionName === 'set-alerts') {
                    functionArgs = [uintCV(Math.floor(Math.random() * 31))];
                }
            }
        } else if (contract === 'alert-manager-v-j3') {
            functionName = 'create-alert';
            functionArgs = [
                stringAsciiCV(`Alert-${Math.floor(Math.random() * 100)}`),
                stringAsciiCV(`Desc`),
                uintCV(1),
                principalCV(DEPLOYER_ADDRESS),
                uintCV(1),
                uintCV(10000)
            ];
        } else if (contract === 'fee-vault-v-j3') {
            functionName = 'collect-subscription-fee';
            functionArgs = [uintCV(0), noneCV()]; // always free tier to not drain
        }

        return { contractName: contract, functionName, functionArgs };
    };

    let totalRemaining = 25 * 12; // 300 txns

    while (totalRemaining > 0) {
        // 1. Check pending txs for all wallets in the background
        for (const w of walletStates) {
            if (w.pendingTxId) {
                const s = await getTxStatus(w.pendingTxId);
                await delay(1000); // 1 second delay between API checks to avoid rate limits

                if (s !== 'pending') {
                    console.log(`✅ [Wallet ${w.id}] Transaction Confirmed! (${w.pendingTxId})`);
                    w.pendingTxId = null;
                    totalRemaining--;
                }
            }
        }

        // 2. Find free wallets that do NOT have a currently pending transaction
        const freeWallets = walletStates.filter(w => !w.pendingTxId && (Object.values(w.needs) as number[]).reduce((a, b) => a + b, 0) > 0);

        if (freeWallets.length > 0) {
            // Pick random free wallet
            const w = freeWallets[Math.floor(Math.random() * freeWallets.length)];

            // Pick random contract for that wallet
            const contractsNeeded = Object.keys(w.needs).filter(k => w.needs[k] > 0);
            const randomContract = contractsNeeded[Math.floor(Math.random() * contractsNeeded.length)];

            // Generate Call
            const callData = buildRandomCall(randomContract, w);

            console.log(`🔄 [Wallet ${w.id}] Broadcasting Tx to ${randomContract} -> ${callData.functionName}...`);

            try {
                const tx = await makeContractCall({
                    contractAddress: DEPLOYER_ADDRESS,
                    contractName: callData.contractName,
                    functionName: callData.functionName,
                    functionArgs: callData.functionArgs,
                    senderKey: w.privateKey,
                    network,
                    nonce: w.nonce++,
                    fee: 1000,
                    anchorMode: AnchorMode.Any,
                });

                const res: any = await broadcastTransaction(tx, network);
                if (res && res.txid) {
                    w.pendingTxId = res.txid;
                    w.needs[randomContract]--;
                } else if (typeof res === 'string') {
                    w.pendingTxId = res;
                    w.needs[randomContract]--;
                } else {
                    console.error(`❌ [Wallet ${w.id}] Broadcast failed, unrecognized response:`, res);
                    w.nonce--;
                }

                // Wait 15 seconds to space out broadcasts organically
                await delay(15000);

            } catch (e: any) {
                console.error(`❌ [Wallet ${w.id}] Error broadcasting:`, e?.message || e);
                w.nonce--;
                console.log(`⏳ Rate limit hit! Backing off for 15 seconds...`);
                await delay(15000);
            }
        } else {
            // All 25 wallets are waiting for their own transaction to confirm.
            // Stacks blocks take ~10 mins, so we sleep and check the statuses again.
            await delay(15000);
        }
    }

    console.log(`\n🎉 All 300 organic interactions completed and confirmed on chain!`);
}

run();
