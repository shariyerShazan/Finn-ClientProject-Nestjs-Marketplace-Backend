/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateReportDto } from './dto/ReportAdDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
  ) {}

  async reportAd(
    adId: string,
    userId: string,
    dto: CreateReportDto,
    lang: string = 'en',
  ) {
    try {
      const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) {
        throw new NotFoundException(
          await this.translationService.translate('Ad not found', lang),
        );
      }

      if (ad.sellerId === userId) {
        throw new BadRequestException(
          await this.translationService.translate(
            'You cannot report your own ad',
            lang,
          ),
        );
      }

      const report = await this.prisma.report.create({
        data: {
          adId,
          reporterId: userId,
          reason: dto.reason,
          description: dto.description,
        },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Report submitted successfully',
          lang,
        ),
        data: report,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          await this.translationService.translate(
            'You have already reported this ad',
            lang,
          ),
        );
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  // --- GET ALL REPORTS (Admin Action) ---
  async getAllReports(query: any) {
    const { page = 1, limit = 10, lang = 'en' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
      const [total, reports] = await Promise.all([
        this.prisma.report.count(),
        this.prisma.report.findMany({
          include: {
            reporter: {
              select: {
                id: true,
                nickName: true,
                email: true,
                profilePicture: true,
              },
            },
            ad: { select: { id: true, title: true, sellerId: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
      ]);

      // Translate Ad titles in the report list
      const translatedReports = await Promise.all(
        reports.map(async (report) => ({
          ...report,
          ad: report.ad
            ? await this.translationService.translateData(
                report.ad,
                ['title'],
                lang,
              )
            : null,
        })),
      );

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage: Math.ceil(total / Number(limit)),
        },
        data: translatedReports,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getReportById(id: string, lang: string = 'en') {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id },
        include: {
          reporter: {
            select: {
              id: true,
              nickName: true,
              email: true,
              phone: true,
              profilePicture: true,
              createdAt: true,
            },
          },
          ad: {
            include: {
              images: true,
              seller: {
                select: {
                  id: true,
                  nickName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      if (!report) {
        throw new NotFoundException(
          await this.translationService.translate('Report not found', lang),
        );
      }

      // Translate Ad details if exists
      if (report.ad) {
        report.ad = await this.translationService.translateData(
          report.ad,
          ['title', 'description'],
          lang,
        );
      }

      return {
        success: true,
        data: report,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  // --- DELETE REPORT (Admin Action) ---
  async deleteReport(reportId: string, lang: string = 'en') {
    try {
      await this.prisma.report.delete({ where: { id: reportId } });
      return {
        success: true,
        message: await this.translationService.translate(
          'Report deleted successfully',
          lang,
        ),
      };
    } catch (error) {
      throw new NotFoundException(
        await this.translationService.translate('Report not found', lang),
      );
    }
  }

  async resolveReport(reportId: string, lang: string = 'en') {
    try {
      const report = await this.prisma.report.update({
        where: { id: reportId },
        data: { status: 'RESOLVED' },
      });
      return {
        success: true,
        message: await this.translationService.translate(
          'Report marked as resolved',
          lang,
        ),
        data: report,
      };
    } catch (error) {
      throw new NotFoundException(
        await this.translationService.translate('Report not found', lang),
      );
    }
  }

  async suspendReportedAuth(adId: string, reason: string, lang: string = 'en') {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      select: { sellerId: true },
    });

    if (!ad) {
      throw new NotFoundException(
        await this.translationService.translate('Target Ad not found', lang),
      );
    }
    if (!reason) {
      throw new BadRequestException(
        await this.translationService.translate(
          'Reason need for suspend!',
          lang,
        ),
      );
    }

    const updatedAuth = await this.prisma.auth.update({
      where: { id: ad.sellerId },
      data: {
        isSuspended: true,
        suspensionReason: reason,
      },
    });

    const msg = await this.translationService.translate(
      'Account has been suspended for',
      lang,
    );

    return {
      success: true,
      message: `${updatedAuth.nickName} ${msg}: ${reason}`,
      data: updatedAuth,
    };
  }
}
