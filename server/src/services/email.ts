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

    try {
      logger.info('Sending email', {
        to: options.to,
        subject: options.subject
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
    return this.send({
      to: email,
      subject: `Alert Triggered: ${alertName}`,
      body: `Your alert "${alertName}" has been triggered.\n\nDetails: ${JSON.stringify(details, null, 2)}`,
      html: `
        <h2>Alert Triggered</h2>
        <p>Your alert <strong>${alertName}</strong> has been triggered.</p>
        <pre>${JSON.stringify(details, null, 2)}</pre>
      `
    });
  }

  async sendWelcomeEmail(email: string, address: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Welcome to StackPulse',
      body: `Welcome! Your address ${address} has been registered.`,
      html: `
        <h2>Welcome to StackPulse!</h2>
        <p>Your wallet address <code>${address}</code> has been registered.</p>
        <p>Start creating alerts to monitor blockchain events.</p>
      `
    });
  }
}

export const emailService = new EmailService();
export default emailService;
