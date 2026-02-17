import { Injectable } from '@nestjs/common';
import {
  ConversationVariant,
  SCREENING_SCHEDULE,
  ScreeningQuestion,
} from './types/prompt-context.types';

const MAX_QUESTIONS_PER_CALL = 2;

@Injectable()
export class ScreeningQuestionSelectorService {
  /**
   * Select condition-specific screening questions for today's call.
   * Returns formatted prompt text and the question IDs for tracking.
   */
  selectQuestions(
    healthConditions: string[],
    dayOfWeek: string,
    variant: ConversationVariant,
  ): { text: string; questionIds: string[] } {
    // Skip screening on celebration and re-engagement calls
    if (
      variant === ConversationVariant.CELEBRATION ||
      variant === ConversationVariant.GENTLE_REENGAGEMENT
    ) {
      return { text: '', questionIds: [] };
    }

    const day = dayOfWeek.toLowerCase().slice(0, 3); // 'mon', 'tue', etc.

    // Find matching questions: patient has the condition AND today is a scheduled day
    const matching = SCREENING_SCHEDULE.filter(
      (q) =>
        healthConditions.includes(q.condition) && q.days.includes(day),
    );

    // Hard cap at MAX_QUESTIONS_PER_CALL
    const selected = matching.slice(0, MAX_QUESTIONS_PER_CALL);

    if (selected.length === 0) {
      return { text: '', questionIds: [] };
    }

    const questionIds = selected.map((q) => q.id);
    const text = this.formatQuestions(selected);

    return { text, questionIds };
  }

  /**
   * Get the current day of week as a short string.
   */
  getDayOfWeek(): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[new Date().getDay()];
  }

  private formatQuestions(questions: ScreeningQuestion[]): string {
    const lines = questions.map(
      (q, i) => `${i + 1}. ${q.question}`,
    );

    return `SCREENING QUESTIONS FOR TODAY (ask these AFTER the medicine check, before goodbye):
${lines.join('\n')}
Ask these naturally in the patient's language. Do not force them — if the patient seems tired or rushed, you may skip.`;
  }
}
