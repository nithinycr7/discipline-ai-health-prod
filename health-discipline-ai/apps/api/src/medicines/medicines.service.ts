import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Medicine, MedicineDocument } from './schemas/medicine.schema';
import { MedicineCatalogService } from './medicine-catalog.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

@Injectable()
export class MedicinesService {
  constructor(
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    private catalogService: MedicineCatalogService,
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

    return this.medicineModel.create({
      ...dto,
      patientId: new Types.ObjectId(patientId),
      genericName,
      linkedCondition,
      catalogId,
      needsReview,
      nicknames: dto.nicknames || [],
      isCritical: dto.isCritical || false,
    });
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
    const medicine = await this.medicineModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!medicine) throw new NotFoundException('Medicine not found');
    return medicine;
  }

  async remove(id: string): Promise<void> {
    // Soft delete - set isActive to false
    const result = await this.medicineModel.findByIdAndUpdate(id, { $set: { isActive: false } });
    if (!result) throw new NotFoundException('Medicine not found');
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
