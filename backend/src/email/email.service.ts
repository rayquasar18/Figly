import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { renderVerificationEmail } from './templates/verification';
import { renderPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.resend = new Resend(apiKey || 'test');
    this.fromAddress = 'Figly <onboarding@resend.dev>';
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const html = renderVerificationEmail(name, verificationUrl);

    await this.resend.emails.send({
      from: this.fromAddress,
      to: email,
      subject: 'Xac minh email cua ban - Figly',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const html = renderPasswordResetEmail(name, resetUrl);

    await this.resend.emails.send({
      from: this.fromAddress,
      to: email,
      subject: 'Dat lai mat khau - Figly',
      html,
    });
  }
}
