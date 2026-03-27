import {
  StackPulseClient,
  TIER_PRICES_MICRO_STX,
  normalizeCvValue,
} from 'stackpulse-sdk';

const FALLBACK_DEPLOYER = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';

export const STACKPULSE_DEPLOYER = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || FALLBACK_DEPLOYER;

export const stackpulseSdk = new StackPulseClient({
  network: 'mainnet',
  deployerAddress: STACKPULSE_DEPLOYER,
});

export { TIER_PRICES_MICRO_STX, normalizeCvValue };
