import { ExperimentStep } from '@/types/game';
import { eventEmitter } from '@/engine/events/emitter';

export interface ValidationResult {
  correct: boolean;
  stepId: string;
  message: string;
  safetyNote?: string;
}

export class StepValidator {
  validate(currentStep: ExperimentStep, action: string, target: string, value?: number): ValidationResult {
    const actionMatch = currentStep.action === action;
    let targetMatch = false;
    let valueMatch = true;

    if (currentStep.action === 'measure' && currentStep.target.includes(':')) {
      const [expectedReagent, expectedAmount] = currentStep.target.split(':');
      const actualReagent = target.includes(':') ? target.split(':')[0] : target;
      targetMatch = actionMatch && actualReagent === expectedReagent;
      if (targetMatch && value !== undefined && currentStep.tolerance > 0) {
        valueMatch = Math.abs(value - parseFloat(expectedAmount)) <= currentStep.tolerance;
      } else if (targetMatch && value === undefined) {
        valueMatch = false;
      }
    } else {
      targetMatch = actionMatch && currentStep.target === target;
    }

    if (value !== undefined && currentStep.tolerance > 0 && currentStep.action !== 'measure') {
      const targetValue = parseFloat(currentStep.target.split(':')[1] || '0');
      valueMatch = Math.abs(value - targetValue) <= currentStep.tolerance;
    }

    const correct = actionMatch && targetMatch && valueMatch;
    const result: ValidationResult = {
      correct,
      stepId: currentStep.id,
      message: correct ? '操作正确！' : currentStep.errorPrompt,
    };
    if (currentStep.safetyNote) {
      result.safetyNote = currentStep.safetyNote;
    }
    if (!correct) {
      eventEmitter.emit('step:error', { stepId: currentStep.id, message: currentStep.errorPrompt, safetyNote: currentStep.safetyNote });
    } else {
      eventEmitter.emit('step:complete', { stepId: currentStep.id });
    }
    return result;
  }
}

export const stepValidator = new StepValidator();
