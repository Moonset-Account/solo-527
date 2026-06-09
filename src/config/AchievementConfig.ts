import type { AchievementDef } from '@/types';

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_win', name: '初尝胜果', description: '首次通关任意关卡', icon: '🏆', points: 10, condition: 'totalWins', target: 1 },
  { id: 'win_10', name: '百战归来', description: '累计通关10次', icon: '🎖️', points: 50, condition: 'totalWins', target: 10 },
  { id: 'kill_100', name: '百人斩', description: '累计击败100个敌人', icon: '⚔️', points: 20, condition: 'totalKills', target: 100 },
  { id: 'kill_1000', name: '千夫长', description: '累计击败1000个敌人', icon: '🗡️', points: 100, condition: 'totalKills', target: 1000 },
  { id: 'no_loss', name: '完美主义', description: '通关时生命不低于初始的90%', icon: '💎', points: 80, condition: 'perfectClear', target: 1 },
  { id: 'boss_slayer', name: '屠龙者', description: '击败5个BOSS', icon: '🐉', points: 60, condition: 'bossKills', target: 5 },
  { id: 'rich', name: '富甲一方', description: '单局建造10个以上防御塔', icon: '💰', points: 40, condition: 'towersBuilt10', target: 1 },
  { id: 'max_tower', name: '神兵利器', description: '将任意防御塔升级至满级', icon: '⚡', points: 30, condition: 'maxTower', target: 1 },
  { id: 'weather_master', name: '风调雨顺', description: '在所有天气下各通关一次', icon: '🌈', points: 100, condition: 'allWeather', target: 5 },
  { id: 'challenge_7', name: '周常胜', description: '连续7天完成每日挑战', icon: '🔥', points: 200, condition: 'challengeStreak', target: 7 },
  { id: 'level3_clear', name: '登临绝顶', description: '通关云顶茶园（最高难度关卡）', icon: '🏔️', points: 150, condition: 'level3Clear', target: 1 },
];

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
