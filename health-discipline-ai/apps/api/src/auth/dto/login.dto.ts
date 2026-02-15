import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+919876543210 or admin@hospital.com' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiPropertyOptional({ example: 'SecureP@ss123' })
  @IsString()
  @IsOptional()
  password?: string;
}
