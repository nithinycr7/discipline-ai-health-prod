import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Medicine, MedicineDocument } from './schemas/medicine.schema';
import { MedicineCatalogService } from './medicine-catalog.service';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

@Injectable()
export class MedicinesService {
  private readonly logger = new Logger(MedicinesService.name);

  constructor(
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    private catalogService: MedicineCatalogService,
    private callConfigsService: CallConfigsService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async create(patientId: string, dto: CreateMedicineDto): Promise<MedicineDocument> {
    // Try to find in catalog for auto-mapping
    let genericName = dto.genericName;
    let linkedCondition = dto.linkedCondition;
    let catalogId: Types.ObjectId | undefined;
    let needsReview = false;

    if (!genericName) {
      const catalogMatch = await this.catalogService.findByBrandName(dto.brandName);
      if (catalogMatch) {
        genericName = catalogMatch.genericName;
        linkedCondition = linkedCondition || catalogMatch.linkedConditions[0];
        catalogId = catalogMatch._id;
      } else {
        needsReview = true;
      }
    }

    const medicine = await this.medicineModel.create({
      ...dto,
      patientId: new Types.ObjectId(patientId),
      genericName,
      linkedCondition,
      catalogId,
      needsReview,
      nicknames: dto.nicknames || [],
      isCritical: dto.isCritical || false,
    });

    // Auto-create/update CallConfig for this timing slot
    try {
      const subscription = await this.subscriptionsService.findByPatient(patientId);
      const plan = subscription?.plan || 'sampurna';
      await this.callConfigsService.createOrUpdateForMedicine(patientId, dto.timing, plan);
    } catch (err: any) {
      this.logger.warn(`Failed to auto-create CallConfig for patient ${patientId}: ${err.message}`);
    }

    return medicine;
  }

  async findByPatient(patientId: string): Promise<MedicineDocument[]> {
    return this.medicineModel
      .find({ patientId: new Types.ObjectId(patientId), isActive: true })
      .sort({ timing: 1 });
  }

  async findByPatientAndTiming(patientId: string, timing: string): Promise<MedicineDocument[]> {
    return this.medicineModel.find({
      patientId: new Types.ObjectId(patientId),
      timing,
      isActive: true,
    });
  }

  async findById(id: string): Promise<MedicineDocument> {
    const medicine = await this.medicineModel.findById(id);
    if (!medicine) throw new NotFoundException('Medicine not found');
    return medicine;
  }

  async update(id: string, dto: UpdateMedicineDto): Promise<MedicineDocument> {
    const existing = await this.medicineModel.findById(id);
    if (!existing) throw new NotFoundException('Medicine not found');

    const oldTiming = existing.timing;

    const medicine = await this.medicineModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );

    // Handle timing change — clean up old slot, set up new slot
    if (dto.timing && dto.timing !== oldTiming) {
      const patientId = medicine.patientId.toString();
      try {
        // Check if old slot still has active medicines
        const remainingInOldSlot = await this.medicineModel.countDocuments({
          patientId: medicine.patientId,
          timing: oldTiming,
          isActive: true,
        });
        if (remainingInOldSlot === 0) {
          await this.callConfigsService.clearSlot(patientId, oldTiming);
        }

        // Ensure new slot is configured
        const subscription = await this.subscriptionsService.findByPatient(patientId);
        const plan = subscription?.plan || 'sampurna';
        await this.callConfigsService.createOrUpdateForMedicine(patientId, dto.timing, plan);
      } catch (err: any) {
        this.logger.warn(`Failed to update CallConfig for timing change: ${err.message}`);
      }
    }

    return medicine;
  }

  async remove(id: string): Promise<void> {
    const medicine = await this.medicineModel.findById(id);
    if (!medicine) throw new NotFoundException('Medicine not found');

    // Soft delete
    await this.medicineModel.findByIdAndUpdate(id, { $set: { isActive: false } });

    // Check if slot still has active medicines; if not, clear the slot
    try {
      const remainingInSlot = await this.medicineModel.countDocuments({
        patientId: medicine.patientId,
        timing: medicine.timing,
        isActive: true,
        _id: { $ne: medicine._id },
      });
      if (remainingInSlot === 0) {
        await this.callConfigsService.clearSlot(medicine.patientId.toString(), medicine.timing);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to clear CallConfig slot: ${err.message}`);
    }
  }

  async getFlaggedMedicines(): Promise<MedicineDocument[]> {
    return this.medicineModel.find({ needsReview: true }).sort({ createdAt: -1 });
  }

  async reviewMedicine(id: string, genericName: string, linkedCondition?: string): Promise<MedicineDocument> {
    return this.medicineModel.findByIdAndUpdate(
      id,
      {
        $set: {
          genericName,
          linkedCondition,
          needsReview: false,
          reviewedAt: new Date(),
        },
      },
      { new: true },
    );
  }

  async getMedicineSchedule(patientId: string): Promise<Record<string, MedicineDocument[]>> {
    const medicines = await this.findByPatient(patientId);
    const schedule: Record<string, MedicineDocument[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };
    for (const med of medicines) {
      if (schedule[med.timing]) {
        schedule[med.timing].push(med);
      }
    }
    return schedule;
  }
}
