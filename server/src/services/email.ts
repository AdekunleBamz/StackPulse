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

  initialize(config: EmailConfig): void {
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

  async sendAlertNotification(email: string, alertName: string, details: unknown): Promise<boolean> {
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

  private validateTemplate(options: EmailOptions): boolean {
    if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) return false;
    if (!options.subject || options.subject.length < 3) return false;
    if (!options.body || options.body.length < 10) return false;
    return true;
  }
}

export const emailService = new EmailService();
export default emailService;
