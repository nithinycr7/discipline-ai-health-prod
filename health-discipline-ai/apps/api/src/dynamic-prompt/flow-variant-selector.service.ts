import { Injectable } from '@nestjs/common';
import {
  ConversationVariant,
  ToneDirective,
  RelationshipStage,
  PatientCallContext,
} from './types/prompt-context.types';

@Injectable()
export class FlowVariantSelectorService {
  selectVariant(context: PatientCallContext): ConversationVariant {
    // Priority-ordered selection logic
    if (context.isStreakMilestone) {
      return ConversationVariant.CELEBRATION;
    }

    if (context.recentMissedCalls >= 2 || context.fatigueScore > 60) {
      return ConversationVariant.GENTLE_REENGAGEMENT;
    }

    if (
      context.yesterdayMood === 'not_well' ||
      context.recentComplaints.length > 0
    ) {
      return ConversationVariant.WELLNESS_FIRST;
    }

    if (context.adherence14Day > 90 && context.callsCompletedCount > 30) {
      return ConversationVariant.QUICK_CHECK;
    }

    return ConversationVariant.STANDARD;
  }

  selectTone(
    variant: ConversationVariant,
    context: PatientCallContext,
  ): ToneDirective {
    switch (variant) {
      case ConversationVariant.CELEBRATION:
        // Use festive tone for major milestones (30+ days)
        if (context.streakMilestoneValue && context.streakMilestoneValue >= 30) {
          return ToneDirective.FESTIVE_JOYFUL;
        }
        return ToneDirective.CELEBRATORY_PROUD;

      case ConversationVariant.GENTLE_REENGAGEMENT:
        return ToneDirective.REASSURING_PATIENT;

      case ConversationVariant.WELLNESS_FIRST:
        return ToneDirective.GENTLE_CONCERNED;

      case ConversationVariant.QUICK_CHECK:
        return ToneDirective.LIGHT_BREEZY;

      default:
        return ToneDirective.WARM_CHEERFUL;
    }
  }

  getRelationshipStage(callsCompleted: number): RelationshipStage {
    if (callsCompleted <= 3) return RelationshipStage.STRANGER;
    if (callsCompleted <= 14) return RelationshipStage.ACQUAINTANCE;
    if (callsCompleted <= 30) return RelationshipStage.FAMILIAR;
    if (callsCompleted <= 60) return RelationshipStage.TRUSTED;
    return RelationshipStage.FAMILY;
  }
}
