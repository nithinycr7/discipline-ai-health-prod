import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CallConfigsService } from './call-configs.service';

@ApiTags('Call Configs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients/:patientId/call-config')
export class CallConfigsController {
  constructor(private callConfigsService: CallConfigsService) {}

  @Get()
  @ApiOperation({ summary: 'Get call configuration for a patient' })
  async get(@Param('patientId') patientId: string) {
    const config = await this.callConfigsService.findByPatient(patientId);
    if (!config) return { message: 'No call configuration found. Create one first.' };
    return config;
  }

  @Put()
  @ApiOperation({ summary: 'Update call configuration' })
  async update(@Param('patientId') patientId: string, @Body() data: any) {
    return this.callConfigsService.update(patientId, data);
  }
}
