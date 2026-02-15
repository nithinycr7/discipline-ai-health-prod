import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallConfigsController } from './call-configs.controller';
import { CallConfigsService } from './call-configs.service';
import { CallConfig, CallConfigSchema } from './schemas/call-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CallConfig.name, schema: CallConfigSchema }]),
  ],
  controllers: [CallConfigsController],
  providers: [CallConfigsService],
  exports: [CallConfigsService],
})
export class CallConfigsModule {}
