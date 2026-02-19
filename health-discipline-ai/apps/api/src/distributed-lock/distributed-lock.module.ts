import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DistributedLockService } from './distributed-lock.service';
import { CronLock, CronLockSchema } from './schemas/cron-lock.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: CronLock.name, schema: CronLockSchema }]),
  ],
  providers: [DistributedLockService],
  exports: [DistributedLockService],
})
export class DistributedLockModule {}
