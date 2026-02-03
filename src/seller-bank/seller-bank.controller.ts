/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { SellerBankService } from './seller-bank.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateSellerBankDto } from './dto/seller-bank.dto';
import { SellerGuard } from 'src/auth/guards/seller.guard';

@ApiTags('Seller Bank')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SellerGuard)
@Controller('seller-bank')
export class SellerBankController {
  constructor(private readonly sellerBankService: SellerBankService) {}

  @Post('save')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Add or Update seller bank/card details' })
  async addOrUpdateBank(@Req() req: any, @Body() dto: CreateSellerBankDto) {
    return await this.sellerBankService.addOrUpdateBank(req.user.id, dto);
  }

  @Get('my-bank')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current seller bank details' })
  async getBankDetails(@Req() req: any) {
    return await this.sellerBankService.getBankDetails(req.user.id);
  }
}
