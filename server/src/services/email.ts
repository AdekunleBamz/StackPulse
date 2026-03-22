/**
 * Email Service
 * Handles sending email notifications
 */

import logger from '../utils/logger';

// Email configuration
interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  priority?: 'low' | 'normal' | 'high';
}

class EmailService {
  private config: EmailConfig | null = null;

  initialize(config: EmailConfig) {
    this.config = config;
    logger.info('Email service initialized');
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.config) {
      logger.warn('Email service not initialized, skipping send');
      return false;
    }

    if (!this.validateTemplate(options)) {
      logger.error('Email template validation failed', { subject: options.subject });
      return false;
    }

    try {
      const recipientCount = Array.isArray(options.to) ? options.to.length : 1;
      logger.info('Attempting to send email', {
        to: options.to,
        recipientCount,
        subject: options.subject,
        hasHtml: !!options.html,
        priority: options.priority || 'normal'
      });
      
      // In production, use nodemailer or similar
      // For now, just log
      return true;
    } catch (error) {
      logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendAlertNotification(email: string, alertName: string, details: any): Promise<boolean> {
    const txHash = details.txHash || '';
    const explorerUrl = `https://explorer.hiro.so/txid/${txHash}?chain=mainnet`;
    
    return this.send({
      to: email,
      subject: `🔔 Alert Triggered: ${alertName}`,
      body: `Your alert "${alertName}" has been triggered.\n\nView on Explorer: ${explorerUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #7c3aed; margin-top: 0;">Alert Triggered</h2>
          <p>Your alert <strong>${alertName}</strong> has been triggered on the Stacks network.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <pre style="margin: 0; font-size: 13px; color: #334155;">${JSON.stringify(details, null, 2)}</pre>
          </div>
          <a href="${explorerUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View on Explorer</a>
          <p style="margin-top: 25px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Sent by StackPulse • <a href="https://stackpulse.app/settings" style="color: #7c3aed;">Manage Notifications</a>
          </p>
        </div>
      `
    });
  }

  async sendWelcomeEmail(email: string, address: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: '✨ Welcome to StackPulse',
      body: `Welcome! Your address ${address} has been registered with StackPulse.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #7c3aed; margin-top: 0;">Welcome to StackPulse!</h2>
          <p>Your wallet address <code>${address}</code> has been successfully registered.</p>
          <p>You can now start creating custom alerts to monitor whales, contract deployments, and NFT mints in real-time.</p>
          <a href="https://stackpulse.app/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
        </div>
      `
    });
  }

  private validateTemplate(options: EmailOptions): boolean {
    if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) return false;
    if (!options.subject || options.subject.length < 3) return false;
    if (!options.body || options.body.length < 10) return false;
    return true;
  }
}

export const emailService = new EmailService();
export default emailService;
