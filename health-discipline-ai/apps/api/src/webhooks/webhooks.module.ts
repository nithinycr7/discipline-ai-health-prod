import { Module } from '@nestjs/common';
import { ElevenLabsWebhookController } from '../integrations/elevenlabs/elevenlabs-webhook.controller';
import { ElevenLabsSetupController } from '../integrations/elevenlabs/elevenlabs-setup.controller';
import { CallsModule } from '../calls/calls.module';
import { PatientsModule } from '../patients/patients.module';
import { MedicinesModule } from '../medicines/medicines.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IntegrationsModule } from '../integrations/integrations.module';

/**
 * Webhooks Module
 *
 * Registers incoming webhook controllers that need access to domain modules.
 * Separated from IntegrationsModule to avoid circular dependencies
 * (IntegrationsModule is imported by domain modules, so it cannot import them back).
 */
@Module({
  imports: [
    CallsModule,
    PatientsModule,
    MedicinesModule,
    NotificationsModule,
    IntegrationsModule,
  ],
  controllers: [ElevenLabsWebhookController, ElevenLabsSetupController],
})
export class WebhooksModule {}
