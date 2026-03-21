import * as fs from 'fs';

async function run() {
    const data = JSON.parse(fs.readFileSync('./scripts/test-wallets.json', 'utf8'));
    const wallets = data.wallets.slice(0, 25);

    console.log(`\n===========================================`);
    console.log(`STX BALANCE AUDIT`);
    console.log(`===========================================\n`);

    let totalSTX = 0;

    for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        try {
            const res: any = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${w.address}/balances`).then(r => r.json());
            const balance = parseInt(res.stx.balance) / 1000000;
            totalSTX += balance;
            console.log(`[${i + 1}/25] ${w.address}: ${balance.toFixed(6)} STX`);
        } catch (e) {
            console.error(`[${i + 1}/25] ${w.address}: Failed to fetch balance`);
        }
    }

    console.log(`\n-------------------------------------------`);
    console.log(`TOTAL RECOVERABLE: ${totalSTX.toFixed(6)} STX`);
    console.log(`-------------------------------------------\n`);
}

run();
