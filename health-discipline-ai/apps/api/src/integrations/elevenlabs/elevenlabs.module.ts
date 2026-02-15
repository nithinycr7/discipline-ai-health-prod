import { Module } from '@nestjs/common';
import { ElevenLabsService } from './elevenlabs.service';
import { ElevenLabsAgentService } from './elevenlabs-agent.service';

@Module({
  providers: [ElevenLabsService, ElevenLabsAgentService],
  exports: [ElevenLabsService, ElevenLabsAgentService],
})
export class ElevenLabsModule {}
