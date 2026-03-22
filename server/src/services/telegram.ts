import axios from 'axios';
import logger from '../utils/logger';

interface TelegramButton {
  text: string;
  url?: string;
  callback_data?: string;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: {
    inline_keyboard: TelegramButton[][];
  };
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send a notification to Telegram with support for interactive menus
 */
export const sendTelegramNotification = async (message: TelegramMessage): Promise<boolean> => {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.debug('Telegram bot token not configured, skipping notification');
    return false;
  }

  try {
    const response = await axios.post(`${TELEGRAM_API_BASE}/sendMessage`, message);
    return response.data.ok;
  } catch (error: any) {
    logger.error('Error sending Telegram notification', { 
      error: error.message,
      data: error.response?.data 
    });
    return false;
  }
};

/**
 * Create a standard interactive menu for an alert
 */
export const createAlertMenu = (alertId: string, txHash: string): any => {
  return {
    inline_keyboard: [
      [
        { text: '🔍 View on Explorer', url: `https://explorer.hiro.so/txid/${txHash}?chain=mainnet` },
        { text: '🔕 Mute Alert', callback_data: `mute:${alertId}` }
      ],
      [
        { text: '⚙️ Manage Settings', url: 'https://stackpulse.app/settings' }
      ]
    ]
  };
};
