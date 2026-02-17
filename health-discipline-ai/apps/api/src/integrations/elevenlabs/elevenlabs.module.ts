import { Module } from '@nestjs/common';
import { ElevenLabsService } from './elevenlabs.service';
import { ElevenLabsAgentService } from './elevenlabs-agent.service';
import { TranscriptParserService } from './transcript-parser.service';

@Module({
  providers: [ElevenLabsService, ElevenLabsAgentService, TranscriptParserService],
  exports: [ElevenLabsService, ElevenLabsAgentService, TranscriptParserService],
})
export class ElevenLabsModule {}
