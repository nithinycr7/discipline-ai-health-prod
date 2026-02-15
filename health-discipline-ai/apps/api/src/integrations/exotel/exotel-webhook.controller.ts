import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks/exotel')
export class ExotelWebhookController {
  private readonly logger = new Logger(ExotelWebhookController.name);

  @Public()
  @Post('status')
  @ApiOperation({ summary: 'Handle Exotel call status webhook' })
  async handleCallStatus(@Body() body: any) {
    /**
     * Exotel status callback fields:
     * - CallSid: Unique call identifier
     * - Status: completed | failed | busy | no-answer | canceled
     * - Direction: outbound
     * - Duration: Call duration in seconds
     * - RecordingUrl: URL of recorded call (if enabled)
     * - CustomField: Our internal callId passed during makeCall
     */
    const { CallSid, Status, Duration, CustomField, Legs } = body;

    this.logger.log(
      `Exotel webhook: CallSid=${CallSid}, Status=${Status}, Duration=${Duration}, CustomField=${CustomField}`,
    );

    // Map Exotel statuses to our internal statuses
    const statusMap: Record<string, string> = {
      completed: 'completed',
      'no-answer': 'no_answer',
      busy: 'busy',
      failed: 'failed',
      canceled: 'failed',
    };

    const internalStatus = statusMap[Status] || 'failed';
    const legDuration = Legs?.[0]?.Duration || Duration;

    // The CallOrchestratorService will handle the actual processing
    // This is wired up in the call-scheduler module
    return {
      received: true,
      callSid: CallSid,
      status: internalStatus,
      duration: parseInt(legDuration) || 0,
      callId: CustomField,
    };
  }
}
