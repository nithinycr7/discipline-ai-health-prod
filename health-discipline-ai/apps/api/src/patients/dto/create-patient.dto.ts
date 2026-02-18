import {
  IsString, IsNotEmpty, IsNumber, IsArray, IsBoolean, IsOptional,
  IsIn, Min, Max, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'Ramesh Sharma' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Bauji', description: 'How AI addresses the patient' })
  @IsString()
  @IsNotEmpty()
  preferredName: string;

  @ApiProperty({ example: 72 })
  @IsNumber()
  @Min(1)
  @Max(150)
  age: number;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Phone number must include country code (e.g. +919876543210)' })
  phone: string;

  @ApiProperty({ example: 'hi', description: 'ISO language code' })
  @IsString()
  @IsNotEmpty()
  preferredLanguage: string;

  @ApiProperty({ example: 2, description: '0=no phone, 1=feature phone, 2=WhatsApp' })
  @IsNumber()
  @Min(0)
  @Max(2)
  digitalTier: number;

  @ApiPropertyOptional({ example: ['diabetes', 'hypertension'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  healthConditions?: string[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  hasGlucometer?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  hasBPMonitor?: boolean;

  @ApiProperty({ example: 'female', enum: ['male', 'female'] })
  @IsString()
  @IsIn(['male', 'female'])
  preferredVoiceGender: string;
}
