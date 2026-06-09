import { GAME_CONFIG } from './config.js';

export const LEVELS = [
    {
        id: 1,
        name: '初来乍到',
        description: '学习基础调度，应对少量事件',
        difficulty: '简单',
        duration: 120,
        weather: '多云',
        initialBudget: 1500,
        initialTeams: 3,
        initialSupplies: 60,
        eventSpawnRate: 0.03,
        maxActiveEvents: 4,
        satisfactionTarget: 60,
        cityLayout: generateCityLayout(20, 1),
        recommended: true
    },
    {
        id: 2,
        name: '暴雨突袭',
        description: '暴雨天气，内涝事件频发',
        difficulty: '普通',
        duration: 150,
        weather: '暴雨',
        initialBudget: 1200,
        initialTeams: 4,
        initialSupplies: 70,
        eventSpawnRate: 0.05,
        maxActiveEvents: 6,
        satisfactionTarget: 65,
        cityLayout: generateCityLayout(20, 2),
        eventBias: { FLOOD: 3, BLACKOUT: 2, ACCIDENT: 1 },
        recommended: false
    },
    {
        id: 3,
        name: '全面危机',
        description: '多重灾难同时降临，考验综合调度能力',
        difficulty: '困难',
        duration: 180,
        weather: '雷暴',
        initialBudget: 1000,
        initialTeams: 5,
        initialSupplies: 80,
        eventSpawnRate: 0.07,
        maxActiveEvents: 8,
        satisfactionTarget: 70,
        cityLayout: generateCityLayout(20, 3),
        eventBias: { FLOOD: 2, FIRE: 2, BLACKOUT: 2, ACCIDENT: 1, LANDSLIDE: 1 },
        recommended: false
    },
    {
        id: 4,
        name: '山火围城',
        description: '极端高温引发多处火灾',
        difficulty: '困难',
        duration: 160,
        weather: '高温',
        initialBudget: 1100,
        initialTeams: 4,
        initialSupplies: 90,
        eventSpawnRate: 0.06,
        maxActiveEvents: 7,
        satisfactionTarget: 65,
        cityLayout: generateCityLayout(20, 4),
        eventBias: { FIRE: 4, BLACKOUT: 1, LANDSLIDE: 1 },
        recommended: false
    },
    {
        id: 5,
        name: '终极考验',
        description: '最长时间，最高难度的终极挑战',
        difficulty: '地狱',
        duration: 240,
        weather: '极端',
        initialBudget: 800,
        initialTeams: 5,
        initialSupplies: 60,
        eventSpawnRate: 0.09,
        maxActiveEvents: 10,
        satisfactionTarget: 75,
        cityLayout: generateCityLayout(20, 5),
        eventBias: { FLOOD: 2, FIRE: 2, BLACKOUT: 2, ACCIDENT: 2, LANDSLIDE: 2 },
        recommended: false
    }
];

function generateCityLayout(size, seed) {
    const layout = [];
    const roads = new Set();
    const buildings = [];
    const parks = [];
    
    const random = seededRandom(seed * 12345);
    
    for (let i = 0; i < size; i++) {
        roads.add(`${Math.floor(size / 2)},${i}`);
        roads.add(`${i},${Math.floor(size / 2)}`);
    }
    
    for (let r = 0; r < 4; r++) {
        const pos = Math.floor(random() * size);
        for (let i = 0; i < size; i++) {
            if (random() > 0.2) roads.add(`${i},${pos}`);
            if (random() > 0.2) roads.add(`${pos},${i}`);
        }
    }
    
    const buildingTypes = ['residential', 'commercial', 'industrial', 'public'];
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            if (!roads.has(`${x},${y}`)) {
                const r = random();
                if (r < 0.65) {
                    const type = buildingTypes[Math.floor(random() * buildingTypes.length)];
                    const capacity = Math.floor(random() * 50) + 20;
                    buildings.push({
                        x, y, type, capacity,
                        name: generateBuildingName(type, buildings.length),
                        height: Math.floor(random() * 3) + 1
                    });
                } else if (r < 0.75) {
                    parks.push({ x, y, size: Math.floor(random() * 3) + 1 });
                }
            }
        }
    }
    
    layout.roads = Array.from(roads).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y, congested: false };
    });
    layout.buildings = buildings;
    layout.parks = parks;
    layout.size = size;
    layout.base = { x: Math.floor(size / 2), y: Math.floor(size / 2) };
    
    return layout;
}

function generateBuildingName(type, index) {
    const names = {
        residential: ['阳光小区', '幸福家园', '和平公寓', '绿洲花园', '春风苑', '秋雨楼', '冬雪阁'],
        commercial: ['繁华商场', '时代广场', '金街中心', '世贸大厦', '财富中心'],
        industrial: ['创新工厂', '精密制造', '能源基地', '物流园区', '科技工业园'],
        public: ['市政厅', '中心医院', '第一学校', '体育馆', '图书馆', '博物馆']
    };
    const list = names[type];
    return list[index % list.length] + (index >= list.length ? `${Math.floor(index / list.length) + 1}号` : '');
}

function seededRandom(seed) {
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}
