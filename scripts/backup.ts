#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Runs daily database backup and sends to Telegram
 * 
 * Usage:
 *   npm run backup
 *   or with cron: 0 2 * * * cd /path/to/app && npm run backup
 */

import { DatabaseBackup } from '../src/lib/backup';
import path from 'path';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const backupDir = path.join(process.cwd(), 'backups');

  const backup = new DatabaseBackup({
    databaseUrl,
    backupDir,
    telegramBotToken,
    telegramChatId,
    maxBackups: 7, // Keep last 7 days
  });

  try {
    await backup.runBackup();
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup script failed:', error);
    process.exit(1);
  }
}

main();
