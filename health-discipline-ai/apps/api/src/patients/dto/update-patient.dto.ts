import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @IsBoolean()
  @IsOptional()
  isPaused?: boolean;

  @IsString()
  @IsOptional()
  pauseReason?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  pausedUntil?: Date;
}
