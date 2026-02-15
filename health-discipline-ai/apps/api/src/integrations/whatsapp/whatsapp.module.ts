import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { OnboardingFlowService } from './onboarding-flow.service';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [WhatsAppWebhookController],
  providers: [WhatsAppService, OnboardingFlowService],
  exports: [WhatsAppService, OnboardingFlowService],
})
export class WhatsAppModule {}
