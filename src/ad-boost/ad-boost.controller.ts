/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from 'prisma/generated/prisma/enums';
import { AdBoostService } from './ad-boost.service';
import {
  ApplyBoostDto,
  CreateBoostPackageDto,
  UpdateBoostPackageDto,
} from './dto/add-boost.dto';

@ApiTags('Ad Boost Management')
@ApiBearerAuth()
@Controller('ad-boost')
export class AdBoostController {
  constructor(private readonly boostService: AdBoostService) {}

  // 1. Admin creates a boost package (e.g., "7 Days Gold")
  @Post('package/create')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Create a boost package (Admin Only)' })
  @ApiQuery({ name: 'lang', required: false })
  async createPackage(
    @Body() dto: CreateBoostPackageDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.boostService.createPackage(dto, lang);
  }

  // 2. Seller applies a package to their specific Ad
  @Post('apply')
  @Roles(Role.SELLER)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Seller applies a package to an ad' })
  @ApiQuery({ name: 'lang', required: false })
  async applyBoost(
    @Body() dto: ApplyBoostDto,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.boostService.applyBoost(dto, req.userId, lang);
  }

  // 3. Get all available packages for sellers to browse
  @Get('packages/all')
  @ApiOperation({ summary: 'Get all active boost packages' })
  @ApiQuery({ name: 'lang', required: false })
  async findAllPackages(@Query('lang') lang: string = 'en') {
    return await this.boostService.getAllPackages(lang);
  }

  // 4. Update package details
  @Patch('package/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Update boost package (Admin Only)' })
  async updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdateBoostPackageDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.boostService.updatePackage(id, dto, lang);
  }

  // 5. Remove an active boost or package
  @Delete('delete/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Delete boost package (Admin Only)' })
  async remove(@Param('id') id: string, @Query('lang') lang: string = 'en') {
    return await this.boostService.deletePackage(id, lang);
  }
}
