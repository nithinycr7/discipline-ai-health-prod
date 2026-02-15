import { Module } from '@nestjs/common';
import { TwilioModule } from './twilio/twilio.module';
import { ElevenLabsModule } from './elevenlabs/elevenlabs.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ExotelModule } from './exotel/exotel.module';

@Module({
  imports: [TwilioModule, ElevenLabsModule, WhatsAppModule, ExotelModule],
  exports: [TwilioModule, ElevenLabsModule, WhatsAppModule, ExotelModule],
})
export class IntegrationsModule {}
