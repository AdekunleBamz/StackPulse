/**
 * StackPulse Chainhook Event Server
 * Handles incoming blockchain events from Hiro Chainhooks
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

// Import Stacks utilities using @stacks/transactions and @stacks/connect
import {
  parseWhaleTransfer,
  parseContractDeployment,
  parseNFTMint,
  formatSTX
} from './utils/stacks';

// Import notification services
import {
  broadcastNotification,
  saveUserPreferences,
  getUserPreferences,
  getAllUsers,
  deleteUserPreferences
} from './services/notifications';
import { tieredApiLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import db from './services/db';
import { clearOldData } from './services/analytics';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Initialize Express app
const app = express();
const DEFAULT_PORT = 3000;
const PORT = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

// Middleware
app.use(helmet());
app.use(cors());
const JSON_BODY_LIMIT = '10mb';
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(requestLogger());

// Authentication middleware for chainhook endpoints.
// If CHAINHOOK_AUTH_TOKEN is configured, requests must provide a matching bearer token.
const authenticateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CHAINHOOK_AUTH_TOKEN;
  
  if (!expectedToken) {
    return next();
  }

  if (!authHeader) {
    logger.warn('Webhook request missing authorization header', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    logger.warn('Webhook request with invalid authorization token', { ip: req.ip, path: req.path });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};

// ============================================
// CHAINHOOK EVENT TYPES
// ============================================

interface ChainhookPayload {
  apply: Array<{
    block_identifier: {
      index: number;
      hash: string;
    };
    transactions: Array<{
      transaction_identifier: { hash: string };
      metadata: {
        success: boolean;
        sender: string;
        fee: number;
        kind: {
          type?: string;
          data?: Record<string, unknown>;
        };
        receipt: {
          events: Array<{
            type?: string;
            data?: Record<string, unknown>;
          }>;
        };
      };
    }>;
  }>;
  rollback?: Array<Record<string, unknown>>;
  chainhook: {
    uuid: string;
    predicate: Record<string, unknown>;
  };
}

function getPrintEventData(event: { type?: string; data?: Record<string, unknown> }): Record<string, unknown> | null {
  if (event.type !== 'SmartContractEvent') {
    return null;
  }
  const rawValue = event.data?.value;
  if (!rawValue || typeof rawValue !== 'object') {
    return null;
  }
  return rawValue as Record<string, unknown>;
}

function getStringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function getNumberField(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' ? value : null;
}

// Event statistics
const eventStats = {
  whaleTransfers: 0,
  contractDeployments: 0,
  nftMints: 0,
  tokenLaunches: 0,
  largeSwaps: 0,
  subscriptions: 0,
  alertsTriggered: 0,
  feesCollected: 0,
  badgesEarned: 0
};

// ============================================
// CHAINHOOK ENDPOINTS
// ============================================

const CHAINHOOK_ENDPOINTS = {
  whaleTransfer: '/api/v1/chainhooks/whale-transfer',
  contractDeployed: '/api/v1/chainhooks/contract-deployed',
  nftMint: '/api/v1/chainhooks/nft-mint',
  tokenLaunch: '/api/v1/chainhooks/token-launch',
  largeSwapAlert: '/api/v1/chainhooks/large-swap-alert',
  subscriptionCreated: '/api/v1/chainhooks/subscription-created',
  alertTriggered: '/api/v1/chainhooks/alert-triggered',
  feeCollected: '/api/v1/chainhooks/fee-collected',
  badgeEarned: '/api/v1/chainhooks/badge-earned',
  newSubscription: '/api/v1/chainhooks/new-subscription',
  subscriptionUpgrade: '/api/v1/chainhooks/subscription-upgrade',
  alertCreated: '/api/v1/chainhooks/alert-created',
} as const;

const REGISTERED_CHAINHOOK_NAMES = [
  'whale-transfer-alert',
  'new-contract-deployed',
  'nft-mint-tracker',
  'token-launch-detector',
  'large-swap-alert',
  'user-subscription-created',
  'alert-triggered',
  'fee-collected',
  'badge-earned',
  'new-subscription',
  'subscription-upgrade',
  'alert-created',
] as const;

// Helper: Process chainhook async and respond immediately to prevent timeout
const processAsync = (handler: (payload: ChainhookPayload) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    // Respond immediately with 202 Accepted to prevent Hiro timeout
    res.status(202).json({ status: 'accepted', message: 'Processing async' });
    
    // Process in background
    try {
      const payload: ChainhookPayload = req.body;
      if (payload && Array.isArray(payload.apply)) {
        await handler(payload);
      }
    } catch (error) {
      logger.error('Async processing error', { error });
    }
  };
};

// 1. Whale Transfer Alert
app.post(CHAINHOOK_ENDPOINTS.whaleTransfer, tieredApiLimiter, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        const transferData = parseWhaleTransfer(event);
        
        if (transferData) {
          const isMicroWhale = Number.parseFloat(transferData.amountSTX) < 100000;
          const emoji = isMicroWhale ? '🦐' : '🐋';
          const title = `${emoji} ${isMicroWhale ? 'Large' : 'Whale'} Transfer Detected`;

          logger.info(title, {
            amount: transferData.amountFormatted,
            amountSTX: transferData.amountSTX,
            sender: transferData.sender,
            recipient: transferData.recipient,
            txHash: tx.transaction_identifier.hash,
            block: block.block_identifier.index,
            isWhale: !isMicroWhale
          });
          
          await broadcastNotification({
            title,
            message: `${transferData.amountSTX} STX moved from ${transferData.sender.slice(0, 8)}... to ${transferData.recipient.slice(0, 8)}...`,
            type: 'whale',
            data: {
              'Transfer Amount': `${transferData.amountSTX} STX`,
              'Sender': transferData.sender,
              'Recipient': transferData.recipient,
              'Scale': isMicroWhale ? 'High Volume' : 'Ultra High Volume'
            },
            txHash: tx.transaction_identifier.hash,
            blockHeight: block.block_identifier.index
          });
          
          eventStats.whaleTransfers++;
        }
      }
    }
  }
}));

// 2. New Contract Deployed
app.post(CHAINHOOK_ENDPOINTS.contractDeployed, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const deploymentData = parseContractDeployment(tx);
      
      if (deploymentData) {
        logger.info('📜 New Contract Deployed', {
          contractId: deploymentData.contractId,
          contractName: deploymentData.contractName,
          deployer: deploymentData.deployer,
          txHash: tx.transaction_identifier.hash,
          block: block.block_identifier.index
        });
        
        await broadcastNotification({
          title: '📜 New Contract Deployed',
          message: `New contract ${deploymentData.contractName} deployed by ${deploymentData.deployer.slice(0, 8)}...`,
          type: 'contract',
          data: {
            'Contract': deploymentData.contractName,
            'Contract ID': deploymentData.contractId,
            'Deployer': deploymentData.deployer
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        });
        
        eventStats.contractDeployments++;
      }
    }
  }
}));

// 3. NFT Mint Tracker
app.post(CHAINHOOK_ENDPOINTS.nftMint, tieredApiLimiter, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        const nftData = parseNFTMint(event);
        
        if (nftData) {
          logger.info('🎨 NFT Minted', {
            assetId: nftData.assetIdentifier,
            assetName: nftData.assetName,
            tokenId: nftData.tokenId,
            recipient: nftData.recipient,
            contractAddress: nftData.contractAddress,
            txHash: tx.transaction_identifier.hash,
            block: block.block_identifier.index
          });
          
          await broadcastNotification({
            title: '🎨 NFT Minted',
            message: `${nftData.assetName} #${nftData.tokenId} minted to ${nftData.recipient.slice(0, 8)}...`,
            type: 'nft',
            data: {
              'Collection': nftData.assetName,
              'Token ID': nftData.tokenId,
              'Recipient': nftData.recipient
            },
            txHash: tx.transaction_identifier.hash,
            blockHeight: block.block_identifier.index
          });
          
          eventStats.nftMints++;
        }
      }
    }
  }
}));

// 4. Token Launch Detector
app.post(CHAINHOOK_ENDPOINTS.tokenLaunch, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      if (tx.metadata.kind?.type === 'ContractDeployment') {
        const contractId = tx.metadata.kind?.data?.contract_identifier;
        const deployer = tx.metadata.sender;
        
        logger.info('🪙 New Token Launched', {
          contractId,
          deployer,
          txHash: tx.transaction_identifier.hash,
          block: block.block_identifier.index
        });
        
        await broadcastNotification({
          title: '🪙 New Token Launched',
          message: `New token contract deployed: ${contractId}`,
          type: 'token',
          data: {
            'Contract': contractId,
            'Deployer': deployer
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        });
        
        eventStats.tokenLaunches++;
      }
    }
  }
}));

// 5. Large Swap Alert
app.post(CHAINHOOK_ENDPOINTS.largeSwapAlert, tieredApiLimiter, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      const ftEvents = events.filter((e) => e.type === 'FTTransferEvent');
      
      if (ftEvents.length >= 2) {
        logger.info('💱 Large Swap Detected', {
          swapper: tx.metadata.sender,
          txHash: tx.transaction_identifier.hash,
          block: block.block_identifier.index,
          events: ftEvents.length
        });
        
        await broadcastNotification({
          title: '💱 Large Swap Detected',
          message: `Large swap executed by ${tx.metadata.sender.slice(0, 8)}...`,
          type: 'swap',
          data: {
            'Swapper': tx.metadata.sender,
            'Events': ftEvents.length
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        });
        
        eventStats.largeSwaps++;
      }
    }
  }
}));

// 6. User Subscription Created
app.post(CHAINHOOK_ENDPOINTS.subscriptionCreated, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        const printData = getPrintEventData(event);
        if (!printData) continue;

        const eventName = getStringField(printData, 'event');
        if (eventName !== 'subscription-created') continue;

        const user = getStringField(printData, 'user');
        const tierValue = getNumberField(printData, 'tier');
        const priceValue = getNumberField(printData, 'price');
        if (!user || tierValue == null || priceValue == null) {
          logger.warn('Skipping malformed subscription-created print event', {
            txHash: tx.transaction_identifier.hash,
          });
          continue;
        }

        logger.info('✨ New Subscription', {
          user,
          tier: tierValue,
          price: priceValue,
          txHash: tx.transaction_identifier.hash
        });
        
        await broadcastNotification({
          title: '✨ Subscription Activated',
          message: `Welcome to StackPulse! Your tier ${tierValue} subscription is now active.`,
          type: 'subscription',
          data: {
            'Tier': tierValue,
            'Price': formatSTX(priceValue) + ' STX'
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        }, [user]);
        
        eventStats.subscriptions++;
      }
    }
  }
}));

// 7. Alert Triggered
app.post(CHAINHOOK_ENDPOINTS.alertTriggered, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        const printData = getPrintEventData(event);
        if (!printData) continue;

        const eventName = getStringField(printData, 'event');
        if (eventName !== 'alert-triggered') continue;

        const owner = getStringField(printData, 'owner');
        const alertId = getNumberField(printData, 'alert-id');
        const alertTypeRaw = printData['alert-type'];
        const alertType =
          typeof alertTypeRaw === 'string' || typeof alertTypeRaw === 'number'
            ? String(alertTypeRaw)
            : null;

        if (!owner || alertId == null || !alertType) {
          logger.warn('Skipping malformed alert-triggered print event', {
            txHash: tx.transaction_identifier.hash,
          });
          continue;
        }

        logger.info('🔔 Alert Triggered', {
          alertId,
          owner,
          alertType,
          txHash: tx.transaction_identifier.hash
        });
        
        await broadcastNotification({
          title: '🔔 Your Alert Was Triggered!',
          message: `Alert #${alertId} (${alertType}) has been triggered.`,
          type: 'alert',
          data: {
            'Alert ID': alertId,
            'Type': alertType
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        }, [owner]);
        
        eventStats.alertsTriggered++;
      }
    }
  }
}));

// 8. Fee Collected
app.post(CHAINHOOK_ENDPOINTS.feeCollected, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        const printData = getPrintEventData(event);
        if (!printData) continue;

        const eventName = getStringField(printData, 'event');
        if (eventName !== 'fee-collected') continue;

        const source = getStringField(printData, 'source');
        const amount = getNumberField(printData, 'amount');
        if (!source || amount == null) {
          logger.warn('Skipping malformed fee-collected print event', {
            txHash: tx.transaction_identifier.hash,
          });
          continue;
        }

        logger.info('💰 Fee Collected', {
          source,
          amount,
          txHash: tx.transaction_identifier.hash
        });
        
        await broadcastNotification({
          title: '💰 Fee Collected',
          message: `${formatSTX(amount)} STX collected from ${source}`,
          type: 'fee',
          data: {
            'Source': source,
            'Amount': formatSTX(amount) + ' STX'
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        });
        
        eventStats.feesCollected++;
      }
    }
  }
}));

// 9. Badge Earned
app.post(CHAINHOOK_ENDPOINTS.badgeEarned, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        const printData = getPrintEventData(event);
        if (!printData) continue;

        const eventName = getStringField(printData, 'event');
        if (eventName !== 'badge-minted') continue;

        const recipient = getStringField(printData, 'recipient');
        const badgeName = getStringField(printData, 'badge-name');
        const tokenId = getNumberField(printData, 'token-id');
        const badgeTypeRaw = printData['badge-type'];
        const badgeType =
          typeof badgeTypeRaw === 'string' || typeof badgeTypeRaw === 'number'
            ? String(badgeTypeRaw)
            : null;

        if (!recipient || !badgeName || tokenId == null || !badgeType) {
          logger.warn('Skipping malformed badge-minted print event', {
            txHash: tx.transaction_identifier.hash,
          });
          continue;
        }

        logger.info('🏆 Badge Earned', {
          tokenId,
          recipient,
          badgeType,
          badgeName,
          txHash: tx.transaction_identifier.hash
        });
        
        await broadcastNotification({
          title: '🏆 You Earned a Badge!',
          message: `Congratulations! You earned the "${badgeName}" badge.`,
          type: 'badge',
          data: {
            'Badge': badgeName,
            'Type': badgeType,
            'Token ID': tokenId
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        }, [recipient]);
        
        eventStats.badgesEarned++;
      }
    }
  }
}));

// Additional endpoints for contract_call chainhooks

// 10. New Subscription (contract_call: register-and-subscribe)
app.post(CHAINHOOK_ENDPOINTS.newSubscription, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      logger.info('✨ New Subscription Call', {
        sender: tx.metadata.sender,
        success: tx.metadata.success,
        txHash: tx.transaction_identifier.hash,
        block: block.block_identifier.index
      });
      
      if (tx.metadata.success) {
        await broadcastNotification({
          title: '✨ New Subscriber!',
          message: `New subscription from ${tx.metadata.sender.slice(0, 8)}...`,
          type: 'subscription',
          data: {
            'User': tx.metadata.sender,
            'Block': block.block_identifier.index
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        });
        eventStats.subscriptions++;
      }
    }
  }
}));

// 11. Subscription Upgrade (contract_call: upgrade-subscription)
app.post(CHAINHOOK_ENDPOINTS.subscriptionUpgrade, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      logger.info('⬆️ Subscription Upgrade', {
        sender: tx.metadata.sender,
        success: tx.metadata.success,
        txHash: tx.transaction_identifier.hash,
        block: block.block_identifier.index
      });
      
      if (tx.metadata.success) {
        await broadcastNotification({
          title: '⬆️ Subscription Upgraded!',
          message: `User ${tx.metadata.sender.slice(0, 8)}... upgraded their subscription`,
          type: 'subscription',
          data: {
            'User': tx.metadata.sender
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        });
      }
    }
  }
}));

// 12. Alert Created (contract_call: create-alert)
app.post(CHAINHOOK_ENDPOINTS.alertCreated, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      logger.info('🔔 Alert Created', {
        sender: tx.metadata.sender,
        success: tx.metadata.success,
        txHash: tx.transaction_identifier.hash,
        block: block.block_identifier.index
      });
      
      if (tx.metadata.success) {
        await broadcastNotification({
          title: '🔔 New Alert Created',
          message: `User ${tx.metadata.sender.slice(0, 8)}... created a new alert`,
          type: 'alert',
          data: {
            'Creator': tx.metadata.sender
          },
          txHash: tx.transaction_identifier.hash,
          blockHeight: block.block_identifier.index
        }, [tx.metadata.sender]);
      }
    }
  }
}));

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime(),
    network: process.env.NEXT_PUBLIC_STACKS_NETWORK || 'mainnet'
  });
});

// Keep-alive ping endpoint (for cron services to prevent Render cold starts)
app.get('/api/v1/ping', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send('pong');
});

// HEAD request for lightweight keep-alive
app.head('/api/v1/ping', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).end();
});

// Get event statistics
app.get('/api/v1/stats', (req: Request, res: Response) => {
  res.json({
    stats: eventStats,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Get chainhook status
app.get('/api/v1/chainhooks/status', (req: Request, res: Response) => {
  res.json({
    registered: REGISTERED_CHAINHOOK_NAMES.length,
    active: REGISTERED_CHAINHOOK_NAMES.length,
    chainhooks: [...REGISTERED_CHAINHOOK_NAMES]
  });
});

// ============================================
// USER PREFERENCES API
// ============================================

// Save user notification preferences
const saveUserPreferencesHandler = async (req: Request, res: Response) => {
  try {
    const { address, username, email, discord, telegram, enabledAlerts } = req.body;
    
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const prefs = saveUserPreferences({
      address,
      username,
      email,
      discord,
      telegram,
      enabledAlerts
    });
    
    logger.info('User preferences saved', { address });
    res.json({ success: true, user: prefs });
  } catch (error) {
    logger.error('Error saving user preferences', { error });
    res.status(500).json({ error: 'Failed to save preferences' });
  }
};

app.post('/api/v1/users', saveUserPreferencesHandler);
app.post('/api/users', saveUserPreferencesHandler);

// Get user notification preferences
app.get('/api/users/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const prefs = getUserPreferences(address);
    
    if (!prefs) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: prefs });
  } catch (error) {
    logger.error('Error getting user preferences', { error });
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user notification preferences
app.put('/api/users/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { username, email, discord, telegram, enabledAlerts } = req.body;

    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const prefs = saveUserPreferences({
      address,
      username,
      email,
      discord,
      telegram,
      enabledAlerts
    });
    
    logger.info('User preferences updated', { address });
    res.json({ success: true, user: prefs });
  } catch (error) {
    logger.error('Error updating user preferences', { error });
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Delete user
app.delete('/api/users/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const deleted = deleteUserPreferences(address);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info('User deleted', { address });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting user', { error });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all users (admin)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = getAllUsers();
    res.json({ users, count: users.length });
  } catch (error) {
    logger.error('Error getting users', { error });
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// ============================================
// ALERTS API ENDPOINTS
// ============================================

// Persistent file-based alerts storage
import fs from 'fs';
import path from 'path';

const ALERTS_FILE = path.join(__dirname, '../data/alerts.json');
const DATA_DIR = path.join(__dirname, '../data');

interface StoredAlert {
  id: number;
  type: number;
  name: string;
  threshold: number;
  targetAddress: string | null;
  enabled: boolean;
  triggerCount: number;
  txId?: string;
  createdAt: string;
}

interface CreateAlertRequestBody {
  type: number;
  name: string;
  threshold?: number;
  targetAddress?: string;
  txId?: string;
}

type UpdateAlertRequestBody = Partial<Pick<StoredAlert, 'name' | 'threshold' | 'targetAddress' | 'enabled'>>;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load alerts from file
const loadAlerts = (): Map<string, StoredAlert[]> => {
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      const data = fs.readFileSync(ALERTS_FILE, 'utf-8');
      const obj = JSON.parse(data) as Record<string, StoredAlert[]>;
      return new Map<string, StoredAlert[]>(Object.entries(obj));
    }
  } catch (error) {
    logger.error('Error loading alerts from file', { error });
  }
  return new Map<string, StoredAlert[]>();
};

// Save alerts to file
const saveAlerts = (alerts: Map<string, StoredAlert[]>) => {
  try {
    const obj = Object.fromEntries(alerts);
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Error saving alerts to file', { error });
  }
};

const userAlerts: Map<string, StoredAlert[]> = loadAlerts();

// Get user's alerts
const getUserAlertsHandler = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const alerts = userAlerts.get(address) || [];
    res.json({ success: true, alerts, count: alerts.length });
  } catch (error) {
    logger.error('Error getting alerts', { error });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
};

// Create new alert
const createUserAlertHandler = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const { type, name, threshold, targetAddress, txId } = req.body as CreateAlertRequestBody;
    if (!Number.isInteger(type) || type < 1 || type > 6) {
      return res.status(400).json({ error: 'Invalid alert type' });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Alert name is required' });
    }
    
    const alerts = userAlerts.get(address) || [];
    const newAlert = {
      id: Date.now(),
      type,
      name,
      threshold: threshold || 10000,
      targetAddress: targetAddress ?? null,
      enabled: true,
      triggerCount: 0,
      txId,
      createdAt: new Date().toISOString()
    };
    
    alerts.push(newAlert);
    userAlerts.set(address, alerts);
    saveAlerts(userAlerts);
    
    logger.info('Alert created', { address, alert: newAlert });
    res.json({ success: true, alert: newAlert });
  } catch (error) {
    logger.error('Error creating alert', { error });
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

app.get('/api/v1/users/:address/alerts', getUserAlertsHandler);
app.get('/api/users/:address/alerts', getUserAlertsHandler);
app.post('/api/v1/users/:address/alerts', createUserAlertHandler);
app.post('/api/users/:address/alerts', createUserAlertHandler);

/**
 * System Maintenance Task
 */
async function runMaintenanceTask() {
  logger.info('Starting system maintenance task');
  try {
    // 1. Cleanup old analytics
    clearOldData(30);
    
    // 2. Perform database backup
    db.backup();
    
    logger.info('System maintenance task completed successfully');
  } catch (error) {
    logger.error('System maintenance task failed', { error });
  }
}

// Scheduled maintenance (every 24 hours)
setInterval(runMaintenanceTask, 24 * 3600000);
// Run once on startup
runMaintenanceTask();

// Update alert
const updateUserAlertHandler = async (req: Request, res: Response) => {
  try {
    const { address, alertId } = req.params;
    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const updates = req.body as UpdateAlertRequestBody;
    const parsedAlertId = Number.parseInt(alertId, 10);
    if (!Number.isInteger(parsedAlertId) || parsedAlertId < 1) {
      return res.status(400).json({ error: 'Invalid alert id' });
    }
    
    const alerts = userAlerts.get(address) || [];
    const alertIndex = alerts.findIndex(a => a.id === parsedAlertId);
    
    if (alertIndex === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alerts[alertIndex] = { ...alerts[alertIndex], ...updates };
    userAlerts.set(address, alerts);
    saveAlerts(userAlerts);
    
    logger.info('Alert updated', { address, alertId, updates });
    res.json({ success: true, alert: alerts[alertIndex] });
  } catch (error) {
    logger.error('Error updating alert', { error });
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

// Delete alert
const deleteUserAlertHandler = async (req: Request, res: Response) => {
  try {
    const { address, alertId } = req.params;
    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const parsedAlertId = Number.parseInt(alertId, 10);
    if (!Number.isInteger(parsedAlertId) || parsedAlertId < 1) {
      return res.status(400).json({ error: 'Invalid alert id' });
    }
    
    const alerts = userAlerts.get(address) || [];
    const filteredAlerts = alerts.filter(a => a.id !== parsedAlertId);
    
    if (filteredAlerts.length === alerts.length) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    userAlerts.set(address, filteredAlerts);
    saveAlerts(userAlerts);
    
    logger.info('Alert deleted', { address, alertId });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting alert', { error });
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

app.put('/api/users/:address/alerts/:alertId', updateUserAlertHandler);
app.put('/api/v1/users/:address/alerts/:alertId', updateUserAlertHandler);
app.patch('/api/users/:address/alerts/:alertId', updateUserAlertHandler);
app.patch('/api/v1/users/:address/alerts/:alertId', updateUserAlertHandler);
app.delete('/api/users/:address/alerts/:alertId', deleteUserAlertHandler);
app.delete('/api/v1/users/:address/alerts/:alertId', deleteUserAlertHandler);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 StackPulse Server is running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📡 Chainhook endpoints available at: http://localhost:${PORT}/api/v1/chainhooks/*`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  // Force shutdown after 10 seconds (reduced from 30 for responsiveness)
  const forceShutdown = setTimeout(() => {
    logger.error('Forced shutdown after timeout - some resources may not have closed cleanly');
    process.exit(1);
  }, 10000);

  // Stop accepting new connections
  server.close((err) => {
    clearTimeout(forceShutdown);
    
    if (err) {
      logger.error('Error during server shutdown', { error: err });
      process.exit(1);
    }
    
    logger.info('HTTP server closed, all connections terminated');
    
    // Save any pending data or close other resources here
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });
};

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason, promise });
});

export default app;
