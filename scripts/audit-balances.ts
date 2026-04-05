import * as fs from 'fs';

const CONSOLIDATION_ADDRESS = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';
const FIXED_FEE_USTX = 1000; // 0.001 STX fee reserved in each source wallet

async function run() {
    const data = JSON.parse(fs.readFileSync('./scripts/test-wallets.json', 'utf8'));
    const wallets = data.wallets;
    const totalWallets = wallets.length;

    console.log(`\n===========================================`);
    console.log(`STX BALANCE AUDIT`);
    console.log(`Sweep destination: ${CONSOLIDATION_ADDRESS}`);
    console.log(`Wallets queued: ${totalWallets}`);
    console.log(`===========================================\n`);

    let totalBalanceUstx = 0;
    let totalSweepableUstx = 0;

    for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        try {
            const res: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${w.address}/balances`).then(r => r.json());
            const balanceUstx = parseInt(res.stx.balance);
            const sweepableUstx = w.address === CONSOLIDATION_ADDRESS ? 0 : Math.max(0, balanceUstx - FIXED_FEE_USTX);

            totalBalanceUstx += balanceUstx;
            totalSweepableUstx += sweepableUstx;

            console.log(
                `[${i + 1}/${totalWallets}] ${w.address}: ${(balanceUstx / 1000000).toFixed(6)} STX balance, ${(sweepableUstx / 1000000).toFixed(6)} STX sweepable`
            );
        } catch (e) {
            console.error(`[${i + 1}/${totalWallets}] ${w.address}: Failed to fetch balance`);
        }
    }

    console.log(`\n-------------------------------------------`);
    console.log(`TOTAL BALANCE: ${(totalBalanceUstx / 1000000).toFixed(6)} STX`);
    console.log(`TOTAL SWEEPABLE TO ${CONSOLIDATION_ADDRESS}: ${(totalSweepableUstx / 1000000).toFixed(6)} STX`);
    console.log(`-------------------------------------------\n`);
}

run();
