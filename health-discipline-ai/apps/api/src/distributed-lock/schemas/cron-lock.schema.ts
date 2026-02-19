import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CronLockDocument = CronLock & Document;

@Schema({ collection: 'cronlocks' })
export class CronLock {
  @Prop({ required: true, unique: true })
  lockKey: string;

  @Prop({ required: true })
  holder: string;

  @Prop({ required: true })
  acquiredAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const CronLockSchema = SchemaFactory.createForClass(CronLock);

CronLockSchema.index({ lockKey: 1 }, { unique: true });
CronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
