const V3_DEPLOYER_ADDRESS = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';
const V4_DEPLOYER_ADDRESS = 'SP1THTSTZ8RQGD8R3GKPGK3ABQ908BD8X85P3J6X9';

type ContractVersion = 'v-j3' | 'v-j4';

function normalizeEnvValue(value?: string): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getConfiguredVersion(): ContractVersion {
  const explicitVersion = normalizeEnvValue(process.env.NEXT_PUBLIC_STACKPULSE_CONTRACT_VERSION);
  if (explicitVersion === 'v-j3' || explicitVersion === 'v-j4') {
    return explicitVersion;
  }

  return 'v-j4';
}

function getConfiguredDeployerAddress(version: ContractVersion): string {
  const deployerAddress = normalizeEnvValue(process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS).toUpperCase();

  if (version === 'v-j3') {
    return deployerAddress || V3_DEPLOYER_ADDRESS;
  }

  if (!deployerAddress || deployerAddress === V3_DEPLOYER_ADDRESS) {
    return V4_DEPLOYER_ADDRESS;
  }

  return deployerAddress;
}

const contractVersion = getConfiguredVersion();

export const DEPLOYER_ADDRESS = getConfiguredDeployerAddress(contractVersion);

export const CONTRACT_NAMES = {
  stackpulse:
    normalizeEnvValue(process.env.NEXT_PUBLIC_STACKPULSE_CONTRACT_NAME) ||
    `stackpulse-${contractVersion}`,
  alertManager:
    normalizeEnvValue(process.env.NEXT_PUBLIC_ALERT_MANAGER_CONTRACT_NAME) ||
    `alert-manager-${contractVersion}`,
  feeVault:
    normalizeEnvValue(process.env.NEXT_PUBLIC_FEE_VAULT_CONTRACT_NAME) ||
    `fee-vault-${contractVersion}`,
  reputationBadges:
    normalizeEnvValue(process.env.NEXT_PUBLIC_REPUTATION_BADGES_CONTRACT_NAME) ||
    `reputation-badges-${contractVersion}`,
} as const;
