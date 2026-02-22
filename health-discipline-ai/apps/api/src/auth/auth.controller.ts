import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterPayerDto } from './dto/register-payer.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private logger = new Logger('AuthController');

  constructor(private authService: AuthService) {}

  @Public()
  @Post('register/payer')
  @ApiOperation({ summary: 'Register B2C payer (NRI child)' })
  async registerPayer(@Body() dto: RegisterPayerDto) {
    return this.authService.registerPayer(dto);
  }

  @Public()
  @Post('register/hospital')
  @ApiOperation({ summary: 'Register B2B hospital admin' })
  async registerHospital(@Body() dto: RegisterHospitalDto) {
    return this.authService.registerHospital(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone or email' })
  async login(@Body() dto: LoginDto) {
    try {
      this.logger.log(`Login attempt for identifier: ${dto.identifier}`);
      return await this.authService.login(dto);
    } catch (error) {
      this.logger.error(
        `Login failed for identifier: ${dto.identifier}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Firebase Phone OTP and login/register payer' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    try {
      this.logger.log(`Verify OTP attempt for phone from Firebase token`);
      return await this.authService.verifyFirebaseOtp(dto);
    } catch (error) {
      this.logger.error(
        `Verify OTP failed`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  @Public()
  @Post('social-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Google/Apple via Firebase' })
  async socialLogin(@Body() dto: SocialLoginDto) {
    try {
      this.logger.log(`Social login attempt with provider: ${dto.provider}`);
      return await this.authService.verifySocialLogin(dto);
    } catch (error) {
      this.logger.error(
        `Social login failed for provider: ${dto.provider}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: any) {
    return this.authService.validateUser(user.userId);
  }
}
