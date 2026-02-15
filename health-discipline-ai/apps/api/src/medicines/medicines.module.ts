import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicinesController } from './medicines.controller';
import { MedicinesService } from './medicines.service';
import { MedicineCatalogService } from './medicine-catalog.service';
import { Medicine, MedicineSchema } from './schemas/medicine.schema';
import { MedicineCatalog, MedicineCatalogSchema } from './schemas/medicine-catalog.schema';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Medicine.name, schema: MedicineSchema },
      { name: MedicineCatalog.name, schema: MedicineCatalogSchema },
    ]),
    forwardRef(() => PatientsModule),
  ],
  controllers: [MedicinesController],
  providers: [MedicinesService, MedicineCatalogService],
  exports: [MedicinesService, MedicineCatalogService],
})
export class MedicinesModule {}
