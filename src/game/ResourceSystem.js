import { GAME_CONFIG } from '../data/config.js';

export class ResourceSystem {
    constructor(initial, eventBus) {
        this.budget = initial.budget;
        this.supplies = initial.supplies;
        this.satisfaction = 80;
        this.eventBus = eventBus;
        this.delays = 0;
        this.failurePenalty = 0;
    }

    spendBudget(amount) {
        if (this.budget >= amount) {
            this.budget -= amount;
            this.eventBus.emit('resource:budget_change', { delta: -amount, total: this.budget });
            return true;
        }
        return false;
    }

    earnBudget(amount) {
        this.budget += amount;
        this.eventBus.emit('resource:budget_change', { delta: amount, total: this.budget });
    }

    useSupplies(amount) {
        if (this.supplies >= amount) {
            this.supplies -= amount;
            this.eventBus.emit('resource:supplies_change', { delta: -amount, total: this.supplies });
            return true;
        }
        return false;
    }

    addSupplies(amount) {
        this.supplies += amount;
        this.eventBus.emit('resource:supplies_change', { delta: amount, total: this.supplies });
    }

    modifySatisfaction(delta, reason = '') {
        const old = this.satisfaction;
        this.satisfaction = Math.max(0, Math.min(100, this.satisfaction + delta));
        this.eventBus.emit('resource:satisfaction_change', {
            delta: this.satisfaction - old,
            total: this.satisfaction,
            reason
        });
    }

    handleEventResolved(event, timeRatio) {
        const info = GAME_CONFIG.EVENT_TYPES[event.type];
        const baseReward = info.cost;
        const speedBonus = timeRatio > 0.5 ? Math.floor(baseReward * 0.3) : 0;
        const totalReward = baseReward + speedBonus;
        this.earnBudget(totalReward);
        const satBonus = timeRatio > 0.7 ? 3 : timeRatio > 0.4 ? 2 : 1;
        this.modifySatisfaction(satBonus, `完成${info.name}`);
        return { reward: totalReward, satBonus, speedBonus };
    }

    handleEventFailed(event) {
        const info = GAME_CONFIG.EVENT_TYPES[event.type];
        const penalty = Math.floor(info.cost * 0.5);
        const satPenalty = Math.ceil(info.baseDamage * 0.8);
        this.failurePenalty += penalty;
        this.delays += 1;
        this.spendBudget(penalty);
        this.modifySatisfaction(-satPenalty, `${info.name}处理失败`);
        return { penalty, satPenalty };
    }

    handleTeamDispatch(team, task) {
        const cost = GAME_CONFIG.EVENT_TYPES[task.eventType].cost;
        if (task.suppliesRequired > 0) this.useSupplies(task.suppliesRequired);
    }

    tickTaxes() {
        const tax = Math.floor(this.satisfaction * 0.5);
        if (tax > 0) this.earnBudget(tax);
    }

    getSnapshot() {
        return {
            budget: this.budget,
            supplies: this.supplies,
            satisfaction: this.satisfaction,
            delays: this.delays,
            failurePenalty: this.failurePenalty
        };
    }
}
