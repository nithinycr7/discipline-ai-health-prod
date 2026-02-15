import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a subscription' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() body: { patientId: string; plan: string; paymentGateway?: string },
  ) {
    return this.subscriptionsService.create(userId, body.patientId, body.plan, body.paymentGateway);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get user subscriptions' })
  async findAll(@CurrentUser('userId') userId: string) {
    return this.subscriptionsService.findByUser(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  async cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.subscriptionsService.cancel(id, body.reason);
  }
}
