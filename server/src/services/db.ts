/**
 * Database Service
 * Manages data persistence and backups
 */

import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

class DatabaseService {
  private dataDir = path.join(__dirname, '../../data');
  private backupDir = path.join(__dirname, '../../backups');

  constructor() {
    this.ensureDirs();
  }

  private ensureDirs() {
    [this.dataDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Save data atomically using temp-file and rename pattern
   */
  async saveData(filename: string, data: any): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    const tempPath = `${filePath}.tmp`;
    
    try {
      const content = JSON.stringify(data, null, 2);
      
      // Write to temp file first
      fs.writeFileSync(tempPath, content, 'utf8');
      
      // Atomic rename to target path
      fs.renameSync(tempPath, filePath);
      
      logger.debug('Data saved atomically', { filename });
    } catch (error) {
      logger.error('Failed to save data atomically', { filename, error });
      
      // Cleanup temp file if it exists
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
      }
      
      throw error;
    }
  }

  /**
   * Database backup with atomic consistency
   */
  backup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}.json`);
    
    logger.info('Database backup initiated', { backupPath });
    
    try {
      // Logic for capturing a snapshot and writing to backup
      fs.copyFileSync(path.join(this.dataDir, 'users.json'), backupPath);
      logger.info('Backup completed', { backupPath });
      return backupPath;
    } catch (error) {
      logger.error('Backup failed', { error });
      throw error;
    }
  }
}

export default new DatabaseService();
