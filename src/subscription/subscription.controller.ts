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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  // ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionService } from './subscription.service';
import { Role } from 'prisma/generated/prisma/enums';

@ApiTags('Subscription Plans')
@ApiBearerAuth()
@Controller('subscription-plans')
export class SubscriptionController {
  constructor(private readonly planService: SubscriptionService) {}

  @Post('create')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Create a new subscription plan (Admin Only)' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async create(
    @Body() createDto: CreateSubscriptionPlanDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.planService.createPlan(createDto, lang);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async findAll(@Query('lang') lang: string = 'en') {
    return await this.planService.getAllPlans(lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single plan details' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async findOne(@Param('id') id: string, @Query('lang') lang: string = 'en') {
    return await this.planService.getSinglePlan(id, lang);
  }

  @Patch('update/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Update a subscription plan (Admin Only)' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionPlanDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.planService.updatePlan(id, updateDto, lang);
  }

  @Delete('delete/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Delete a subscription plan (Admin Only)' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async remove(@Param('id') id: string, @Query('lang') lang: string = 'en') {
    return await this.planService.deletePlan(id, lang);
  }
}
