import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
// import { OtpMailService } from 'src/mail/otp-mail.service';
// import { PrismaService } from 'src/prisma/prisma.service';
import { MailModule } from 'src/mail/mail.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  imports: [MailModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TranslationService],
})
export class AuthModule {}
