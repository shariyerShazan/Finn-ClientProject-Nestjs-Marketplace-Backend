/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AllMailService } from './all-mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly allMailService: AllMailService) {}

  @Post('contact')
  async handleContactMessage(
    @Body()
    contactData: {
      name: string;
      email: string;
      subject: string;
      message: string;
    },
  ) {
    const { name, email, subject, message } = contactData;

    // ১. বেসিক ভ্যালিডেশন
    if (!name || !email || !subject || !message) {
      throw new HttpException(
        'All fields are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const adminEmail = process.env.CLIENT_EMAIL_CO!;

      if (!adminEmail) {
        throw new Error('Admin email configuration is missing in .env');
      }

      // ২. AllMailService থেকে ইমেল পাঠানো
      await this.allMailService.sendContactAdminEmail(adminEmail, {
        name,
        email,
        subject,
        message,
      });

      return {
        success: true,
        message: 'Your message has been sent successfully to Finn support!',
      };
    } catch (err: any) {
      // ৩. এরর হ্যান্ডেলিং
      console.error('Contact Mail Error:', err.message);

      throw new HttpException(
        err.message || 'Failed to send email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
