import { Module } from '@nestjs/common';
import { AdBoostService } from './ad-boost.service';
import { AdBoostController } from './ad-boost.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  providers: [AdBoostService, PrismaService, TranslationService],
  controllers: [AdBoostController],
})
export class AdBoostModule {}
