import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { renderVerificationEmail } from './templates/verification';
import { renderPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.resend = new Resend(apiKey || 'test');
    this.fromAddress =
      this.configService.get<string>('resend.fromAddress') || 'Figly <onboarding@resend.dev>';
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const html = renderVerificationEmail(name, verificationUrl);

    await this.sendEmail(email, 'Xac minh email cua ban - Figly', html);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const html = renderPasswordResetEmail(name, resetUrl);

    await this.sendEmail(email, 'Dat lai mat khau - Figly', html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
