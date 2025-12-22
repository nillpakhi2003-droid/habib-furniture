import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  maxBackups?: number;
}

export class DatabaseBackup {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = {
      maxBackups: 7, // Keep last 7 backups by default
      ...config,
    };
  }

  /**
   * Create a database backup
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupPath = path.join(this.config.backupDir, backupFileName);

    // Ensure backup directory exists
    await fs.mkdir(this.config.backupDir, { recursive: true });

    // Extract database connection details from DATABASE_URL
    const dbUrl = new URL(this.config.databaseUrl);
    const dbName = dbUrl.pathname.slice(1); // Remove leading '/'
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port || '5432';

    // Set environment variable for password
    const env = {
      ...process.env,
      PGPASSWORD: dbPassword,
    };

    // Create backup using pg_dump
    const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${backupPath}"`;

    try {
      await execAsync(command, { env });
      console.log(`✅ Backup created: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  /**
   * Send backup file to Telegram
   */
  async sendToTelegram(filePath: string): Promise<void> {
    if (!this.config.telegramBotToken || !this.config.telegramChatId) {
      console.log('⚠️  Telegram credentials not configured, skipping upload');
      return;
    }

    const fileName = path.basename(filePath);
    const fileStats = await fs.stat(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

    try {
      // First, send a message
      const messageUrl = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
      await fetch(messageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.telegramChatId,
          text: `🗄️ *Database Backup*\n\n` +
                `📅 Date: ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}\n` +
                `📦 File: ${fileName}\n` +
                `💾 Size: ${fileSizeMB} MB`,
          parse_mode: 'Markdown',
        }),
      });

      // Then send the file if it's not too large (max 50MB for Telegram)
      if (fileStats.size < 50 * 1024 * 1024) {
        const fileBuffer = await fs.readFile(filePath);
        const formData = new FormData();
        formData.append('chat_id', this.config.telegramChatId);
        formData.append('document', new Blob([fileBuffer]), fileName);
        formData.append('caption', `Database backup - ${new Date().toLocaleDateString('en-BD')}`);

        const uploadUrl = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendDocument`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          console.log(`✅ Backup sent to Telegram: ${fileName}`);
        } else {
          const errorData = await response.json();
          console.error('❌ Failed to send to Telegram:', errorData);
        }
      } else {
        // For large files, compress first
        await this.compressAndSend(filePath);
      }
    } catch (error) {
      console.error('❌ Telegram upload failed:', error);
      throw error;
    }
  }

  /**
   * Compress large backups before sending
   */
  private async compressAndSend(filePath: string): Promise<void> {
    const gzipPath = `${filePath}.gz`;
    await execAsync(`gzip -c "${filePath}" > "${gzipPath}"`);

    const fileName = path.basename(gzipPath);
    const fileBuffer = await fs.readFile(gzipPath);
    
    const formData = new FormData();
    formData.append('chat_id', this.config.telegramChatId!);
    formData.append('document', new Blob([fileBuffer]), fileName);
    formData.append('caption', `Compressed database backup - ${new Date().toLocaleDateString('en-BD')}`);

    const uploadUrl = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendDocument`;
    await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    // Clean up compressed file
    await fs.unlink(gzipPath);
    console.log(`✅ Compressed backup sent to Telegram`);
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<void> {
    const files = await fs.readdir(this.config.backupDir);
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(this.config.backupDir, f),
      }));

    // Sort by name (which includes timestamp)
    backupFiles.sort((a, b) => b.name.localeCompare(a.name));

    // Remove old backups
    if (backupFiles.length > this.config.maxBackups!) {
      const filesToDelete = backupFiles.slice(this.config.maxBackups!);
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️  Removed old backup: ${file.name}`);
      }
    }
  }

  /**
   * Run full backup process
   */
  async runBackup(): Promise<void> {
    console.log('🚀 Starting backup process...');
    
    try {
      // Create backup
      const backupPath = await this.createBackup();

      // Send to Telegram
      await this.sendToTelegram(backupPath);

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log('✅ Backup process completed successfully');
    } catch (error) {
      console.error('❌ Backup process failed:', error);
      throw error;
    }
  }
}
