import { GAME_CONFIG } from '../data/config.js';

const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export class TaskSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.tasks = [];
        this.nextId = 1;
    }

    createTask(event, priority = null) {
        if (!priority) priority = this._assessPriority(event);
        const task = {
            id: this.nextId++,
            eventId: event.id,
            eventType: event.type,
            location: { x: event.x, y: event.y },
            priority,
            priorityData: GAME_CONFIG.PRIORITY[priority],
            status: 'pending',
            assignedTeamId: null,
            createdAt: Date.now(),
            deadline: Date.now() + (event.timeLimit || 120) * 1000,
            suppliesRequired: Math.ceil(GAME_CONFIG.EVENT_TYPES[event.type].cost / 50),
            progress: 0,
            buildingName: event.buildingName || '未知地点'
        };
        this.tasks.push(task);
        this.eventBus.emit('task:created', task);
        this._reorder();
        return task;
    }

    _assessPriority(event) {
        const baseType = event.type;
        const typePriority = {
            FIRE: 'CRITICAL',
            FLOOD: 'HIGH',
            BLACKOUT: 'MEDIUM',
            ACCIDENT: 'MEDIUM',
            LANDSLIDE: 'CRITICAL'
        };
        let p = typePriority[baseType] || 'MEDIUM';
        const timeLeft = (event.timeLimit || 120) - event.timeActive;
        if (timeLeft < 30 && p !== 'CRITICAL') {
            const idx = PRIORITY_ORDER.indexOf(p);
            p = PRIORITY_ORDER[Math.max(0, idx - 1)];
        }
        return p;
    }

    assignTeam(taskId, teamId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;
        task.assignedTeamId = teamId;
        task.status = 'assigned';
        this.eventBus.emit('task:assigned', { task, teamId });
        this._reorder();
        return true;
    }

    completeTask(taskId) {
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx < 0) return null;
        const task = this.tasks[idx];
        task.status = 'completed';
        this.tasks.splice(idx, 1);
        this.eventBus.emit('task:completed', task);
        return task;
    }

    failTask(taskId) {
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx < 0) return null;
        const task = this.tasks[idx];
        task.status = 'failed';
        this.tasks.splice(idx, 1);
        this.eventBus.emit('task:failed', task);
        return task;
    }

    cancelTask(taskId) {
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx < 0) return null;
        const task = this.tasks[idx];
        task.assignedTeamId = null;
        task.status = 'pending';
        this.eventBus.emit('task:cancelled', task);
        return task;
    }

    escalateTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return null;
        const idx = PRIORITY_ORDER.indexOf(task.priority);
        if (idx > 0) {
            task.priority = PRIORITY_ORDER[idx - 1];
            task.priorityData = GAME_CONFIG.PRIORITY[task.priority];
            this.eventBus.emit('task:escalated', task);
            this._reorder();
        }
        return task;
    }

    _reorder() {
        this.tasks.sort((a, b) => {
            const wa = GAME_CONFIG.PRIORITY[a.priority].weight;
            const wb = GAME_CONFIG.PRIORITY[b.priority].weight;
            if (wa !== wb) return wb - wa;
            return a.deadline - b.deadline;
        });
    }

    update(dt) {
        for (const task of this.tasks) {
            if (task.status === 'in_progress') continue;
            const timeLeft = task.deadline - Date.now();
            if (timeLeft < 0 && task.status === 'pending') {
                this.failTask(task.id);
            }
        }
        this._reorder();
    }

    getTasks() {
        return [...this.tasks];
    }

    getTaskById(id) {
        return this.tasks.find(t => t.id === id);
    }

    getTasksByStatus(status) {
        return this.tasks.filter(t => t.status === status);
    }

    getPendingTasks() {
        return this.tasks.filter(t => t.status === 'pending');
    }
}
