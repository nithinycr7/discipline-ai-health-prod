import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SocialLoginDto {
  @ApiProperty({
    description: 'Firebase ID token from Google/Apple sign-in',
  })
  @IsString()
  @IsNotEmpty()
  firebaseIdToken: string;

  @ApiProperty({
    description: 'Social login provider',
    enum: ['google', 'apple'],
  })
  @IsEnum(['google', 'apple'])
  provider: 'google' | 'apple';

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;
}
