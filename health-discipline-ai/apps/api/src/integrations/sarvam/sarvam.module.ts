import { Module } from '@nestjs/common';
import { SarvamAgentService } from './sarvam-agent.service';

@Module({
  providers: [SarvamAgentService],
  exports: [SarvamAgentService],
})
export class SarvamModule {}
