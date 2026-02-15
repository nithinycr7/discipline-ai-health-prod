import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks/twilio')
export class TwilioWebhookController {
  @Public()
  @Post('status')
  @ApiOperation({ summary: 'Handle Twilio call status webhook' })
  async handleCallStatus(@Body() body: any) {
    // Handle call status updates from Twilio
    const { CallSid, CallStatus, CallDuration, ErrorCode } = body;

    // This would be handled by the CallOrchestratorService
    // For now just acknowledge
    return { received: true, callSid: CallSid, status: CallStatus };
  }
}
