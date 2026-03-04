import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// import { Role } from '@prisma/client';
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
  @ApiResponse({ status: 201, description: 'Plan created successfully.' })
  async create(@Body() createDto: CreateSubscriptionPlanDto) {
    return await this.planService.createPlan(createDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiResponse({ status: 200, description: 'Return all plans.' })
  async findAll() {
    return await this.planService.getAllPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single plan details' })
  @ApiResponse({ status: 200, description: 'Return plan details.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  async findOne(@Param('id') id: string) {
    return await this.planService.getSinglePlan(id);
  }

  @Patch('update/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Update a subscription plan (Admin Only)' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionPlanDto,
  ) {
    return await this.planService.updatePlan(id, updateDto);
  }

  @Delete('delete/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Delete a subscription plan (Admin Only)' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully.' })
  async remove(@Param('id') id: string) {
    return await this.planService.deletePlan(id);
  }
}
