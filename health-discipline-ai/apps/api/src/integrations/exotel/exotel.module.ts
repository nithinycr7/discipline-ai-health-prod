import { Module } from '@nestjs/common';
import { ExotelService } from './exotel.service';
import { ExotelWebhookController } from './exotel-webhook.controller';

@Module({
  providers: [ExotelService],
  controllers: [ExotelWebhookController],
  exports: [ExotelService],
})
export class ExotelModule {}
