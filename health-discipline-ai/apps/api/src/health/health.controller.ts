import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ElevenLabsService } from '../integrations/elevenlabs/elevenlabs.service';
import { ElevenLabsAgentService } from '../integrations/elevenlabs/elevenlabs-agent.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private elevenLabsService: ElevenLabsService,
    private elevenLabsAgentService: ElevenLabsAgentService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const [elevenlabsTts, elevenlabsAgent] = await Promise.all([
      this.elevenLabsService.healthCheck(),
      this.elevenLabsAgentService.healthCheck(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        elevenlabs_tts: elevenlabsTts,
        elevenlabs_agent: elevenlabsAgent,
      },
    };
  }
}
