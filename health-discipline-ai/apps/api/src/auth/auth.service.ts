import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { RegisterPayerDto } from './dto/register-payer.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { FIREBASE_ADMIN } from '../firebase/firebase-admin.module';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(FIREBASE_ADMIN) private firebaseApp: admin.app.App,
  ) {}

  async registerPayer(dto: RegisterPayerDto) {
    const existing = await this.usersService.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const user = await this.usersService.create({
      phone: dto.phone,
      name: dto.name,
      role: 'payer',
      location: dto.location,
      timezone: dto.timezone || 'Asia/Kolkata',
      relationshipToPatient: dto.relationshipToPatient,
    });

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async registerHospital(dto: RegisterHospitalDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.adminName,
      role: 'hospital_admin',
      hospitalName: dto.hospitalName,
      timezone: 'Asia/Kolkata',
    });

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const { identifier, password } = dto;

    // Normalize phone number (remove + prefix for consistency)
    const normalizedIdentifier = identifier.startsWith('+')
      ? identifier.substring(1)
      : identifier;

    // Try phone login first (B2C payer)
    let user = await this.usersService.findByPhone(normalizedIdentifier);

    // If not found with normalized, try original format
    if (!user && normalizedIdentifier !== identifier) {
      user = await this.usersService.findByPhone(identifier);
    }

    if (!user) {
      // Try email login (B2B hospital)
      user = await this.usersService.findByEmail(identifier);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If hospital_admin or super_admin with email, verify password
    if ((user.role === 'hospital_admin' || user.role === 'super_admin') && user.email) {
      if (!password) {
        throw new BadRequestException('Password required for admin accounts');
      }
      const userWithPassword = await this.usersService.findByEmailWithPassword(user.email);
      if (!userWithPassword?.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async verifyFirebaseOtp(dto: VerifyOtpDto) {
    // Verify the Firebase ID token
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await this.firebaseApp
        .auth()
        .verifyIdToken(dto.firebaseIdToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }

    // Extract phone number (Firebase stores in E.164 format)
    const phone = decodedToken.phone_number;
    if (!phone) {
      throw new BadRequestException(
        'Firebase token does not contain a phone number',
      );
    }

    // Check if user exists
    let user = await this.usersService.findByPhone(phone);

    if (user) {
      // LOGIN flow — existing user
      // Update Firebase UID and mark phone as verified
      if (!user.firebaseUid || user.firebaseUid !== decodedToken.uid) {
        user = await this.usersService.update(user._id.toString(), {
          firebaseUid: decodedToken.uid,
          phoneVerified: true,
        });
      }
      const tokens = await this.generateTokens(user);
      return { user: this.sanitizeUser(user), ...tokens, isNewUser: false };
    }

    // REGISTRATION flow — new user
    // If no name provided, signal the frontend to redirect to registration
    if (!dto.name) {
      return { needsRegistration: true, phone, isNewUser: true };
    }

    user = await this.usersService.create({
      phone,
      name: dto.name,
      role: 'payer',
      location: dto.location,
      timezone: dto.timezone || 'Asia/Kolkata',
      firebaseUid: decodedToken.uid,
      phoneVerified: true,
    });

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens, isNewUser: true };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  private async generateTokens(user: any) {
    const payload = { sub: user._id.toString(), role: user.role };

    const token = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { token, refreshToken };
  }

  private sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    return obj;
  }
}
