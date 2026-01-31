/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { MailService } from './mail.service';

@Injectable()
export class AllMailService {
  constructor(private readonly mailService: MailService) {}

  async sendOtpEmail(email: string, otp: string, name: string) {
    const subject = '🔐 Verify Your ByBench Account';
    const brandColor = '#EA2754';

    const html = `
      <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e1e1e1;">
          
          <div style="background-color: ${brandColor}; padding: 35px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1.5px; text-transform: uppercase;">ByBench</h1>
            <div style="height: 3px; width: 40px; background-color: #ffffff; margin: 10px auto; border-radius: 2px; opacity: 0.5;"></div>
          </div>

          <div style="padding: 45px 35px;">
            <p style="font-size: 18px; font-weight: 600; color: #111; margin-bottom: 15px;">Hey ${name},</p>
            <p style="color: #555; font-size: 15px; margin-bottom: 30px;">Welcome to the family! We're excited to have you. To keep your account secure, please verify your email address using the code below:</p>
            
            <div style="background-color: #fff5f6; border: 2px solid ${brandColor}; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; color: ${brandColor}; margin-bottom: 10px; font-weight: 800; letter-spacing: 2px;">Verification Code</span>
              <span style="font-size: 42px; font-weight: 900; color: #111; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
            </div>

            <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
              Code valid for <span style="color: ${brandColor}; font-weight: 600;">5 minutes</span>. <br>
              If you didn't create an account, just ignore this message.
            </p>
          </div>

          <div style="background-color: #111; padding: 25px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #888;">
              Questions? Contact us at <a href="mailto:support@bybench.com" style="color: ${brandColor}; text-decoration: none;">support@bybench.com</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #555;">
              © 2026 ByBench Inc. Dhaka, Bangladesh.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.mailService.send(email, subject, html);
  }

  async sendSellerCredentials(email: string, pass: string, name: string) {
    const subject = '🚀 Welcome to ByBench - Your Seller Account is Ready!';
    const brandColor = '#EA2754';
    const loginUrl = 'https://bybench.com/login';

    const html = `
      <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e1e1e1;">
          
          <div style="background-color: ${brandColor}; padding: 35px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; text-transform: uppercase;">ByBench Seller</h1>
            <p style="color: #ffffff; opacity: 0.8; margin-top: 5px;">Your Business Journey Starts Here</p>
          </div>

          <div style="padding: 45px 35px;">
            <p style="font-size: 18px; font-weight: 600; color: #111;">Congratulations ${name}!</p>
            <p style="color: #555; font-size: 15px;">Admin has created a verified seller account for you. Use the credentials below to log in and start managing your store:</p>
            
            <div style="background-color: #f9f9fb; border-left: 4px solid ${brandColor}; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Temporary Password:</strong> <span style="color: ${brandColor}; font-family: monospace; font-weight: bold;">${pass}</span></p>
            </div>

            <div style="text-align: center; margin-bottom: 35px;">
              <a href="${loginUrl}" style="background-color: ${brandColor}; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">Login to Dashboard</a>
            </div>

            <div style="background-color: #fff9e6; border-radius: 8px; padding: 15px; border: 1px solid #ffeeba;">
               <p style="margin: 0; font-size: 13px; color: #856404; text-align: center;">
                ⚠️ <strong>Security Tip:</strong> For your safety, please <strong>change your password</strong> immediately after your first login.
              </p>
            </div>
          </div>

          <div style="background-color: #111; padding: 25px; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #555;">
              © 2026 ByBench Inc. Dhaka, Bangladesh. <br>
              If you didn't expect this email, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.mailService.send(email, subject, html);
  }
}
