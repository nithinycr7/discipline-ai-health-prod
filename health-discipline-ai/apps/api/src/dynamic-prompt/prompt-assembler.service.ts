import { Injectable, Logger } from '@nestjs/common';
import { ContextBuilderService } from './context-builder.service';
import { FlowVariantSelectorService } from './flow-variant-selector.service';
import { ScreeningQuestionSelectorService } from './screening-question-selector.service';
import {
  ConversationVariant,
  ToneDirective,
  RelationshipStage,
  PatientCallContext,
  DynamicPromptResult,
} from './types/prompt-context.types';

@Injectable()
export class PromptAssemblerService {
  private readonly logger = new Logger(PromptAssemblerService.name);

  constructor(
    private contextBuilder: ContextBuilderService,
    private flowSelector: FlowVariantSelectorService,
    private screeningSelector: ScreeningQuestionSelectorService,
  ) {}

  async assembleDynamicPrompt(patientId: string): Promise<DynamicPromptResult> {
    const context = await this.contextBuilder.buildContext(patientId);
    const variant = this.flowSelector.selectVariant(context);
    const tone = this.flowSelector.selectTone(variant, context);
    const stage = this.flowSelector.getRelationshipStage(
      context.callsCompletedCount,
    );

    // Select screening questions
    const dayOfWeek = this.screeningSelector.getDayOfWeek();
    const screening = this.screeningSelector.selectQuestions(
      context.healthConditions,
      dayOfWeek,
      variant,
    );

    const result: DynamicPromptResult = {
      variant,
      tone,
      relationshipStage: stage,
      flowDirective: this.getFlowDirective(variant, context),
      toneDirectiveText: this.getToneDirectiveText(tone),
      contextNotes: this.getContextNotes(context),
      relationshipDirective: this.getRelationshipDirective(stage),
      firstMessage: this.getFirstMessage(variant, context),
      screeningQuestions: screening.text,
      screeningQuestionIds: screening.questionIds,
    };

    this.logger.log(
      `Dynamic prompt assembled for patient ${patientId}: ` +
        `variant=${variant}, tone=${tone}, stage=${stage}, ` +
        `screening=${screening.questionIds.length} questions`,
    );

    return result;
  }

  // --- Flow Directive Templates ---

  private getFlowDirective(
    variant: ConversationVariant,
    context: PatientCallContext,
  ): string {
    switch (variant) {
      case ConversationVariant.WELLNESS_FIRST:
        return this.buildWellnessFirstDirective(context);

      case ConversationVariant.QUICK_CHECK:
        return `CONVERSATION APPROACH — QUICK CHECK:
This patient is highly adherent and experienced. Keep the call brief and efficient.
You may check all medicines together ("Aaj sab dawai le li na?") instead of one by one.
Only ask individually if they indicate a problem. Be warm but respect their time.`;

      case ConversationVariant.CELEBRATION:
        return this.buildCelebrationDirective(context);

      case ConversationVariant.GENTLE_REENGAGEMENT:
        return `CONVERSATION APPROACH — GENTLE RE-ENGAGEMENT:
This patient has been less engaged recently. Be extra gentle and understanding.
Do NOT mention missed calls in a judgmental way. Simply express warmth.
Keep it short — check only the most critical medicines (skip non-critical if there are many).
The goal is to make them glad they picked up, not to complete a long checklist.`;

      default:
        return `CONVERSATION APPROACH — STANDARD CHECK-IN:
Follow the usual medicine check flow. Ask about each medicine one by one.`;
    }
  }

  private buildWellnessFirstDirective(context: PatientCallContext): string {
    let directive = `CONVERSATION APPROACH — WELLNESS FIRST:
Start by asking about how they are feeling today BEFORE checking medicines.`;

    if (context.yesterdayMood === 'not_well') {
      directive += `\nYesterday they reported feeling unwell. Ask specifically how they feel today compared to yesterday.`;
    }

    if (context.yesterdayComplaints.length > 0) {
      directive += `\nYesterday they mentioned: ${context.yesterdayComplaints.join(', ')}. Follow up on this — ask if it is better today.`;
    }

    if (context.recentComplaints.length > 0 && context.yesterdayComplaints.length === 0) {
      directive += `\nRecently they have mentioned: ${context.recentComplaints.join(', ')}. You may ask gently about this.`;
    }

    directive += `\nShow genuine concern and spend time on their wellbeing before transitioning to medicines.`;

    return directive;
  }

  private buildCelebrationDirective(context: PatientCallContext): string {
    const milestone = context.streakMilestoneValue || context.currentStreak;
    return `CONVERSATION APPROACH — CELEBRATION:
This is a celebration call! The patient has achieved a ${milestone}-day streak of taking their medicines consistently.
Start by congratulating them enthusiastically — express genuine pride, like a family member celebrating.
Tell them how amazing this is. Then do a brief medicine check (keep it light).
End with extra encouragement — tell them their family will be proud too.`;
  }

  // --- Tone Directive Templates ---

  private getToneDirectiveText(tone: ToneDirective): string {
    const toneMap: Record<ToneDirective, string> = {
      [ToneDirective.WARM_CHEERFUL]:
        'TONE: Be warm, cheerful, and encouraging throughout. There is a smile in your voice.',
      [ToneDirective.GENTLE_CONCERNED]:
        'TONE: Be gentle, concerned, and empathetic. Listen more than you speak. Show you genuinely care about their health.',
      [ToneDirective.CELEBRATORY_PROUD]:
        'TONE: Be celebratory and proud! Express genuine happiness and pride in their achievement. Like a family member cheering them on.',
      [ToneDirective.LIGHT_BREEZY]:
        'TONE: Be light, breezy, and conversational. Keep it relaxed and casual. Do not linger.',
      [ToneDirective.REASSURING_PATIENT]:
        'TONE: Be reassuring and extra patient. Speak slowly and gently. Make them feel safe, welcome, and not judged.',
      [ToneDirective.FESTIVE_JOYFUL]:
        'TONE: Be festive and joyful! Spread warmth and positive energy.',
    };
    return toneMap[tone];
  }

  // --- Context Notes ---

  private getContextNotes(context: PatientCallContext): string {
    const notes: string[] = [];

    if (context.yesterdayMood === 'not_well') {
      notes.push('Yesterday, the patient reported feeling unwell.');
    } else if (context.yesterdayMood === 'okay') {
      notes.push('Yesterday, the patient said they were feeling okay (not great, not bad).');
    }

    if (context.yesterdayComplaints.length > 0) {
      notes.push(
        `Yesterday's complaints: ${context.yesterdayComplaints.join(', ')}.`,
      );
    }

    if (context.currentStreak > 0) {
      notes.push(`Current medicine streak: ${context.currentStreak} consecutive days.`);
    }

    if (context.recentMissedCalls > 0) {
      notes.push(
        `${context.recentMissedCalls} missed/unanswered calls in the last 7 days.`,
      );
    }

    if (context.yesterdayMedicinesTotal > 0) {
      const pct = Math.round(
        (context.yesterdayMedicinesTaken / context.yesterdayMedicinesTotal) * 100,
      );
      if (pct < 80) {
        notes.push(
          `Yesterday, they took ${context.yesterdayMedicinesTaken} of ${context.yesterdayMedicinesTotal} medicines (${pct}%).`,
        );
      }
    }

    if (notes.length === 0) return '';

    return `CONTEXT FROM RECENT CALLS:\n${notes.join('\n')}`;
  }

  // --- Relationship Directive Templates ---

  private getRelationshipDirective(stage: RelationshipStage): string {
    const stageMap: Record<RelationshipStage, string> = {
      [RelationshipStage.STRANGER]:
        'RELATIONSHIP: This is a new patient (first few calls). Be polite and formal. Explain what you are doing. Use respectful language. Do not assume familiarity.',
      [RelationshipStage.ACQUAINTANCE]:
        'RELATIONSHIP: You are getting to know this patient. Be friendly but still respectful. Use their name warmly.',
      [RelationshipStage.FAMILIAR]:
        'RELATIONSHIP: You know this patient well. Be warm and familiar. You can reference that you speak regularly.',
      [RelationshipStage.TRUSTED]:
        'RELATIONSHIP: This patient trusts you deeply. Be like a caring family friend. You can be direct and comfortable.',
      [RelationshipStage.FAMILY]:
        'RELATIONSHIP: You are like family to this patient. Speak like a fond grandchild — warm, casual, occasionally playful. No need to be formal.',
    };
    return stageMap[stage];
  }

  // --- First Message Variants ---

  private readonly greetingMap: Record<string, string> = {
    hi: 'Hello',
    te: 'Hello',
    ta: 'Hello',
    kn: 'Hello',
    ml: 'Hello',
    bn: 'Hello',
    mr: 'Hello',
    gu: 'Hello',
    pa: 'Hello',
    ur: 'Hello',
    en: 'Hello',
  };

  // Language-specific first message templates
  private readonly firstMessageTemplates: Record<
    string,
    Record<string, string>
  > = {
    hi: {
      celebration: '{greeting} {name}! Aaj to bahut khushi ki baat hai!',
      gentle_reengagement: '{greeting} {name}! Kaise hain aap? Aapki yaad aa rahi thi.',
      wellness_first: '{greeting} {name}! Aaj tabiyat kaisi hai aapki?',
      quick_check: '{greeting} {name}! Sab theek?',
      standard: '{greeting} {name}!',
    },
    te: {
      celebration: '{greeting} {name}! Eediroju chala santhosham ga undi!',
      gentle_reengagement: '{greeting} {name}! Ela unnaru? Meeru gurthocharu.',
      wellness_first: '{greeting} {name}! Eediroju arogyanm ela undi?',
      quick_check: '{greeting} {name}! Antha baagane?',
      standard: '{greeting} {name}!',
    },
    ta: {
      celebration: '{greeting} {name}! Innaiku romba santhosham!',
      gentle_reengagement: '{greeting} {name}! Eppadi irukkeenga? Unga nyabagam vanthuchu.',
      wellness_first: '{greeting} {name}! Innaiku udambu eppadi irukku?',
      quick_check: '{greeting} {name}! Ellam nalla irukka?',
      standard: '{greeting} {name}!',
    },
    en: {
      celebration: '{greeting} {name}! Today is a wonderful day!',
      gentle_reengagement: '{greeting} {name}! How are you? I was thinking about you.',
      wellness_first: '{greeting} {name}! How are you feeling today?',
      quick_check: '{greeting} {name}! All good?',
      standard: '{greeting} {name}!',
    },
  };

  private getFirstMessage(
    variant: ConversationVariant,
    context: PatientCallContext,
  ): string {
    const name = context.patientName;
    const lang = context.preferredLanguage || 'hi';
    const greeting = this.greetingMap[lang] || 'Namaste';

    // Get language-specific templates, fall back to Hindi
    const templates =
      this.firstMessageTemplates[lang] || this.firstMessageTemplates['hi'];

    let template: string;
    switch (variant) {
      case ConversationVariant.CELEBRATION:
        template = templates.celebration;
        break;
      case ConversationVariant.GENTLE_REENGAGEMENT:
        template = templates.gentle_reengagement;
        break;
      case ConversationVariant.WELLNESS_FIRST:
        template = templates.wellness_first;
        break;
      case ConversationVariant.QUICK_CHECK:
        template = templates.quick_check;
        break;
      default:
        template = templates.standard;
    }

    return template.replace('{greeting}', greeting).replace('{name}', name);
  }
}
