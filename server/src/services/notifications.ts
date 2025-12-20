/**
 * StackPulse Notification Services
 * Handles sending alerts via Discord, Telegram, and Email
 */

import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({ format: format.combine(format.colorize(), format.simple()) })]
});

// ============================================
// TYPES
// ============================================

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'whale' | 'contract' | 'nft' | 'token' | 'swap' | 'subscription' | 'alert' | 'fee' | 'badge';
  data?: Record<string, any>;
  txHash?: string;
  blockHeight?: number;
}

export interface UserPreferences {
  address: string;
  username?: string;
  email?: string;
  discord?: string;
  telegram?: string;
  enabledAlerts: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// IN-MEMORY STORAGE (Replace with Redis/DB in production)
// ============================================

const userPreferences: Map<string, UserPreferences> = new Map();

// ============================================
// USER PREFERENCES
// ============================================

export function saveUserPreferences(prefs: Partial<UserPreferences> & { address: string }): UserPreferences {
  const existing = userPreferences.get(prefs.address);
  
  const updated: UserPreferences = {
    address: prefs.address,
    username: prefs.username || existing?.username,
    email: prefs.email || existing?.email,
    discord: prefs.discord || existing?.discord,
    telegram: prefs.telegram || existing?.telegram,
    enabledAlerts: prefs.enabledAlerts || existing?.enabledAlerts || ['whale', 'contract', 'nft', 'token', 'swap'],
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date()
  };
  
  userPreferences.set(prefs.address, updated);
  logger.info('User preferences saved', { address: prefs.address });
  
  return updated;
}

export function getUserPreferences(address: string): UserPreferences | undefined {
  return userPreferences.get(address);
}

export function getAllUsers(): UserPreferences[] {
  return Array.from(userPreferences.values());
}

export function deleteUserPreferences(address: string): boolean {
  return userPreferences.delete(address);
}

// ============================================
// DISCORD NOTIFICATIONS
// ============================================

export async function sendDiscordNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const color = getColorForType(payload.type);
    
    const embed = {
      title: payload.title,
      description: payload.message,
      color: color,
      fields: payload.data ? Object.entries(payload.data).map(([key, value]) => ({
        name: key,
        value: String(value),
        inline: true
      })) : [],
      footer: {
        text: `StackPulse Alert • Block ${payload.blockHeight || 'N/A'}`
      },
      timestamp: new Date().toISOString()
    };
    
    if (payload.txHash) {
      embed.fields.push({
        name: 'Transaction',
        value: `[View on Explorer](https://explorer.stacks.co/txid/${payload.txHash}?chain=mainnet)`,
        inline: false
      });
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'StackPulse',
        avatar_url: 'https://stackpulse.vercel.app/logo.svg',
        embeds: [embed]
      })
    });
    
    if (!response.ok) {
      logger.error('Discord notification failed', { status: response.status });
      return false;
    }
    
    logger.info('Discord notification sent', { title: payload.title });
    return true;
  } catch (error) {
    logger.error('Discord notification error', { error });
    return false;
  }
}

// ============================================
// TELEGRAM NOTIFICATIONS
// ============================================

export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const emoji = getEmojiForType(payload.type);
    
    let text = `${emoji} *${escapeMarkdown(payload.title)}*\n\n`;
    text += `${escapeMarkdown(payload.message)}\n\n`;
    
    if (payload.data) {
      for (const [key, value] of Object.entries(payload.data)) {
        text += `*${escapeMarkdown(key)}:* ${escapeMarkdown(String(value))}\n`;
      }
    }
    
    if (payload.txHash) {
      text += `\n[View Transaction](https://explorer.stacks.co/txid/${payload.txHash}?chain=mainnet)`;
    }
    
    if (payload.blockHeight) {
      text += `\n_Block: ${payload.blockHeight}_`;
    }
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: false
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      logger.error('Telegram notification failed', { error });
      return false;
    }
    
    logger.info('Telegram notification sent', { chatId, title: payload.title });
    return true;
  } catch (error) {
    logger.error('Telegram notification error', { error });
    return false;
  }
}

// ============================================
// EMAIL NOTIFICATIONS (using Resend API)
// ============================================

export async function sendEmailNotification(
  apiKey: string,
  toEmail: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const emoji = getEmojiForType(payload.type);
    
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #a855f7; margin: 0;">${emoji} StackPulse Alert</h1>
        </div>
        
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #fff; margin-top: 0;">${payload.title}</h2>
          <p style="color: #94a3b8; line-height: 1.6;">${payload.message}</p>
        </div>
    `;
    
    if (payload.data && Object.keys(payload.data).length > 0) {
      htmlContent += `
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #a855f7; margin-top: 0;">Details</h3>
          <table style="width: 100%; color: #fff;">
      `;
      
      for (const [key, value] of Object.entries(payload.data)) {
        htmlContent += `
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">${key}</td>
            <td style="padding: 8px 0; text-align: right;">${value}</td>
          </tr>
        `;
      }
      
      htmlContent += `</table></div>`;
    }
    
    if (payload.txHash) {
      htmlContent += `
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://explorer.stacks.co/txid/${payload.txHash}?chain=mainnet" 
             style="display: inline-block; background: linear-gradient(to right, #a855f7, #3b82f6); 
                    color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View Transaction
          </a>
        </div>
      `;
    }
    
    htmlContent += `
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
          <p style="color: #6b7280; font-size: 12px;">
            You received this alert from StackPulse.<br>
            <a href="https://stackpulse.vercel.app" style="color: #a855f7;">Manage your alerts</a>
          </p>
        </div>
      </div>
    `;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'StackPulse <alerts@stackpulse.app>',
        to: [toEmail],
        subject: `${emoji} ${payload.title}`,
        html: htmlContent
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      logger.error('Email notification failed', { error });
      return false;
    }
    
    logger.info('Email notification sent', { to: toEmail, title: payload.title });
    return true;
  } catch (error) {
    logger.error('Email notification error', { error });
    return false;
  }
}

// ============================================
// BROADCAST TO ALL USERS
// ============================================

export async function broadcastNotification(
  payload: NotificationPayload,
  filterAddresses?: string[]
): Promise<{ sent: number; failed: number }> {
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  const telegramBot = process.env.TELEGRAM_BOT_TOKEN;
  const emailApiKey = process.env.EMAIL_API_KEY;
  
  let sent = 0;
  let failed = 0;
  
  // Get users to notify
  const users = filterAddresses 
    ? filterAddresses.map(a => getUserPreferences(a)).filter(Boolean) as UserPreferences[]
    : getAllUsers();
  
  for (const user of users) {
    // Check if user has this alert type enabled
    if (!user.enabledAlerts.includes(payload.type)) {
      continue;
    }
    
    // Send via Discord (global webhook)
    if (discordWebhook && user.discord) {
      const success = await sendDiscordNotification(discordWebhook, payload);
      success ? sent++ : failed++;
    }
    
    // Send via Telegram
    if (telegramBot && user.telegram) {
      const success = await sendTelegramNotification(telegramBot, user.telegram, payload);
      success ? sent++ : failed++;
    }
    
    // Send via Email
    if (emailApiKey && user.email) {
      const success = await sendEmailNotification(emailApiKey, user.email, payload);
      success ? sent++ : failed++;
    }
  }
  
  // Also send to global Discord webhook if configured
  if (discordWebhook) {
    await sendDiscordNotification(discordWebhook, payload);
  }
  
  logger.info('Broadcast complete', { sent, failed, type: payload.type });
  return { sent, failed };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getColorForType(type: string): number {
  const colors: Record<string, number> = {
    whale: 0x3b82f6,      // Blue
    contract: 0x8b5cf6,   // Purple
    nft: 0xec4899,        // Pink
    token: 0x10b981,      // Green
    swap: 0xf59e0b,       // Yellow
    subscription: 0x6366f1, // Indigo
    alert: 0xef4444,      // Red
    fee: 0x14b8a6,        // Teal
    badge: 0xfbbf24       // Gold
  };
  return colors[type] || 0x6b7280;
}

function getEmojiForType(type: string): string {
  const emojis: Record<string, string> = {
    whale: '🐋',
    contract: '📜',
    nft: '🎨',
    token: '🚀',
    swap: '💱',
    subscription: '⭐',
    alert: '🔔',
    fee: '💰',
    badge: '🏆'
  };
  return emojis[type] || '📡';
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
