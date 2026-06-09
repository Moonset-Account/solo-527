export const ACHIEVEMENTS = [
    {
        id: 'first_win',
        name: '首战告捷',
        description: '完成第一个关卡',
        icon: '🏆',
        condition: (stats) => stats.levelsCompleted >= 1,
        reward: { points: 100 }
    },
    {
        id: 'speed_demon',
        name: '极速响应',
        description: '在30秒内处理5个事件',
        icon: '⚡',
        condition: (stats) => stats.fastestBatch5 && stats.fastestBatch5 <= 30,
        reward: { points: 200 }
    },
    {
        id: 'budget_master',
        name: '预算大师',
        description: '关卡结束时预算超过2000',
        icon: '💰',
        condition: (stats) => stats.maxEndBudget >= 2000,
        reward: { points: 150 }
    },
    {
        id: 'perfect_satisfaction',
        name: '完美市长',
        description: '单局满意度达到95%以上',
        icon: '⭐',
        condition: (stats) => stats.maxSatisfaction >= 95,
        reward: { points: 300 }
    },
    {
        id: 'flood_fighter',
        name: '抗洪英雄',
        description: '累计处理20个内涝事件',
        icon: '🌊',
        condition: (stats) => (stats.eventStats.FLOOD || 0) >= 20,
        reward: { points: 250 }
    },
    {
        id: 'fire_fighter',
        name: '消防先锋',
        description: '累计处理20个火灾事件',
        icon: '🔥',
        condition: (stats) => (stats.eventStats.FIRE || 0) >= 20,
        reward: { points: 250 }
    },
    {
        id: 'all_clear',
        name: '万无一失',
        description: '单局无任何事件超时失败',
        icon: '🛡️',
        condition: (stats) => stats.perfectRuns >= 1,
        reward: { points: 400 }
    },
    {
        id: 'completionist',
        name: '全通关',
        description: '完成所有关卡',
        icon: '👑',
        condition: (stats) => stats.levelsCompleted >= 5,
        reward: { points: 500 }
    }
];

export function checkAchievements(stats, unlockedIds) {
    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
        if (!unlockedIds.includes(ach.id) && ach.condition(stats)) {
            newlyUnlocked.push(ach);
        }
    }
    return newlyUnlocked;
}
