export const GAME_CONFIG = {
    MAP_SIZE: 20,
    TILE_SIZE: 1,
    INITIAL_BUDGET: 1000,
    INITIAL_TEAMS: 3,
    INITIAL_SUPPLIES: 50,
    GAME_DURATION: 180,
    TICK_INTERVAL: 1000,
    COLORS: {
        ROAD: 0x555555,
        BUILDING: 0x8B7355,
        BUILDING_DAMAGED: 0x8B4513,
        PARK: 0x228B22,
        WATER: 0x4169E1,
        TEAM: 0xFFD700,
        SUPPLY: 0x32CD32,
        FIRE: 0xFF4500,
        FLOOD: 0x1E90FF,
        BLACKOUT: 0x4B0082
    },
    PRIORITY: {
        CRITICAL: { label: '紧急', color: '#FF0000', weight: 10 },
        HIGH: { label: '高', color: '#FF8C00', weight: 7 },
        MEDIUM: { label: '中', color: '#FFD700', weight: 4 },
        LOW: { label: '低', color: '#32CD32', weight: 1 }
    },
    EVENT_TYPES: {
        FLOOD: { name: '内涝', icon: '🌊', baseDamage: 10, repairTime: 30, cost: 100 },
        FIRE: { name: '火灾', icon: '🔥', baseDamage: 15, repairTime: 25, cost: 150 },
        BLACKOUT: { name: '停电', icon: '⚡', baseDamage: 8, repairTime: 20, cost: 80 },
        ACCIDENT: { name: '交通事故', icon: '🚗', baseDamage: 6, repairTime: 15, cost: 120 },
        LANDSLIDE: { name: '山体滑坡', icon: '⛰️', baseDamage: 12, repairTime: 40, cost: 200 }
    }
};
