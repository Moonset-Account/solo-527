import * as THREE from 'three';
import { BaseScene } from './src/core/SceneManager.js';
import { EventBus } from './src/core/EventBus.js';
import { GAME_CONFIG } from './src/data/config.js';
import { LEVELS } from './src/data/levels.js';

global.THREE = THREE;

const fakeGame = {
    eventBus: new EventBus(),
    eventConfig: GAME_CONFIG.EVENT_TYPES,
    audio: {
        startAmbient() {},
        stopAmbient() {},
        playSfx() {}
    },
    ui: {
        showGameHUD() {},
        renderHUD() {}
    },
    save: {
        completeLevel() { return true; },
        updateStats() { return true; },
        getStats() { return {}; },
        getAchievements() { return []; },
        checkAchievements() { return []; },
        unlockAchievement() {}
    },
    ACHIEVEMENTS: [],
    eventTypes: GAME_CONFIG.EVENT_TYPES
};

async function importGameScene() {
    const mod = await import('./src/game/GameScene.js');
    return mod.GameScene;
}

(async () => {
    const GameScene = await importGameScene();
    const scene = new GameScene(fakeGame);
    scene.manager = { switching: false };

    const lv1 = LEVELS[0];
    const lv2 = LEVELS[1] || LEVELS[0];

    console.log('=== Test 1: 初次进入关卡 (onEnter with levelConfig) ===');
    await scene.onEnter({ levelConfig: lv1 });
    console.log('  ended =', scene.ended, '(期望 false)');
    console.log('  resultShown =', scene.resultShown, '(期望 false)');
    console.log('  scoreSubmitted =', scene.scoreSubmitted, '(期望 false)');
    console.log('  sessionId =', scene.sessionId);
    console.log('  remainingTime =', scene.remainingTime, '(期望 > 0)');
    console.log('  cityMap exists:', !!scene.cityMap, '(期望 true)');
    console.log('  PASS:', !scene.ended && !scene.resultShown && !scene.scoreSubmitted && scene.remainingTime > 0 && !!scene.cityMap);

    console.log('');
    console.log('=== Test 2: 模拟关卡结束（设置锁状态） ===');
    scene.ended = true;
    scene.resultShown = true;
    scene.scoreSubmitted = true;
    scene.finalSummary = { passed: true };
    scene.remainingTime = 0;
    console.log('  模拟结束后:');
    console.log('    ended =', scene.ended);
    console.log('    resultShown =', scene.resultShown);
    console.log('    scoreSubmitted =', scene.scoreSubmitted);

    console.log('');
    console.log('=== Test 3: 模拟"再玩一次"重新 onEnter(同关卡) ===');
    const firstSessionId = scene.sessionId;
    await scene.onEnter({ levelConfig: lv1 });
    console.log('  ended =', scene.ended, '(期望 false)');
    console.log('  resultShown =', scene.resultShown, '(期望 false)');
    console.log('  scoreSubmitted =', scene.scoreSubmitted, '(期望 false)');
    console.log('  sessionId changed =', scene.sessionId !== firstSessionId, '(期望 true - 新的 session 随机)');
    console.log('  remainingTime =', scene.remainingTime, '(期望 > 0)');
    console.log('  cityMap exists:', !!scene.cityMap);
    console.log('  threeScene children count:', scene.threeScene.children.length, '(期望 > 0)');
    const t3 = !scene.ended && !scene.resultShown && !scene.scoreSubmitted && scene.remainingTime > 0 && scene.sessionId !== firstSessionId;
    console.log('  PASS:', t3);

    console.log('');
    console.log('=== Test 4: 再次模拟结束 + 切换下一关(不同关卡) ===');
    scene.ended = true;
    scene.resultShown = true;
    scene.scoreSubmitted = true;
    const sess2 = scene.sessionId;
    await scene.onEnter({ levelConfig: lv2 });
    console.log('  levelConfig.id =', scene.levelConfig.id);
    console.log('  锁状态清除:', !scene.ended && !scene.resultShown && !scene.scoreSubmitted);
    console.log('  sessionId 再次变化:', scene.sessionId !== sess2);
    console.log('  PASS:', !scene.ended && !scene.resultShown && !scene.scoreSubmitted && scene.sessionId !== sess2);

    console.log('');
    console.log('=== Test 5: update 正常运行（ended 为 false 时不短路） ===');
    let passed = true;
    try {
        scene.update(0.016);
        console.log('  update() 执行无异常: true');
    } catch (e) {
        console.log('  update() 异常:', e.message);
        passed = false;
    }
    console.log('  PASS:', passed);

    console.log('');
    console.log('===== ALL TESTS COMPLETED =====');
    process.exit(0);
})().catch(e => {
    console.error('ERROR:', e);
    process.exit(1);
});
