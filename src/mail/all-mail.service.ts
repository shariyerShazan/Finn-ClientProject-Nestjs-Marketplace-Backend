/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { MailService } from './mail.service';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class AllMailService {
  constructor(
    private readonly mailService: MailService,
    private readonly translationService: TranslationService,
  ) {}

  async sendOtpEmail(
    email: string,
    otp: string,
    name: string,
    lang: string = 'en',
  ) {
    const subject = await this.translationService.translate(
      '🔐 Verify Your Finn Account',
      lang,
    );
    const greeting = await this.translationService.translate('Hey', lang);
    const bodyText = await this.translationService.translate(
      "Welcome to the family! We're excited to have you at Finn. To keep your account secure, please verify your email address using the code below:",
      lang,
    );
    const codeLabel = await this.translationService.translate(
      'Verification Code',
      lang,
    );
    const footerText = await this.translationService.translate(
      'Code valid for 5 minutes. If you didn’t create an account with Finn, just ignore this message.',
      lang,
    );

    const brandColor = '#0064AE';

    const html = `
      <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e1e1e1;">
          <div style="background-color: ${brandColor}; padding: 35px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1.5px; text-transform: uppercase;">Finn</h1>
          </div>
          <div style="padding: 45px 35px;">
            <p style="font-size: 18px; font-weight: 600; color: #111; margin-bottom: 15px;">${greeting} ${name},</p>
            <p style="color: #555; font-size: 15px; margin-bottom: 30px;">${bodyText}</p>
            <div style="background-color: #f0f7ff; border: 2px solid ${brandColor}; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; color: ${brandColor}; margin-bottom: 10px; font-weight: 800; letter-spacing: 2px;">${codeLabel}</span>
              <span style="font-size: 42px; font-weight: 900; color: #111; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
            </div>
            <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">${footerText}</p>
          </div>
        </div>
      </div>
    `;

    return await this.mailService.send(email, subject, html);
  }

  async sendForgotOtp(
    email: string,
    otp: string,
    name: string,
    lang: string = 'en',
  ) {
    const subject = await this.translationService.translate(
      '🔐 Reset Your Finn Password',
      lang,
    );
    const greeting = await this.translationService.translate('Hey', lang);
    const bodyText = await this.translationService.translate(
      'Forgot your password? No worries, it happens! Use the security code below to reset your password and get back to your Finn account:',
      lang,
    );
    const codeLabel = await this.translationService.translate(
      'Password Reset Code',
      lang,
    );
    const brandColor = '#0064AE';

    const html = `
      <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e1e1e1;">
          <div style="background-color: ${brandColor}; padding: 35px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; text-transform: uppercase;">Finn</h1>
          </div>
          <div style="padding: 45px 35px;">
            <p style="font-size: 18px; font-weight: 600; color: #111;">${greeting} ${name},</p>
            <p style="color: #555; font-size: 15px; margin-bottom: 30px;">${bodyText}</p>
            <div style="background-color: #f0f7ff; border: 2px solid ${brandColor}; border-radius: 12px; padding: 30px; text-align: center;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; color: ${brandColor}; margin-bottom: 10px; font-weight: 800; letter-spacing: 2px;">${codeLabel}</span>
              <span style="font-size: 42px; font-weight: 900; color: #111; letter-spacing: 10px;">${otp}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    return await this.mailService.send(email, subject, html);
  }

  async sendSellerCredentials(
    email: string,
    pass: string,
    name: string,
    lang: string = 'en',
  ) {
    const subject = await this.translationService.translate(
      '🚀 Welcome to Finn - Your Seller Account is Ready!',
      lang,
    );
    const congrats = await this.translationService.translate(
      'Congratulations',
      lang,
    );
    const bodyText = await this.translationService.translate(
      'Admin has created a verified seller account for you at Finn. Use the credentials below to log in and start managing your listings:',
      lang,
    );
    const tempPassLabel = await this.translationService.translate(
      'Temporary Password',
      lang,
    );
    const securityTip = await this.translationService.translate(
      'Security Tip: For your safety, please change your password immediately after your first login.',
      lang,
    );

    const brandColor = '#0064AE';

    const html = `
      <div style="background-color: #f4f4f7; padding: 40px 0;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e1e1e1;">
          <div style="background-color: ${brandColor}; padding: 35px; text-align: center; color: #fff;">
            <h1 style="margin:0; font-size: 24px;">Finn Seller</h1>
          </div>
          <div style="padding: 45px 35px;">
            <p style="font-size: 18px; font-weight: 600;">${congrats} ${name}!</p>
            <p>${bodyText}</p>
            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>${tempPassLabel}:</strong> <span style="color: ${brandColor}; font-weight: bold;">${pass}</span></p>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #856404;">⚠️ ${securityTip}</p>
          </div>
        </div>
      </div>
    `;

    return await this.mailService.send(email, subject, html);
  }

  async sendContactAdminEmail(adminEmail: string, contactData: any) {
    // Admin ইমেইল সাধারণত স্ট্যাটিক ল্যাঙ্গুয়েজ (English) এ রাখা ভালো কারণ এডমিন প্যানেল সাধারণত এক ভাষাতেই হয়।
    // তবে চাইলে এটিও করা সম্ভব। এখানে স্ট্যাটিক রাখা হলো।
    const brandColor = '#0064AE';
    const { name, email, subject, message } = contactData;

    const html = `
      <div style="background-color: #f4f4f7; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px;">
          <h2 style="color: ${brandColor};">New Support Inquiry</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid ${brandColor};">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      </div>
    `;

    return await this.mailService.send(
      adminEmail,
      `📩 Contact: ${subject}`,
      html,
    );
  }
}
