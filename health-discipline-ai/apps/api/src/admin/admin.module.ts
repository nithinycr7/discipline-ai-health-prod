import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { Call, CallSchema } from '../calls/schemas/call.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Subscription, SubscriptionSchema } from '../subscriptions/schemas/subscription.schema';
import { Medicine, MedicineSchema } from '../medicines/schemas/medicine.schema';
import { CallsModule } from '../calls/calls.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Call.name, schema: CallSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Medicine.name, schema: MedicineSchema },
    ]),
    CallsModule,
    PatientsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
