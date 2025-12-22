/**
 * Email Notification System
 * 
 * Supports multiple providers:
 * - Resend (recommended for Bangladesh)
 * - Nodemailer (SMTP)
 */

interface EmailConfig {
  provider: 'resend' | 'smtp';
  resendApiKey?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send email using Resend
   */
  private async sendWithResend(email: EmailTemplate): Promise<void> {
    if (!this.config.resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Send email using SMTP (Nodemailer will be used if installed)
   */
  private async sendWithSMTP(email: EmailTemplate): Promise<void> {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration not provided');
    }

    // This requires nodemailer to be installed
    // Import dynamically to make it optional
    try {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransport(this.config.smtp);

      await transporter.sendMail({
        from: this.config.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    } catch (error) {
      throw new Error('Nodemailer not installed. Run: npm install nodemailer');
    }
  }

  /**
   * Send email
   */
  async sendEmail(email: EmailTemplate): Promise<void> {
    try {
      if (this.config.provider === 'resend') {
        await this.sendWithResend(email);
      } else {
        await this.sendWithSMTP(email);
      }
      console.log(`✅ Email sent to ${email.to}`);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    products: Array<{ name: string; quantity: number; price: number }>;
  }): Promise<void> {
    const productsHtml = order.products
      .map(
        p => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${p.price.toLocaleString()}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; }
            .total { font-size: 18px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 অর্ডার কনফার্ম হয়েছে!</h1>
            </div>
            <div class="content">
              <p>প্রিয় ${order.customerName},</p>
              <p>আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ!</p>
              
              <div class="order-details">
                <h2>অর্ডার বিস্তারিত</h2>
                <p><strong>অর্ডার নম্বর:</strong> #${order.orderId}</p>
                
                <table>
                  <thead>
                    <tr style="background: #f3f4f6;">
                      <th style="padding: 12px; text-align: left;">পণ্য</th>
                      <th style="padding: 12px; text-align: center;">পরিমাণ</th>
                      <th style="padding: 12px; text-align: right;">মূল্য</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productsHtml}
                    <tr>
                      <td colspan="2" style="padding: 12px; text-align: right;"><strong>মোট:</strong></td>
                      <td class="total" style="padding: 12px; text-align: right;">৳${order.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p>আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
              <p>ধন্যবাদ,<br><strong>Habib Furniture</strong></p>
            </div>
            <div class="footer">
              <p>এই email সম্পর্কে কোন প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: order.customerEmail,
      subject: `অর্ডার কনফার্মেশন - #${order.orderId}`,
      html,
    });
  }

  /**
   * Send admin notification for new order
   */
  async sendAdminOrderNotification(order: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
  }): Promise<void> {
    const html = `
      <h2>🔔 নতুন অর্ডার পাওয়া গেছে!</h2>
      <p><strong>অর্ডার নম্বর:</strong> #${order.orderId}</p>
      <p><strong>কাস্টমার:</strong> ${order.customerName}</p>
      <p><strong>ফোন:</strong> ${order.customerPhone}</p>
      <p><strong>মোট মূল্য:</strong> ৳${order.totalAmount.toLocaleString()}</p>
      <p>অ্যাডমিন প্যানেলে গিয়ে বিস্তারিত দেখুন।</p>
    `;

    // Send to admin email (configured in env)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await this.sendEmail({
        to: adminEmail,
        subject: `🛒 নতুন অর্ডার - #${order.orderId}`,
        html,
      });
    }
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService | null {
  if (emailService) return emailService;

  const provider = process.env.EMAIL_PROVIDER as 'resend' | 'smtp';
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'noreply@habibfurniture.com';

  if (!provider) {
    console.warn('⚠️  Email provider not configured');
    return null;
  }

  if (provider === 'resend') {
    if (!resendApiKey) {
      console.warn('⚠️  Resend API key not configured');
      return null;
    }
    emailService = new EmailService({
      provider: 'resend',
      resendApiKey,
      from: fromEmail,
    });
  } else if (provider === 'smtp') {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('⚠️  SMTP configuration incomplete');
      return null;
    }

    emailService = new EmailService({
      provider: 'smtp',
      smtp: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      },
      from: fromEmail,
    });
  }

  return emailService;
}
