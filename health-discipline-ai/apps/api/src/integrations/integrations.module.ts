import { Module } from '@nestjs/common';
import { TwilioModule } from './twilio/twilio.module';
import { ElevenLabsModule } from './elevenlabs/elevenlabs.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ExotelModule } from './exotel/exotel.module';
import { SarvamModule } from './sarvam/sarvam.module';

@Module({
  imports: [TwilioModule, ElevenLabsModule, WhatsAppModule, ExotelModule, SarvamModule],
  exports: [TwilioModule, ElevenLabsModule, WhatsAppModule, ExotelModule, SarvamModule],
})
export class IntegrationsModule {}
