import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  providers: [ReportService, PrismaService, TranslationService],
  controllers: [ReportController],
})
export class ReportModule {}
