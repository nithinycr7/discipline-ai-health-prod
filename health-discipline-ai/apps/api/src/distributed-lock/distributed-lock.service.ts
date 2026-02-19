import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CronLock, CronLockDocument } from './schemas/cron-lock.schema';
import { randomBytes } from 'crypto';

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly instanceId = randomBytes(8).toString('hex');

  constructor(
    @InjectModel(CronLock.name)
    private cronLockModel: Model<CronLockDocument>,
  ) {
    this.logger.log(`Instance ID: ${this.instanceId}`);
  }

  async acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    try {
      const result = await this.cronLockModel.findOneAndUpdate(
        {
          lockKey,
          $or: [{ expiresAt: { $lte: now } }],
        },
        {
          $set: {
            holder: this.instanceId,
            acquiredAt: now,
            expiresAt,
          },
          $setOnInsert: {
            lockKey,
          },
        },
        { upsert: true, new: true },
      );

      const acquired = result?.holder === this.instanceId;
      if (acquired) {
        this.logger.debug(`Lock acquired: ${lockKey}`);
      }
      return acquired;
    } catch (error: any) {
      if (error.code === 11000) {
        this.logger.debug(`Lock contention on ${lockKey}, another instance holds it`);
        return false;
      }
      this.logger.error(`Lock acquisition error for ${lockKey}: ${error.message}`);
      return false;
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    try {
      await this.cronLockModel.deleteOne({
        lockKey,
        holder: this.instanceId,
      });
    } catch (error: any) {
      this.logger.warn(`Failed to release lock ${lockKey}: ${error.message}`);
    }
  }

  async withLock(
    lockKey: string,
    ttlSeconds: number,
    callback: () => Promise<void>,
  ): Promise<boolean> {
    const acquired = await this.acquireLock(lockKey, ttlSeconds);
    if (!acquired) return false;

    try {
      await callback();
    } finally {
      await this.releaseLock(lockKey);
    }
    return true;
  }
}
