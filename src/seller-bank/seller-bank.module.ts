import { Module } from '@nestjs/common';
import { SellerBankService } from './seller-bank.service';
import { SellerBankController } from './seller-bank.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [SellerBankService, PrismaService],
  controllers: [SellerBankController],
})
export class SellerBankModule {}
