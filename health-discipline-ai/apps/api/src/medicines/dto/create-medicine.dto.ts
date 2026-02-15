import { IsString, IsNotEmpty, IsArray, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicineDto {
  @ApiProperty({ example: 'Telma 40' })
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @ApiPropertyOptional({ example: 'Telmisartan 40mg' })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiPropertyOptional({ example: '40mg' })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiProperty({ example: 'morning', enum: ['morning', 'afternoon', 'evening', 'night'] })
  @IsString()
  @IsIn(['morning', 'afternoon', 'evening', 'night'])
  timing: string;

  @ApiProperty({ example: 'after', enum: ['before', 'after', 'with', 'anytime'] })
  @IsString()
  @IsIn(['before', 'after', 'with', 'anytime'])
  foodPreference: string;

  @ApiPropertyOptional({ example: ['BP wali goli'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nicknames?: string[];

  @ApiPropertyOptional({ example: 'hypertension' })
  @IsString()
  @IsOptional()
  linkedCondition?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isCritical?: boolean;
}
