/**
 * StackPulse Chainhook Event Server
 * Handles incoming blockchain events from Hiro Chainhooks
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from './utils/logger';

// Import Stacks utilities using @stacks/transactions and @stacks/connect
import {
  parseWhaleTransfer,
  parseContractDeployment,
  parseNFTMint,
  parseStackPulseEvent,
  formatSTX,
  decodeClarityValue,
  createUserSession,
  stacksAppConfig
} from './utils/stacks';

// Import notification services
import {
  broadcastNotification,
  saveUserPreferences,
  getUserPreferences,
  getAllUsers,
  deleteUserPreferences,
  NotificationPayload
} from './services/notifications';
import { tieredApiLimiter } from './middleware/rateLimiter';
import requestLogger from './middleware/requestLogger';
import db from './services/db';
import { clearOldData } from './services/analytics';
import { requestTimeout } from './middleware/timeout';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Environment validation
const REQUIRED_ENV = [
  'CHAINHOOK_AUTH_TOKEN',
  'DEPLOYER_ADDRESS',
  'REGISTRY_CONTRACT',
  'ALERT_CONTRACT'
];

const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error('❌ Missing required environment variables:', { missing: missingEnv });
  process.exit(1);
}

logger.info('✅ Environment validation successful');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestTimeout(30000));
app.use(requestLogger());

// Optional authentication middleware for chainhook endpoints
// Note: Hiro Platform chainhooks don't always send auth headers, so we make this optional
const authenticateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CHAINHOOK_AUTH_TOKEN;
  
  // Skip auth check if no token configured or if request has valid token
  if (!expectedToken || authHeader === `Bearer ${expectedToken}`) {
    return next();
  }
  
  // Allow requests without auth header (Hiro Platform may not send one)
  if (!authHeader) {
    return next();
  }
  
  // Log mismatched auth but still allow (for debugging)
  logger.debug('Webhook request with unknown auth', { ip: req.ip });
  next();
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
        kind: any;
        receipt: {
          events: any[];
        };
      };
    }>;
  }>;
  rollback?: any[];
  chainhook: {
    uuid: string;
    predicate: any;
  };
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

// Helper: Process chainhook async and respond immediately to prevent timeout
const processAsync = (handler: (payload: ChainhookPayload) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    // Respond immediately with 202 Accepted to prevent Hiro timeout
    res.status(202).json({ 
      success: true, 
      status: 'accepted', 
      message: 'Event received and processing in background' 
    });
    
    // Process in background
    try {
      const payload: ChainhookPayload = req.body;
      if (payload && payload.apply) {
        await handler(payload);
      }
    } catch (error: any) {
      logger.error('Async processing error', { 
        error: error.message,
        path: req.path,
        requestId: req.headers['x-request-id']
      });
    }
  };
};

// 1. Whale Transfer Alert
app.post('/api/v1/chainhooks/whale-transfer', tieredApiLimiter, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        const transferData = parseWhaleTransfer(event);
        
        if (transferData) {
          logger.info('🐋 Whale Transfer Detected', {
            amount: transferData.amountFormatted,
            amountSTX: transferData.amountSTX,
            sender: transferData.sender,
            recipient: transferData.recipient,
            txHash: tx.transaction_identifier.hash,
            block: block.block_identifier.index
          });
          
          await broadcastNotification({
            title: '🐋 Whale Transfer Detected',
            message: `${transferData.amountSTX} STX transferred from ${transferData.sender.slice(0, 8)}... to ${transferData.recipient.slice(0, 8)}...`,
            type: 'whale',
            data: {
              Amount: transferData.amountSTX + ' STX',
              Sender: transferData.sender,
              Recipient: transferData.recipient
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
app.post('/api/v1/chainhooks/contract-deployed', authenticateWebhook, processAsync(async (payload) => {
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
app.post('/api/v1/chainhooks/nft-mint', tieredApiLimiter, authenticateWebhook, processAsync(async (payload) => {
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
app.post('/api/v1/chainhooks/token-launch', authenticateWebhook, processAsync(async (payload) => {
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
app.post('/api/v1/chainhooks/', tieredApiLimiter, authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      const ftEvents = events.filter((e: any) => e.type === 'FTTransferEvent');
      
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
app.post('/api/v1/chainhooks/subscription-created', authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        if (event.type === 'SmartContractEvent') {
          const printData = event.data?.value;
          
          if (printData?.event === 'subscription-created') {
            logger.info('✨ New Subscription', {
              user: printData.user,
              tier: printData.tier,
              price: printData.price,
              txHash: tx.transaction_identifier.hash
            });
            
            await broadcastNotification({
              title: '✨ Subscription Activated',
              message: `Welcome to StackPulse! Your tier ${printData.tier} subscription is now active.`,
              type: 'subscription',
              data: {
                'Tier': printData.tier,
                'Price': formatSTX(printData.price) + ' STX'
              },
              txHash: tx.transaction_identifier.hash,
              blockHeight: block.block_identifier.index
            }, [printData.user]);
            
            eventStats.subscriptions++;
          }
        }
      }
    }
  }
}));

// 7. Alert Triggered
app.post('/api/v1/chainhooks/alert-triggered', authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        if (event.type === 'SmartContractEvent') {
          const printData = event.data?.value;
          
          if (printData?.event === 'alert-triggered') {
            logger.info('🔔 Alert Triggered', {
              alertId: printData['alert-id'],
              owner: printData.owner,
              alertType: printData['alert-type'],
              txHash: tx.transaction_identifier.hash
            });
            
            await broadcastNotification({
              title: '🔔 Your Alert Was Triggered!',
              message: `Alert #${printData['alert-id']} (${printData['alert-type']}) has been triggered.`,
              type: 'alert',
              data: {
                'Alert ID': printData['alert-id'],
                'Type': printData['alert-type']
              },
              txHash: tx.transaction_identifier.hash,
              blockHeight: block.block_identifier.index
            }, [printData.owner]);
            
            eventStats.alertsTriggered++;
          }
        }
      }
    }
  }
}));

// 8. Fee Collected
app.post('/api/v1/chainhooks/fee-collected', authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        if (event.type === 'SmartContractEvent') {
          const printData = event.data?.value;
          
          if (printData?.event === 'fee-collected') {
            logger.info('💰 Fee Collected', {
              source: printData.source,
              amount: printData.amount,
              txHash: tx.transaction_identifier.hash
            });
            
            await broadcastNotification({
              title: '💰 Fee Collected',
              message: `${formatSTX(printData.amount)} STX collected from ${printData.source}`,
              type: 'fee',
              data: {
                'Source': printData.source,
                'Amount': formatSTX(printData.amount) + ' STX'
              },
              txHash: tx.transaction_identifier.hash,
              blockHeight: block.block_identifier.index
            });
            
            eventStats.feesCollected++;
          }
        }
      }
    }
  }
}));

// 9. Badge Earned
app.post('/api/v1/chainhooks/badge-earned', authenticateWebhook, processAsync(async (payload) => {
  for (const block of payload.apply) {
    for (const tx of block.transactions) {
      const events = tx.metadata.receipt.events || [];
      
      for (const event of events) {
        if (event.type === 'SmartContractEvent') {
          const printData = event.data?.value;
          
          if (printData?.event === 'badge-minted') {
            logger.info('🏆 Badge Earned', {
              tokenId: printData['token-id'],
              recipient: printData.recipient,
              badgeType: printData['badge-type'],
              badgeName: printData['badge-name'],
              txHash: tx.transaction_identifier.hash
            });
            
            await broadcastNotification({
              title: '🏆 You Earned a Badge!',
              message: `Congratulations! You earned the "${printData['badge-name']}" badge.`,
              type: 'badge',
              data: {
                'Badge': printData['badge-name'],
                'Type': printData['badge-type'],
                'Token ID': printData['token-id']
              },
              txHash: tx.transaction_identifier.hash,
              blockHeight: block.block_identifier.index
            }, [printData.recipient]);
            
            eventStats.badgesEarned++;
          }
        }
      }
    }
  }
}));

// Additional endpoints for contract_call chainhooks

// 10. New Subscription (contract_call: register-and-subscribe)
app.post('/api/v1/chainhooks/new-subscription', authenticateWebhook, processAsync(async (payload) => {
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
app.post('/api/v1/chainhooks/subscription-upgrade', authenticateWebhook, processAsync(async (payload) => {
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
app.post('/api/v1/chainhooks/alert-created', authenticateWebhook, processAsync(async (payload) => {
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
  res.status(200).send('pong');
});

// HEAD request for lightweight keep-alive
app.head('/api/v1/ping', (req: Request, res: Response) => {
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
    registered: 9,
    active: 9,
    chainhooks: [
      'whale-transfer-alert',
      'new-contract-deployed',
      'nft-mint-tracker',
      'token-launch-detector',
      'large-swap-alert',
      'user-subscription-created',
      'alert-triggered',
      'fee-collected',
      'badge-earned'
    ]
  });
});

// ============================================
// USER PREFERENCES API
// ============================================

// Save user notification preferences
app.post('/api/v1/users', async (req: Request, res: Response) => {
  try {
    const { address, username, email, discord, telegram, enabledAlerts } = req.body;
    
    if (!address) {
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
});

// Get user notification preferences
app.get('/api/users/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
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

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load alerts from file
const loadAlerts = (): Map<string, any[]> => {
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      const data = fs.readFileSync(ALERTS_FILE, 'utf-8');
      const obj = JSON.parse(data);
      return new Map(Object.entries(obj));
    }
  } catch (error) {
    logger.error('Error loading alerts from file', { error });
  }
  return new Map();
};

// Save alerts to file
const saveAlerts = (alerts: Map<string, any[]>) => {
  try {
    const obj = Object.fromEntries(alerts);
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Error saving alerts to file', { error });
  }
};

const userAlerts: Map<string, any[]> = loadAlerts();

// Get user's alerts
app.get('/api/v1/users/:address/alerts', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const alerts = userAlerts.get(address) || [];
    res.json({ alerts, count: alerts.length });
  } catch (error) {
    logger.error('Error getting alerts', { error });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create new alert
app.post('/api/v1/users/:address/alerts', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { type, name, threshold, targetAddress, txId } = req.body;
    
    const alerts = userAlerts.get(address) || [];
    const newAlert = {
      id: Date.now(),
      type,
      name,
      threshold: threshold || 10000,
      targetAddress: targetAddress || null,
      enabled: true,
      triggerCount: 0,
      txId,
      createdAt: new Date()
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
});

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
app.put('/api/users/:address/alerts/:alertId', async (req: Request, res: Response) => {
  try {
    const { address, alertId } = req.params;
    const updates = req.body;
    
    const alerts = userAlerts.get(address) || [];
    const alertIndex = alerts.findIndex(a => a.id === parseInt(alertId));
    
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
});

// Delete alert
app.delete('/api/users/:address/alerts/:alertId', async (req: Request, res: Response) => {
  try {
    const { address, alertId } = req.params;
    
    const alerts = userAlerts.get(address) || [];
    const filteredAlerts = alerts.filter(a => a.id !== parseInt(alertId));
    
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
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  logger.error('API Error', { 
    error: message, 
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 StackPulse Server running on port ${PORT}`);
  logger.info(`📡 Ready to receive chainhook events`);
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
