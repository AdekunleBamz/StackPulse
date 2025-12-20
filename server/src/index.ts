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
  parseStackPulseEvent,
  formatSTX,
  decodeClarityValue,
  createUserSession,
  stacksAppConfig
} from './utils/stacks';

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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Authentication middleware for chainhook endpoints
const authenticateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.CHAINHOOK_AUTH_TOKEN}`;
  
  if (!authHeader || authHeader !== expectedToken) {
    logger.warn('Unauthorized webhook request', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }
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

// 1. Whale Transfer Alert
app.post('/api/chainhooks/whale-transfer', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        const events = tx.metadata.receipt.events;
        
        for (const event of events) {
          // Use @stacks/transactions parser utility
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
            
            eventStats.whaleTransfers++;
          }
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'whale-transfer' });
  } catch (error) {
    logger.error('Error processing whale transfer', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 2. New Contract Deployed
app.post('/api/chainhooks/contract-deployed', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        // Use @stacks/transactions parser utility
        const deploymentData = parseContractDeployment(tx);
        
        if (deploymentData) {
          logger.info('📜 New Contract Deployed', {
            contractId: deploymentData.contractId,
            contractName: deploymentData.contractName,
            deployer: deploymentData.deployer,
            txHash: tx.transaction_identifier.hash,
            block: block.block_identifier.index
          });
          
          eventStats.contractDeployments++;
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'contract-deployed' });
  } catch (error) {
    logger.error('Error processing contract deployment', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 3. NFT Mint Tracker
app.post('/api/chainhooks/nft-mint', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        const events = tx.metadata.receipt.events;
        
        for (const event of events) {
          // Use @stacks/transactions parser utility
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
            
            eventStats.nftMints++;
          }
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'nft-mint' });
  } catch (error) {
    logger.error('Error processing NFT mint', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 4. Token Launch Detector
app.post('/api/chainhooks/token-launch', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        if (tx.metadata.kind?.type === 'ContractDeployment') {
          const contractId = tx.metadata.kind.data?.contract_identifier;
          const deployer = tx.metadata.sender;
          
          logger.info('🪙 New Token Launched', {
            contractId,
            deployer,
            txHash: tx.transaction_identifier.hash,
            block: block.block_identifier.index
          });
          
          eventStats.tokenLaunches++;
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'token-launch' });
  } catch (error) {
    logger.error('Error processing token launch', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 5. Large Swap Alert
app.post('/api/chainhooks/large-swap', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        const events = tx.metadata.receipt.events;
        const ftEvents = events.filter((e: any) => e.type === 'FTTransferEvent');
        
        if (ftEvents.length >= 2) {
          logger.info('💱 Large Swap Detected', {
            swapper: tx.metadata.sender,
            txHash: tx.transaction_identifier.hash,
            block: block.block_identifier.index,
            events: ftEvents.length
          });
          
          eventStats.largeSwaps++;
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'large-swap' });
  } catch (error) {
    logger.error('Error processing large swap', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 6. User Subscription Created
app.post('/api/chainhooks/subscription-created', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        const events = tx.metadata.receipt.events;
        
        for (const event of events) {
          if (event.type === 'SmartContractEvent') {
            const printData = event.data.value;
            
            if (printData?.event === 'subscription-created') {
              logger.info('✨ New Subscription', {
                user: printData.user,
                tier: printData.tier,
                price: printData.price,
                txHash: tx.transaction_identifier.hash
              });
              
              eventStats.subscriptions++;
            }
          }
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'subscription-created' });
  } catch (error) {
    logger.error('Error processing subscription', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 7. Alert Triggered
app.post('/api/chainhooks/alert-triggered', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        const events = tx.metadata.receipt.events;
        
        for (const event of events) {
          if (event.type === 'SmartContractEvent') {
            const printData = event.data.value;
            
            if (printData?.event === 'alert-triggered') {
              logger.info('🔔 Alert Triggered', {
                alertId: printData['alert-id'],
                owner: printData.owner,
                alertType: printData['alert-type'],
                txHash: tx.transaction_identifier.hash
              });
              
              eventStats.alertsTriggered++;
            }
          }
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'alert-triggered' });
  } catch (error) {
    logger.error('Error processing alert trigger', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 8. Fee Collected
app.post('/api/chainhooks/fee-collected', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        const events = tx.metadata.receipt.events;
        
        for (const event of events) {
          if (event.type === 'SmartContractEvent') {
            const printData = event.data.value;
            
            if (printData?.event === 'fee-collected') {
              logger.info('💰 Fee Collected', {
                source: printData.source,
                amount: printData.amount,
                txHash: tx.transaction_identifier.hash
              });
              
              eventStats.feesCollected++;
            }
          }
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'fee-collected' });
  } catch (error) {
    logger.error('Error processing fee collection', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 9. Badge Earned
app.post('/api/chainhooks/badge-earned', authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const payload: ChainhookPayload = req.body;
    
    for (const block of payload.apply) {
      for (const tx of block.transactions) {
        const events = tx.metadata.receipt.events;
        
        for (const event of events) {
          if (event.type === 'SmartContractEvent') {
            const printData = event.data.value;
            
            if (printData?.event === 'badge-minted') {
              logger.info('🏆 Badge Earned', {
                tokenId: printData['token-id'],
                recipient: printData.recipient,
                badgeType: printData['badge-type'],
                badgeName: printData['badge-name'],
                txHash: tx.transaction_identifier.hash
              });
              
              eventStats.badgesEarned++;
            }
          }
        }
      }
    }
    
    res.status(200).json({ success: true, processed: 'badge-earned' });
  } catch (error) {
    logger.error('Error processing badge earned', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get event statistics
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    stats: eventStats,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Get chainhook status
app.get('/api/chainhooks/status', (req: Request, res: Response) => {
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

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 StackPulse Server running on port ${PORT}`);
  logger.info(`📡 Ready to receive chainhook events`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
