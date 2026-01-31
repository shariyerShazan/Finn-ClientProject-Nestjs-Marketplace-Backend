/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express'; // File na thakleo multipart handle korbe
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  AdminCreateSellerDto,
  AdminUpdateSellerDto,
} from './dto/admin-seller.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create-seller')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Admin can create a verified seller with individual inputs',
  })
  async createSeller(@Body() dto: AdminCreateSellerDto) {
    return await this.adminService.createSellerByAdmin(dto);
  }

  @Patch('update-seller/:id')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data') // Update er jonno o same interface ashbe
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Update seller auth and profile info' })
  async updateSeller(
    @Param('id') id: string,
    @Body() dto: AdminUpdateSellerDto,
  ) {
    return await this.adminService.updateSellerByAdmin(id, dto);
  }

  // Toggle ar Delete-e @ApiConsumes lagbe na, karon oigula shudhu Param nibe
  @Patch('toggle-suspension/:id')
  @ApiOperation({ summary: 'Toggle Seller suspension' })
  async toggleSuspension(@Param('id') id: string) {
    return await this.adminService.toggleSellerSuspension(id);
  }

  @Delete('delete-seller/:id')
  @ApiOperation({ summary: 'Hard delete a seller' })
  async deleteSeller(@Param('id') id: string) {
    return await this.adminService.deleteSeller(id);
  }
}
