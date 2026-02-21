import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { MedicinesModule } from './medicines/medicines.module';
import { CallsModule } from './calls/calls.module';
import { CallConfigsModule } from './call-configs/call-configs.module';
import { CallSchedulerModule } from './call-scheduler/call-scheduler.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { DistributedLockModule } from './distributed-lock/distributed-lock.module';
import { CloudTasksModule } from './cloud-tasks/cloud-tasks.module';
import { FirebaseAdminModule } from './firebase/firebase-admin.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('DB_NAME'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    DistributedLockModule,
    CloudTasksModule,
    FirebaseAdminModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    MedicinesModule,
    CallsModule,
    CallConfigsModule,
    CallSchedulerModule,
    SubscriptionsModule,
    IntegrationsModule,
    ReportsModule,
    NotificationsModule,
    HealthModule,
    WebhooksModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
