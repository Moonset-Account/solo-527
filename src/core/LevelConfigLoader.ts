import { LEVELS } from '@/data/levelData';
import type { ComponentInstance, LevelConfig } from '@/game/types';
import { BaseCircuitComponent } from '@/game/components/BaseComponent';
import { deepClone } from '@/utils/serialization';

export class LevelConfigLoader {
  private static _instance: LevelConfigLoader | null = null;
  private _levels: LevelConfig[];

  private constructor() {
    this._levels = LEVELS.map((level) => this._normalizeLevel(deepClone(level)) as LevelConfig);
  }

  /**
   * 标准化预置元件端口结构。
   * 问题来源不一致：
   *  - 旧JSON: port.id 为 `-p1/-p2`，包含 `position`（世界坐标）
   *  - 标准: port.id 为 `:0/:1`，包含 `localOffset`（本地偏移 + `:index`)
   *  - properties 也要补充 `type` 判别字段
   */
  private _normalizeLevel(level: LevelConfig): LevelConfig {
    if (level.preplacedComponents && level.preplacedComponents.length > 0) {
      level.preplacedComponents = level.preplacedComponents.map((rawComp) =>
        this._normalizeComponent(rawComp as any)
      );
    }
    return level;
  }

  private _normalizeComponent(raw: any): ComponentInstance {
    const standard = BaseCircuitComponent.createInstance(
      raw.type,
      raw.position ?? { x: 0, y: 0 },
      raw.rotation ?? 0
    );
    standard.id = raw.id;
    if (raw.rotation !== undefined) standard.rotation = raw.rotation;
    const merged: any = { ...standard.properties };
    if (raw.properties) {
      Object.keys(raw.properties).forEach((k) => {
        merged[k] = raw.properties[k];
      });
    }
    // 统一属性别名：powerThreshold -> thresholdPower（JSON与代码命名差异）
    if (merged.powerThreshold !== undefined) {
      merged.thresholdPower = merged.powerThreshold;
      delete merged.powerThreshold;
    }
    if (merged.type === undefined) {
      merged.type = raw.type;
    }
    standard.properties = merged;
    // 确保 port.id 是 `${componentId}:${index}` 标准格式，port.componentId 匹配元件ID
    standard.ports.forEach((p, idx) => {
      p.componentId = raw.id;
      p.id = `${raw.id}:${idx}`;
    });
    return standard;
  }

  static getInstance(): LevelConfigLoader {
    if (!LevelConfigLoader._instance) {
      LevelConfigLoader._instance = new LevelConfigLoader();
    }
    return LevelConfigLoader._instance;
  }

  getAll(): LevelConfig[] {
    return [...this._levels];
  }

  getById(id: string): LevelConfig | undefined {
    return this._levels.find((level) => level.id === id);
  }

  getByOrder(order: number): LevelConfig | undefined {
    return this._levels.find((level) => level.order === order);
  }

  getTotalCount(): number {
    return this._levels.length;
  }

  getTutorialLevels(): LevelConfig[] {
    return this._levels.filter((level) => level.difficulty === 'tutorial');
  }

  getNonTutorialLevels(): LevelConfig[] {
    return this._levels.filter((level) => level.difficulty !== 'tutorial');
  }

  validateAll(): boolean {
    let valid = true;
    const requiredFields: Array<keyof LevelConfig> = [
      'id',
      'order',
      'name',
      'description',
      'difficulty',
      'prerequisites',
      'availableComponents',
      'objectives',
      'starConditions',
      'hints',
    ];

    const seenIds = new Set<string>();
    const seenOrders = new Set<number>();

    for (const level of this._levels) {
      const errors: string[] = [];

      for (const field of requiredFields) {
        if (!(field in level) || level[field] === undefined || level[field] === null) {
          errors.push(`缺少字段: ${String(field)}`);
        }
      }

      if (typeof level.id !== 'string' || level.id.trim() === '') {
        errors.push('id 必须是非空字符串');
      } else if (seenIds.has(level.id)) {
        errors.push(`重复的 id: ${level.id}`);
      } else {
        seenIds.add(level.id);
      }

      if (typeof level.order !== 'number' || !Number.isFinite(level.order) || level.order < 0) {
        errors.push('order 必须是非负数字');
      } else if (seenOrders.has(level.order)) {
        errors.push(`重复的 order: ${level.order}`);
      } else {
        seenOrders.add(level.order);
      }

      if (!Array.isArray(level.objectives) || level.objectives.length === 0) {
        errors.push('objectives 必须是非空数组');
      }

      if (!Array.isArray(level.starConditions) || level.starConditions.length === 0) {
        errors.push('starConditions 必须是非空数组');
      }

      if (!Array.isArray(level.availableComponents) || level.availableComponents.length === 0) {
        errors.push('availableComponents 必须是非空数组');
      }

      if (!Array.isArray(level.prerequisites)) {
        errors.push('prerequisites 必须是数组');
      }

      if (errors.length > 0) {
        valid = false;
        console.error(
          `[LevelConfigLoader] 关卡 "${level.id ?? '未知'}" 验证失败:`,
          errors.join('; ')
        );
      }
    }

    if (valid) {
      console.log(
        `[LevelConfigLoader] 所有 ${this._levels.length} 个关卡配置验证通过`
      );
    }

    return valid;
  }
}
