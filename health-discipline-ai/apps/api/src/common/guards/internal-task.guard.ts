import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard for internal endpoints triggered by Cloud Tasks / Cloud Scheduler.
 * Verifies the X-CloudTasks-Secret header matches the configured secret.
 */
@Injectable()
export class InternalTaskGuard implements CanActivate {
  private readonly secret: string;

  constructor(private configService: ConfigService) {
    this.secret = this.configService.get<string>('CLOUD_TASKS_INTERNAL_SECRET', '');
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.secret) {
      throw new UnauthorizedException('Internal secret not configured');
    }

    const request = context.switchToHttp().getRequest();
    const headerSecret = request.headers['x-cloudtasks-secret'];

    if (headerSecret !== this.secret) {
      throw new UnauthorizedException('Invalid internal task secret');
    }

    return true;
  }
}
