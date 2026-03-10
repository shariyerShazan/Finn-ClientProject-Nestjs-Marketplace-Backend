/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  // ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateReportDto } from './dto/ReportAdDto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // --- USER SECTION: Report an Ad ---
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':adId')
  @ApiOperation({ summary: 'Report an ad (User)' })
  @ApiParam({ name: 'adId', description: 'The ID of the Ad to report' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async reportAd(
    @Param('adId') adId: string,
    @Body() dto: CreateReportDto,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.reportService.reportAd(adId, req.user.id, dto, lang);
  }

  // --- ADMIN SECTION: Get All Reports ---
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  @ApiOperation({ summary: 'Get all reports with pagination (Admin only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getAllReports(@Query() query: any) {
    return await this.reportService.getAllReports(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  @ApiOperation({ summary: 'Get a single report by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The ID of the Report' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getReportById(
    @Param('id') id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.reportService.getReportById(id, lang);
  }

  // --- ADMIN SECTION: Delete a Report ---
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/:reportId')
  @ApiOperation({ summary: 'Delete a specific report (Admin only)' })
  @ApiParam({ name: 'reportId', description: 'The ID of the report to delete' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async deleteReport(
    @Param('reportId') reportId: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.reportService.deleteReport(reportId, lang);
  }

  @ApiBearerAuth()
  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mark a report as resolved (Admin)' })
  @ApiParam({ name: 'id', description: 'The ID of the report to resolve' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async resolveReport(
    @Param('id') id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.reportService.resolveReport(id, lang);
  }

  @ApiBearerAuth()
  @Post('suspend-auth/:adId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Suspend a seller/auth account via Ad ID (Admin)' })
  @ApiParam({ name: 'adId', description: 'The ID of the reported Ad' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async suspendAuth(
    @Param('adId') adId: string,
    @Body('reason') reason: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.reportService.suspendReportedAuth(adId, reason, lang);
  }
}
