/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AllMailService } from './all-mail.service';
import { TranslationService } from 'src/translation/translation.service';
import { ApiQuery, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Mail & Support')
@Controller('mail')
export class MailController {
  constructor(
    private readonly allMailService: AllMailService,
    private readonly translationService: TranslationService,
  ) {}

  @Post('contact')
  @ApiOperation({ summary: 'Send a contact message to admin' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async handleContactMessage(
    @Body()
    contactData: {
      name: string;
      email: string;
      subject: string;
      message: string;
    },
    @Query('lang') lang: string = 'en',
  ) {
    const { name, email, subject, message } = contactData;

    if (!name || !email || !subject || !message) {
      throw new HttpException(
        await this.translationService.translate(
          'All fields are required',
          lang,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const adminEmail = process.env.CLIENT_EMAIL_CO!;

      if (!adminEmail) {
        throw new Error('Admin email configuration is missing in .env');
      }

      await this.allMailService.sendContactAdminEmail(adminEmail, {
        name,
        email,
        subject,
        message,
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Your message has been sent successfully to Finn support!',
          lang,
        ),
      };
    } catch (err: any) {
      console.error('Contact Mail Error:', err.message);
      throw new HttpException(
        await this.translationService.translate(
          'Failed to send email. Please try again later.',
          lang,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
