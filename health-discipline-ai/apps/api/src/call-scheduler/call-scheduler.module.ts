import { Module } from '@nestjs/common';
import { CallSchedulerService } from './call-scheduler.service';
import { CallOrchestratorService } from './call-orchestrator.service';
import { RetryHandlerService } from './retry-handler.service';
import { CallsModule } from '../calls/calls.module';
import { CallConfigsModule } from '../call-configs/call-configs.module';
import { PatientsModule } from '../patients/patients.module';
import { MedicinesModule } from '../medicines/medicines.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    CallsModule,
    CallConfigsModule,
    PatientsModule,
    MedicinesModule,
    IntegrationsModule,
    NotificationsModule,
  ],
  providers: [CallSchedulerService, CallOrchestratorService, RetryHandlerService],
  exports: [CallSchedulerService, CallOrchestratorService],
})
export class CallSchedulerModule {}
