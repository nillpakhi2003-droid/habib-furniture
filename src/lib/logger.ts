// Production logging utility
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      environment: process.env.NODE_ENV,
    });
  }

  info(message: string, data?: unknown, context?: string) {
    const entry: LogEntry = {
      level: 'info',
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    };
    
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    } else {
      console.log(this.formatLog(entry));
    }
  }

  warn(message: string, data?: unknown, context?: string) {
    const entry: LogEntry = {
      level: 'warn',
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    };
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    } else {
      console.warn(this.formatLog(entry));
    }
  }

  error(message: string, error?: unknown, context?: string) {
    const entry: LogEntry = {
      level: 'error',
      message,
      data: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      context,
      timestamp: new Date().toISOString(),
    };
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '');
    } else {
      console.error(this.formatLog(entry));
    }
  }

  debug(message: string, data?: unknown, context?: string) {
    if (!this.isDevelopment) return;
    
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

export const logger = new Logger();
