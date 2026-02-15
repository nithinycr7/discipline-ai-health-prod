import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { UsersService } from '../../users/users.service';

// Onboarding state machine phases
const ONBOARDING_PHASES = [
  'payer_welcome',
  'payer_qualification',
  'payer_info',
  'patient_info',
  'patient_name',
  'patient_language',
  'patient_phone',
  'health_conditions',
  'medicine_entry',
  'medicine_loop',
  'family_network',
  'call_schedule',
  'plan_selection',
  'test_call',
  'completed',
] as const;

type OnboardingPhase = typeof ONBOARDING_PHASES[number];

@Injectable()
export class OnboardingFlowService {
  private readonly logger = new Logger(OnboardingFlowService.name);

  constructor(
    private whatsAppService: WhatsAppService,
    private usersService: UsersService,
  ) {}

  async handleMessage(from: string, message: string): Promise<string> {
    // Find or create user by phone
    let user = await this.usersService.findByPhone(from);

    if (!user) {
      // New user - start onboarding
      user = await this.usersService.create({
        phone: from,
        name: '',
        role: 'payer',
        timezone: 'Asia/Kolkata',
        health_onboarding_step: 'payer_welcome',
      });

      return this.getPhaseResponse('payer_welcome', message, user);
    }

    const currentPhase = (user.health_onboarding_step || 'payer_welcome') as OnboardingPhase;
    return this.getPhaseResponse(currentPhase, message, user);
  }

  private async getPhaseResponse(phase: OnboardingPhase, message: string, user: any): Promise<string> {
    switch (phase) {
      case 'payer_welcome':
        await this.usersService.updateOnboardingStep(user._id, 'payer_qualification');
        return 'Welcome to Health Discipline AI! Our AI makes daily voice calls to check if your parent has taken their medicines.\n\nAre you setting this up for a parent? (Yes/No)';

      case 'payer_qualification':
        if (message.toLowerCase().includes('yes')) {
          await this.usersService.updateOnboardingStep(user._id, 'payer_info');
          return 'Great! Let\'s get started. What is your name?';
        }
        return 'Currently we support monitoring for parents. Would you like to set this up for your parent? (Yes/No)';

      case 'payer_info':
        await this.usersService.update(user._id, { name: message.trim() });
        await this.usersService.updateOnboardingStep(user._id, 'patient_info');
        return `Nice to meet you, ${message.trim()}! Now let\'s add your parent\'s details.\n\nWhat is your parent\'s full name?`;

      case 'patient_info':
        // Store patient name temporarily and ask for preferred name
        await this.usersService.updateOnboardingStep(user._id, 'patient_name');
        return `Got it! Now the most important question - what does your family call ${message.trim()}?\n\nFor example: "Bauji", "Amma", "Papa"\n\nOur AI will use this name in every call.`;

      case 'patient_name':
        await this.usersService.updateOnboardingStep(user._id, 'patient_language');
        return `"${message.trim()}" - that's lovely! Our AI will always call them ${message.trim()}.\n\nWhich language does ${message.trim()} prefer?\n\n1. Hindi\n2. Telugu\n3. Tamil\n4. Marathi\n5. Bengali\n6. Kannada\n7. Gujarati\n8. English`;

      case 'patient_language':
        await this.usersService.updateOnboardingStep(user._id, 'patient_phone');
        return 'What is their phone number? (The number where we\'ll make the daily calls)';

      case 'patient_phone':
        await this.usersService.updateOnboardingStep(user._id, 'health_conditions');
        return 'What health conditions do they have? Select all that apply:\n\n1. Diabetes\n2. High BP (Hypertension)\n3. Heart Disease\n4. Arthritis\n5. Thyroid\n6. Cholesterol\n7. Other\n\n(Type numbers separated by commas, e.g., "1,2,5")';

      case 'health_conditions':
        await this.usersService.updateOnboardingStep(user._id, 'medicine_entry');
        return 'Now let\'s add their medicines one at a time.\n\nWhat is the first medicine? (Type the name as written on the strip/bottle)\n\nFor example: "Telma 40" or "Metformin 500"';

      case 'medicine_entry':
      case 'medicine_loop':
        await this.usersService.updateOnboardingStep(user._id, 'medicine_loop');
        return `Got it! I'll verify "${message.trim()}" in our database.\n\nWhen does your parent take this medicine?\n1. Morning\n2. Afternoon\n3. Evening\n4. Night`;

      case 'call_schedule':
        await this.usersService.updateOnboardingStep(user._id, 'completed');
        return 'Your setup is almost complete! We\'ll start the daily calls from tomorrow.\n\nWould you like us to place a test call now so your parent can hear the AI voice? (Yes/No)';

      case 'completed':
        return 'Your onboarding is complete! You\'ll start receiving daily health reports on WhatsApp. Visit our dashboard for detailed tracking.';

      default:
        return 'I\'m not sure what happened. Let me restart. Are you setting up health monitoring for a parent? (Yes/No)';
    }
  }
}
