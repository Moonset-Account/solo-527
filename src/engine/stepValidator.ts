import type { Step, StepAction, GameState, ErrorCondition } from '@/types';

interface ValidationResult {
  success: boolean;
  errors: ErrorCondition[];
  warnings: string[];
  stepComplete: boolean;
}

export class StepValidator {
  validate(step: Step, gameState: GameState, playerAction: StepAction): ValidationResult {
    const errors: ErrorCondition[] = [];
    const warnings: string[] = [];

    const actionMatch = step.action.type === playerAction.type;
    if (!actionMatch) {
      errors.push({
        id: 'err_action_type',
        type: 'action_mismatch',
        message: `操作类型不匹配，期望: ${step.action.type}, 实际: ${playerAction.type}`,
        severity: 'error',
      });
    }

    errors.push(...this.checkEquipment(step, gameState, playerAction));
    errors.push(...this.checkReagent(step, gameState, playerAction));
    errors.push(...this.checkTemperature(step, gameState));
    errors.push(...this.checkOrder(step, gameState.currentStepIndex));

    const criticalErrors = errors.filter((e) => e.severity === 'critical');
    const normalErrors = errors.filter((e) => e.severity === 'error');
    const warningErrors = errors.filter((e) => e.severity === 'warning');

    for (const w of warningErrors) {
      warnings.push(w.message);
    }

    const success = criticalErrors.length === 0 && normalErrors.length === 0;
    const stepComplete = success && actionMatch;

    return { success, errors, warnings, stepComplete };
  }

  private checkEquipment(step: Step, gameState: GameState, action: StepAction): ErrorCondition[] {
    const errors: ErrorCondition[] = [];
    const expectedEquipId = step.action.equipmentId;
    const actionEquipId = action.equipmentId;

    if (expectedEquipId) {
      const isPlaced = gameState.placedEquipment.some((e) => e.id === expectedEquipId);
      if (!isPlaced) {
        errors.push({
          id: 'err_equip_not_placed',
          type: 'equipment_missing',
          message: `所需器材尚未放置到实验台上`,
          severity: 'error',
        });
      }

      if (actionEquipId && actionEquipId !== expectedEquipId) {
        errors.push({
          id: 'err_equip_wrong',
          type: 'equipment_mismatch',
          message: `使用了错误的器材，请使用指定的器材进行操作`,
          severity: 'error',
        });
      }
    }

    const containerTypes = ['beaker', 'flask', 'test_tube', 'graduated_cylinder'];
    const needsContainer = ['add_reagent', 'drop', 'stir', 'heat', 'observe'].includes(action.type);
    if (needsContainer && !actionEquipId) {
      const hasContainer = gameState.placedEquipment.some((e) =>
        containerTypes.includes(e.type),
      );
      if (!hasContainer) {
        errors.push({
          id: 'err_no_container',
          type: 'equipment_missing',
          message: `请先放置容器（如烧杯、试管等）再进行操作`,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  private checkReagent(step: Step, gameState: GameState, action: StepAction): ErrorCondition[] {
    const errors: ErrorCondition[] = [];
    const expectedReagentId = step.action.reagentId;
    const actionReagentId = action.reagentId;

    if (expectedReagentId && action.type === 'add_reagent') {
      if (actionReagentId && actionReagentId !== expectedReagentId) {
        errors.push({
          id: 'err_reagent_wrong',
          type: 'reagent_mismatch',
          message: `使用了错误的试剂，请使用指定的试剂`,
          severity: 'error',
        });
      }

      const reagentAlreadyUsed = gameState.addedReagents.filter(
        (r) => r.reagent.id === expectedReagentId,
      );
      if (reagentAlreadyUsed.length > 0 && action.amount) {
        const totalAmount =
          reagentAlreadyUsed.reduce((sum, r) => sum + r.amount, 0) + action.amount;
        if (totalAmount > 100) {
          errors.push({
            id: 'err_reagent_excess',
            type: 'reagent_excess',
            message: `试剂加入量过多，请控制用量`,
            severity: 'warning',
          });
        }
      }
    }

    if (action.type === 'add_reagent' && !actionReagentId) {
      errors.push({
        id: 'err_reagent_unspecified',
        type: 'reagent_missing',
        message: `未指定要添加的试剂`,
        severity: 'error',
      });
    }

    return errors;
  }

  private checkTemperature(step: Step, gameState: GameState): ErrorCondition[] {
    const errors: ErrorCondition[] = [];
    const temp = gameState.temperature;
    const actionType = step.action.type;

    const stepInvolvesReagent = ['add_reagent', 'drop', 'heat'].includes(actionType);

    if (stepInvolvesReagent && temp > 100) {
      errors.push({
        id: 'err_temp_too_high',
        type: 'temperature',
        message: `温度过高（${Math.round(temp)}°C），可能导致危险，请降低加热强度`,
        severity: 'critical',
      });
    }

    if (stepInvolvesReagent && temp > 80) {
      errors.push({
        id: 'err_temp_high',
        type: 'temperature',
        message: `温度较高（${Math.round(temp)}°C），注意控制加热强度`,
        severity: 'warning',
      });
    }

    const heatRequiredActions = ['heat', 'dissolve', 'crystallize'];
    if (heatRequiredActions.includes(actionType) && !gameState.isHeating) {
      errors.push({
        id: 'err_not_heating',
        type: 'temperature',
        message: `当前步骤需要加热，请先点燃酒精灯`,
        severity: 'error',
      });
    }

    const coolRequiredActions = ['cool', 'crystallize'];
    if (coolRequiredActions.includes(actionType) && gameState.isHeating && temp > 60) {
      errors.push({
        id: 'err_should_cool',
        type: 'temperature',
        message: `当前步骤需要冷却，请停止加热`,
        severity: 'warning',
      });
    }

    return errors;
  }

  private checkOrder(step: Step, currentStepIndex: number): ErrorCondition[] {
    const errors: ErrorCondition[] = [];

    if (step.order > currentStepIndex + 1) {
      errors.push({
        id: 'err_step_skip',
        type: 'order_violation',
        message: `跳过了步骤，请按顺序完成实验操作`,
        severity: 'error',
      });
    }

    if (step.order > currentStepIndex + 1) {
      errors.push({
        id: 'err_step_ahead',
        type: 'order_violation',
        message: `请先完成当前步骤再进行下一步`,
        severity: 'warning',
      });
    }

    return errors;
  }
}
