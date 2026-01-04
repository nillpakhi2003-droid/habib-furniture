/**
 * Sentry Error Monitoring Integration
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate?: number;
}

export class SentryMonitoring {
  private static initialized = false;
  private static config: SentryConfig;

  /**
   * Initialize Sentry
   */
  static async init(config: SentryConfig): Promise<void> {
    if (this.initialized) return;

    this.config = config;

    try {
      // Import Sentry dynamically to make it optional
      // @ts-ignore - optional dependency
      const Sentry = await import('@sentry/nextjs') as any;

      const integrations = [] as any[];
      // browserTracingIntegration is only available in the browser bundle
      if (typeof window !== 'undefined' && typeof Sentry.browserTracingIntegration === 'function') {
        integrations.push(Sentry.browserTracingIntegration());
      }

      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        tracesSampleRate: config.tracesSampleRate || 1.0,
        
        // Performance monitoring
        integrations,

        // Error filtering
        beforeSend(event: any, hint: any) {
          // Don't send certain errors to Sentry
          const error = hint?.originalException;
          
          if (error && typeof error === 'object' && 'message' in error) {
            const message = String(error.message).toLowerCase();
            
            // Filter out known non-critical errors
            if (
              message.includes('network error') ||
              message.includes('timeout') ||
              message.includes('aborted')
            ) {
              return null;
            }
          }

          return event;
        },
      });

      this.initialized = true;
      console.log('✅ Sentry monitoring initialized');
    } catch (error) {
      console.warn('⚠️  Sentry not installed. Run: npm install @sentry/nextjs');
    }
  }

  /**
   * Capture an exception
   */
  static async captureException(error: Error, context?: Record<string, any>): Promise<void> {
    if (!this.initialized) return;

    try {
      // @ts-ignore - optional dependency
      const Sentry = await import('@sentry/nextjs') as any;
      
      if (context) {
        Sentry.setContext('custom', context);
      }
      
      Sentry.captureException(error);
    } catch (err) {
      console.error('Failed to capture exception:', err);
    }
  }

  /**
   * Capture a message
   */
  static async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    if (!this.initialized) return;

    try {
      // @ts-ignore - optional dependency
      const Sentry = await import('@sentry/nextjs') as any;
      Sentry.captureMessage(message, level);
    } catch (err) {
      console.error('Failed to capture message:', err);
    }
  }

  /**
   * Set user context
   */
  static async setUser(user: { id: string; email?: string; username?: string }): Promise<void> {
    if (!this.initialized) return;

    try {
      // @ts-ignore - optional dependency
      const Sentry = await import('@sentry/nextjs') as any;
      Sentry.setUser(user);
    } catch (err) {
      console.error('Failed to set user:', err);
    }
  }
}

// Auto-initialize if DSN is provided
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  SentryMonitoring.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

export default SentryMonitoring;
