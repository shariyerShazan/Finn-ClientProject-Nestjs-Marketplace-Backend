import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
// import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
// import { SellerModule } from './seller/seller.module';
import { UserModule } from './user/user.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { SeedService } from './seed/data.seed';
import { CategoryModule } from './category/category.module';
import { PrismaService } from './prisma/prisma.service';
// import { AddService } from './add/add.service';
import { AddModule } from './add/add.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { CommentModule } from './comment/comment.module';
import { PaymentModule } from './payment/payment.module';
import { StripeModule } from './stripe/stripe.module';
// import { SellerBankModule } from './seller-bank/seller-bank.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    MailModule,
    StripeModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super-secret',
      signOptions: { expiresIn: '7d' },
    }),
    UserModule,
    CategoryModule,
    AddModule,
    CloudinaryModule,
    ChatModule,
    AdminModule,
    CommentModule,
    PaymentModule,
    ReportModule,
    // SellerBankModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService, JwtStrategy, PrismaService],
})
export class AppModule {}
