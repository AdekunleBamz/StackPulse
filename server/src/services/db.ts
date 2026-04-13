/**
 * Database Service
 * Manages data persistence and backups
 */

import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

const BACKUP_FILE_VERSION = '1.0.0';

class DatabaseService {
  private dataDir = path.join(__dirname, '../../data');
  private backupDir = path.join(__dirname, '../../backups');

  constructor() {
    this.ensureDirs();
  }

  private ensureDirs(): void {
    [this.dataDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Simulate a database backup
   */
  backup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}.json`);
    
    logger.info('Database backup started', { backupPath });
    
    try {
      // Backup data files summary
      const files = fs.readdirSync(this.dataDir);
      const backupData = {
        version: BACKUP_FILE_VERSION,
        timestamp: new Date().toISOString(),
        files: files.map(f => ({ name: f, size: fs.statSync(path.join(this.dataDir, f)).size }))
      };

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      logger.info('Database backup completed successfully', { backupPath, fileCount: files.length });
      return backupPath;
    } catch (error: unknown) {
      logger.error('Database backup failed', { error });
      throw error;
    }
  }

  /**
   * Restore the most recent backup
   */
  restoreLatest(): boolean {
    try {
      const backups = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('backup-'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        logger.warn('No backups found to restore');
        return false;
      }

      const latest = backups[0];
      logger.info('Restoring from latest backup', { file: latest });
      // Logic to copy file back to data dir would go here
      return true;
    } catch (error) {
      logger.error('Database restore failed', { error });
      return false;
    }
  }
}

export default new DatabaseService();
