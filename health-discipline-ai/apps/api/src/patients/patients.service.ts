import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { FamilyMember, FamilyMemberDocument } from './schemas/family-member.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(FamilyMember.name) private familyMemberModel: Model<FamilyMemberDocument>,
  ) {}

  async create(userId: string, dto: CreatePatientDto): Promise<PatientDocument> {
    // Check duplicate phone for this user
    const existingForUser = await this.patientModel.findOne({
      userId: new Types.ObjectId(userId),
      phone: dto.phone,
    });
    if (existingForUser) {
      throw new ConflictException('You already have a patient with this phone number');
    }

    // Check if phone exists for other users (sibling scenario)
    const existingForOthers = await this.patientModel.findOne({
      phone: dto.phone,
      userId: { $ne: new Types.ObjectId(userId) },
    });

    if (existingForOthers) {
      // Allow creation but flag that shared access might be needed
      // The frontend can handle the "request shared access" flow
    }

    return this.patientModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      healthConditions: dto.healthConditions || [],
      hasGlucometer: dto.hasGlucometer || false,
      hasBPMonitor: dto.hasBPMonitor || false,
    });
  }

  async findAllByUser(userId: string): Promise<PatientDocument[]> {
    return this.patientModel.find({
      $or: [
        { userId: new Types.ObjectId(userId) },
        { authorizedUsers: new Types.ObjectId(userId) },
      ],
    }).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<PatientDocument> {
    const patient = await this.patientModel.findById(id);
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async findByIdForUser(id: string, userId: string): Promise<PatientDocument> {
    const patient = await this.findById(id);
    const uid = new Types.ObjectId(userId);
    const isOwner = patient.userId.equals(uid);
    const isAuthorized = patient.authorizedUsers.some((u) => u.equals(uid));
    if (!isOwner && !isAuthorized) {
      throw new ForbiddenException('Not authorized to access this patient');
    }
    return patient;
  }

  async update(id: string, userId: string, dto: UpdatePatientDto): Promise<PatientDocument> {
    await this.findByIdForUser(id, userId);
    const patient = await this.patientModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async pause(id: string, userId: string, reason?: string, pausedUntil?: Date): Promise<PatientDocument> {
    await this.findByIdForUser(id, userId);
    return this.patientModel.findByIdAndUpdate(
      id,
      { $set: { isPaused: true, pauseReason: reason, pausedUntil } },
      { new: true },
    );
  }

  async resume(id: string, userId: string): Promise<PatientDocument> {
    await this.findByIdForUser(id, userId);
    return this.patientModel.findByIdAndUpdate(
      id,
      { $set: { isPaused: false }, $unset: { pauseReason: 1, pausedUntil: 1 } },
      { new: true },
    );
  }

  async addAuthorizedUser(patientId: string, userId: string): Promise<PatientDocument> {
    return this.patientModel.findByIdAndUpdate(
      patientId,
      { $addToSet: { authorizedUsers: new Types.ObjectId(userId) } },
      { new: true },
    );
  }

  async incrementCallCount(id: string): Promise<PatientDocument> {
    const patient = await this.patientModel.findByIdAndUpdate(
      id,
      {
        $inc: { callsCompletedCount: 1 },
        $set: { lastCallAt: new Date() },
      },
      { new: true },
    );

    // Exit new patient mode after 3 calls
    if (patient && patient.callsCompletedCount >= 3 && patient.isNewPatient) {
      patient.isNewPatient = false;
      await patient.save();
    }

    return patient;
  }

  async setFirstCallAt(id: string): Promise<void> {
    await this.patientModel.updateOne(
      { _id: id, firstCallAt: { $exists: false } },
      { $set: { firstCallAt: new Date() } },
    );
  }

  // Family members
  async addFamilyMember(
    patientId: string,
    payerId: string,
    data: { name: string; phone: string; relationship: string; notificationLevel?: string },
  ): Promise<FamilyMemberDocument> {
    return this.familyMemberModel.create({
      patientId: new Types.ObjectId(patientId),
      primaryPayerId: new Types.ObjectId(payerId),
      ...data,
      notificationLevel: data.notificationLevel || 'weekly_plus_alerts',
    });
  }

  async getFamilyMembers(patientId: string): Promise<FamilyMemberDocument[]> {
    return this.familyMemberModel.find({ patientId: new Types.ObjectId(patientId), isActive: true });
  }

  async getActivePatients(): Promise<PatientDocument[]> {
    return this.patientModel.find({ isPaused: false, phoneStatus: 'valid' });
  }
}
