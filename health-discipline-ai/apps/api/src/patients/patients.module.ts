import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { FamilyMember, FamilyMemberSchema } from './schemas/family-member.schema';
import { CallConfigsModule } from '../call-configs/call-configs.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MedicinesModule } from '../medicines/medicines.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { CallSchedulerModule } from '../call-scheduler/call-scheduler.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: FamilyMember.name, schema: FamilyMemberSchema },
    ]),
    CallConfigsModule,
    SubscriptionsModule,
    forwardRef(() => MedicinesModule),
    IntegrationsModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
