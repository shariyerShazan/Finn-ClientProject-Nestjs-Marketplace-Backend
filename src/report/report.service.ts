/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateReportDto } from './dto/ReportAdDto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async reportAd(adId: string, userId: string, dto: CreateReportDto) {
    try {
      const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) throw new NotFoundException('Ad not found');

      if (ad.sellerId === userId) {
        throw new BadRequestException('You cannot report your own ad');
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
        message: 'Report submitted successfully',
        data: report,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('You have already reported this ad');
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  // --- GET ALL REPORTS (Admin Action) ---
  async getAllReports(query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
      const [total, reports] = await Promise.all([
        this.prisma.report.count(),
        this.prisma.report.findMany({
          include: {
            reporter: { select: { id: true, nickName: true, email: true } },
            ad: { select: { id: true, title: true, sellerId: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
      ]);

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage: Math.ceil(total / Number(limit)),
        },
        data: reports,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async getReportById(id: string) {
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
        throw new NotFoundException('Report not found');
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
  async deleteReport(reportId: string) {
    try {
      await this.prisma.report.delete({ where: { id: reportId } });
      return { success: true, message: 'Report deleted successfully' };
    } catch (error) {
      console.log(error);
      throw new NotFoundException('Report not found');
    }
  }

  async resolveReport(reportId: string) {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED' },
    });
    return {
      success: true,
      message: 'Report marked as resolved',
      data: report,
    };
  }

  async suspendReportedAuth(adId: string, reason: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      select: { sellerId: true },
    });

    if (!ad) {
      throw new NotFoundException('Target Ad not found');
    }
    if (!reason) {
      throw new NotFoundException('Reason need for suspend!');
    }
    const updatedAuth = await this.prisma.auth.update({
      where: { id: ad.sellerId },
      data: {
        isSuspended: true,
        suspensionReason: reason,
      },
    });

    return {
      success: true,
      message: `Account ${updatedAuth.nickName} has been suspended for: ${reason}`,
      data: updatedAuth,
    };
  }
}
