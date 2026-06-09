export class SettlementReport {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = Date.now();
        this.endTime = null;
        this.duration = 0;
        this.eventsCreated = 0;
        this.eventsResolved = 0;
        this.eventsFailed = 0;
        this.eventsByType = {};
        this.tasksCreated = 0;
        this.tasksCompleted = 0;
        this.tasksFailed = 0;
        this.avgResponseTime = 0;
        this.responseTimes = [];
        this.peakActiveEvents = 0;
        this.totalBudgetEarned = 0;
        this.totalBudgetSpent = 0;
        this.totalSuppliesUsed = 0;
        this.satisfactionStart = 80;
        this.satisfactionEnd = 0;
        this.satisfactionLowest = 100;
        this.delays = 0;
        this.costEfficiency = 0;
        this.perfectRun = true;
        this.fastestBatch = [];
        this.batchWindowStart = null;
        this.batchCount = 0;
        this.fastestBatchTime = null;
    }

    onEventCreated(ev) {
        this.eventsCreated++;
        this.eventsByType[ev.type] = (this.eventsByType[ev.type] || 0) + 1;
    }

    onEventResolved(ev, responseTime) {
        this.eventsResolved++;
        this.responseTimes.push(responseTime);
        this.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
        const now = Date.now();
        if (!this.batchWindowStart) {
            this.batchWindowStart = now;
            this.batchCount = 1;
        } else {
            this.batchCount++;
            if (this.batchCount >= 5) {
                const elapsed = (now - this.batchWindowStart) / 1000;
                if (this.fastestBatchTime === null || elapsed < this.fastestBatchTime) {
                    this.fastestBatchTime = elapsed;
                }
                this.batchWindowStart = null;
                this.batchCount = 0;
            }
        }
    }

    onEventFailed(ev) {
        this.eventsFailed++;
        this.perfectRun = false;
    }

    onTaskCreated() { this.tasksCreated++; }
    onTaskCompleted() { this.tasksCompleted++; }
    onTaskFailed() { this.tasksFailed++; this.perfectRun = false; }

    onBudgetChange(delta) {
        if (delta > 0) this.totalBudgetEarned += delta;
        else this.totalBudgetSpent += -delta;
    }

    onSuppliesUsed(amount) {
        this.totalSuppliesUsed += amount;
    }

    onSatisfactionChange(total) {
        this.satisfactionEnd = total;
        this.satisfactionLowest = Math.min(this.satisfactionLowest, total);
    }

    onActiveEvents(count) {
        this.peakActiveEvents = Math.max(this.peakActiveEvents, count);
    }

    finalize(resources) {
        this.endTime = Date.now();
        this.duration = (this.endTime - this.startTime) / 1000;
        this.satisfactionEnd = resources.satisfaction;
        this.delays = resources.delays;
        this.finalBudget = resources.budget;
        this.costEfficiency = this.totalBudgetSpent > 0 ? this.eventsResolved / this.totalBudgetSpent * 1000 : 0;
        return this._calculateScore();
    }

    _calculateScore() {
        const S = {};
        S.eventPoints = this.eventsResolved * 100;
        S.failPenalty = this.eventsFailed * 200;
        S.satBonus = Math.floor(this.satisfactionEnd * 10);
        S.speedBonus = this.avgResponseTime > 0 ? Math.floor(Math.max(0, 60 - this.avgResponseTime) * 50) : 0;
        S.budgetBonus = Math.max(0, Math.floor((this.finalBudget - 500) / 10));
        S.efficiencyBonus = Math.floor(this.costEfficiency * 10);
        S.delayPenalty = this.delays * 50;
        S.perfectBonus = this.perfectRun ? 1000 : 0;

        S.total = S.eventPoints + S.satBonus + S.speedBonus + S.budgetBonus + S.efficiencyBonus + S.perfectBonus - S.failPenalty - S.delayPenalty;
        S.total = Math.max(0, S.total);

        let stars = 1;
        if (S.total >= 3000) stars = 2;
        if (S.total >= 6000) stars = 3;
        if (S.total >= 9000) stars = 4;
        if (S.total >= 12000) stars = 5;

        const summary = {
            score: S.total,
            stars,
            breakdown: S,
            stats: this._getStats(),
            grade: this._getGrade(S.total)
        };
        return summary;
    }

    _getStats() {
        return {
            duration: this.duration,
            eventsCreated: this.eventsCreated,
            eventsResolved: this.eventsResolved,
            eventsFailed: this.eventsFailed,
            eventsByType: { ...this.eventsByType },
            successRate: this.eventsCreated > 0 ? (this.eventsResolved / this.eventsCreated * 100).toFixed(1) + '%' : '0%',
            avgResponseTime: this.avgResponseTime.toFixed(1) + 's',
            peakActiveEvents: this.peakActiveEvents,
            totalBudgetEarned: this.totalBudgetEarned,
            totalBudgetSpent: this.totalBudgetSpent,
            totalSuppliesUsed: this.totalSuppliesUsed,
            netBudget: this.totalBudgetEarned - this.totalBudgetSpent,
            satisfactionStart: this.satisfactionStart,
            satisfactionEnd: this.satisfactionEnd,
            satisfactionLowest: this.satisfactionLowest,
            satisfactionChange: this.satisfactionEnd - this.satisfactionStart,
            delays: this.delays,
            perfectRun: this.perfectRun,
            fastestBatch5: this.fastestBatchTime ? this.fastestBatchTime.toFixed(1) + 's' : null
        };
    }

    _getGrade(total) {
        if (total >= 12000) return { letter: 'S', color: '#ffd700', desc: '传奇调度员' };
        if (total >= 9000) return { letter: 'A', color: '#00ff88', desc: '出色表现' };
        if (total >= 6000) return { letter: 'B', color: '#00aaff', desc: '良好表现' };
        if (total >= 3000) return { letter: 'C', color: '#ffaa00', desc: '合格' };
        return { letter: 'D', color: '#ff4444', desc: '需要努力' };
    }
}
