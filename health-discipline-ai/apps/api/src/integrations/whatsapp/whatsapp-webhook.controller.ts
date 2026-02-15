import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { OnboardingFlowService } from './onboarding-flow.service';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('Webhooks')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  constructor(
    private onboardingFlowService: OnboardingFlowService,
    private whatsAppService: WhatsAppService,
  ) {}

  @Public()
  @Post('message')
  @ApiOperation({ summary: 'Handle incoming WhatsApp message' })
  async handleMessage(@Body() body: any) {
    const { From, Body: messageBody } = body;

    // Clean phone number (remove whatsapp: prefix)
    const phone = From?.replace('whatsapp:', '') || '';
    const message = messageBody || '';

    if (!phone || !message) {
      return { received: false, error: 'Missing phone or message' };
    }

    try {
      const response = await this.onboardingFlowService.handleMessage(phone, message);
      await this.whatsAppService.sendMessage(phone, response);
      return { received: true };
    } catch (error) {
      return { received: false, error: error.message };
    }
  }
}
