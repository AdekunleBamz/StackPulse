import axios from 'axios';
import logger from '../utils/logger';

interface DiscordMessage {
  content?: string;
  embeds?: Array<{
    title: string;
    description: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    timestamp?: string;
    footer?: { text: string };
  }>;
}

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const RATE_LIMIT_MS = 1000; // 1 second between messages
let lastSentAt = 0;

/**
 * Send a notification to Discord with rate limiting
 */
export const sendDiscordNotification = async (message: DiscordMessage): Promise<boolean> => {
  if (!DISCORD_WEBHOOK_URL) {
    logger.debug('Discord webhook URL not configured, skipping notification');
    return false;
  }

  // Basic rate limiting
  const now = Date.now();
  const timeSinceLast = now - lastSentAt;
  
  if (timeSinceLast < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  try {
    const response = await axios.post(DISCORD_WEBHOOK_URL, message);
    lastSentAt = Date.now();
    return response.status === 204 || response.status === 200;
  } catch (error: any) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.data.retry_after || 5000;
      logger.warn(`Discord rate limited. Retrying after ${retryAfter}ms`);
      // Optional: implement re-queueing logic here
    }
    logger.error('Error sending Discord notification', { error: error.message });
    return false;
  }
};
