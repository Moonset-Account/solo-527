using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class FailureAnalyzer
    {
        private GameManager _gameManager;
        private LevelConfig _levelConfig;
        private Dictionary<FailedReason, float> _reasonScores;

        public FailureAnalyzer()
        {
            _reasonScores = new Dictionary<FailedReason, float>();
        }

        public void Initialize(GameManager gameManager, LevelConfig levelConfig)
        {
            _gameManager = gameManager;
            _levelConfig = levelConfig;
            _reasonScores.Clear();
        }

        public FailureReport AnalyzeFailure(FailedReason triggerReason)
        {
            _reasonScores.Clear();

            CalculateAllReasonScores(triggerReason);

            var primary = _reasonScores.OrderByDescending(kvp => kvp.Value).First();

            var report = new FailureReport
            {
                primaryReason = primary.Key,
                primaryReasonName = GetReasonName(primary.Key),
                primaryScore = primary.Value,
                allScores = new Dictionary<FailedReason, float>(_reasonScores),
                suggestions = GenerateSuggestions(primary.Key),
                replayAdvice = GenerateReplayAdvice(primary.Key),
                contributingFactors = GetContributingFactors(),
                performanceSnapshot = CaptureSnapshot()
            };

            return report;
        }

        private void CalculateAllReasonScores(FailedReason trigger)
        {
            var resources = _gameManager.Resources;
            var enemies = _gameManager.Enemies;
            var towers = _gameManager.Towers;
            var waves = _gameManager.Waves;

            _reasonScores[FailedReason.BaseDestroyed] = trigger == FailedReason.BaseDestroyed ? 100f :
                CalculateBaseDestroyedScore(resources);

            _reasonScores[FailedReason.TimeOut] = trigger == FailedReason.TimeOut ? 100f :
                CalculateTimeOutScore(resources, waves);

            _reasonScores[FailedReason.TooManyEnemiesPassed] = trigger == FailedReason.TooManyEnemiesPassed ? 100f :
                CalculateTooManyPassedScore(enemies, _levelConfig.victoryCondition);

            _reasonScores[FailedReason.GoldDepleted] = trigger == FailedReason.GoldDepleted ? 100f :
                CalculateGoldDepletedScore(resources, towers, waves);

            _reasonScores[FailedReason.InsufficientDPS] = trigger == FailedReason.InsufficientDPS ? 90f :
                CalculateInsufficientDPSScore(enemies, towers, waves);
        }

        private float CalculateBaseDestroyedScore(ResourceManager resources)
        {
            if (resources == null) return 0;
            float healthPercent = (float)resources.BaseHealth / resources.MaxBaseHealth;
            float score = (1f - healthPercent) * 60f;

            if (resources.BaseHealth <= resources.MaxBaseHealth * 0.3f)
                score += 30f;

            return Mathf.Clamp(score, 0, 100);
        }

        private float CalculateTimeOutScore(ResourceManager resources, WaveManager waves)
        {
            if (resources == null || waves == null) return 0;
            if (_levelConfig.maxTimeSeconds <= 0) return 0;

            float timePercent = resources.ElapsedTime / _levelConfig.maxTimeSeconds;
            float waveProgress = (float)waves.CurrentWaveNumber / waves.TotalWaves;
            float score = timePercent * 50f + (1f - waveProgress) * 40f;

            return Mathf.Clamp(score, 0, 100);
        }

        private float CalculateTooManyPassedScore(EnemyManager enemies, VictoryCondition condition)
        {
            if (enemies == null || condition == null) return 0;
            if (condition.maxFailedEnemies <= 0) return 0;

            float ratio = (float)enemies.TotalPassed / condition.maxFailedEnemies;
            float score = ratio * 70f;

            if (enemies.TotalPassed >= condition.maxFailedEnemies * 0.8f)
                score += 25f;

            return Mathf.Clamp(score, 0, 100);
        }

        private float CalculateGoldDepletedScore(ResourceManager resources, TowerManager towers, WaveManager waves)
        {
            if (resources == null || towers == null) return 0;

            float score = 0f;

            if (resources.Gold < 50 && towers.TowerCount < 3)
                score += 50f;

            float efficiency = resources.GetGoldEfficiency();
            if (efficiency < 0.5f && waves.CurrentWaveNumber > 2)
                score += 30f;

            if (resources.PeakGold < _levelConfig.startGold * 0.5f && waves.CurrentWaveNumber > 1)
                score += 20f;

            return Mathf.Clamp(score, 0, 100);
        }

        private float CalculateInsufficientDPSScore(EnemyManager enemies, TowerManager towers, WaveManager waves)
        {
            if (enemies == null || towers == null) return 0;

            float score = 0f;

            int totalDPS = towers.GetTotalDPS();
            if (waves.CurrentWaveNumber > 1 && totalDPS < 50)
                score += 40f;
            else if (waves.CurrentWaveNumber > 2 && totalDPS < 100)
                score += 35f;
            else if (waves.CurrentWaveNumber > 3 && totalDPS < 200)
                score += 30f;

            if (enemies.TotalPassed > 0 && waves.CurrentWaveNumber > 1)
            {
                float leakRatio = (float)enemies.TotalPassed / (enemies.TotalKilled + enemies.TotalPassed);
                score += leakRatio * 40f;
            }

            int avgLevel = towers.GetAverageTowerLevel();
            if (avgLevel == 1 && waves.CurrentWaveNumber > 2)
                score += 20f;

            return Mathf.Clamp(score, 0, 100);
        }

        private List<string> GenerateSuggestions(FailedReason reason)
        {
            var suggestions = new List<string>();

            if (_levelConfig.failedReasons != null)
            {
                foreach (var check in _levelConfig.failedReasons.OrderBy(r => r.priority))
                {
                    if (check.reason == reason)
                    {
                        suggestions.Add(check.suggestion);
                        break;
                    }
                }
            }

            switch (reason)
            {
                case FailedReason.BaseDestroyed:
                    suggestions.Add("在敌人密集区域增加减速塔配合输出塔。");
                    suggestions.Add("尝试在路径转弯处建造AOE塔，最大化输出时间。");
                    break;
                case FailedReason.TooManyEnemiesPassed:
                    suggestions.Add("在路径后半段建造减速塔，给后方塔更多攻击时间。");
                    suggestions.Add("确保能攻击飞行单位的塔覆盖整个路径。");
                    break;
                case FailedReason.InsufficientDPS:
                    suggestions.Add("优先升级主力塔到满级，而不是建造更多低级塔。");
                    suggestions.Add("毒伤塔对付高血量敌人效率更高。");
                    suggestions.Add("合理搭配：减速塔+伤害塔+AOE塔组合效果最佳。");
                    break;
                case FailedReason.GoldDepleted:
                    suggestions.Add("出售性价比低的塔（如仅1级且击杀少的塔）。");
                    suggestions.Add("提前计算波次奖励，合理分配升级节奏。");
                    break;
                case FailedReason.TimeOut:
                    suggestions.Add("在波次间隔立即开始下一波，减少等待时间。");
                    suggestions.Add("使用加速模式快速清关。");
                    break;
            }

            return suggestions;
        }

        private List<string> GenerateReplayAdvice(FailedReason reason)
        {
            var advice = new List<string>();
            var towers = _gameManager?.Towers;

            if (towers != null)
            {
                var typeCounts = towers.GetTowerTypeCounts();
                int totalTowers = towers.TowerCount;

                if (!typeCounts.ContainsKey("Slow") || typeCounts["Slow"] < Math.Max(1, totalTowers / 4))
                {
                    advice.Add("建议增加减速塔的数量。");
                }

                if (typeCounts.ContainsKey("SingleTarget") &&
                    typeCounts["SingleTarget"] > totalTowers * 0.7f)
                {
                    advice.Add("单体塔占比过高，考虑建造1-2个AOE塔处理敌群。");
                }

                if (towers.GetAverageTowerLevel() < 2 && totalTowers >= 3)
                {
                    advice.Add("尝试减少塔数量，集中资源升级高价值塔。");
                }
            }

            if (towers != null && towers.UnlockedSlotCount < 4)
            {
                advice.Add("考虑解锁更多塔位来扩展火力覆盖。");
            }

            return advice;
        }

        private List<string> GetContributingFactors()
        {
            var factors = new List<string>();
            var enemies = _gameManager?.Enemies;
            var resources = _gameManager?.Resources;
            var towers = _gameManager?.Towers;
            var waves = _gameManager?.Waves;
            var weather = _gameManager?.Weather;

            if (enemies != null)
                factors.Add($"击杀敌人: {enemies.TotalKilled} | 漏掉敌人: {enemies.TotalPassed}");

            if (resources != null)
                factors.Add($"剩余金币: {resources.Gold} | 金币使用率: {resources.GetGoldEfficiency() * 100:F0}%");

            if (towers != null)
            {
                factors.Add($"塔数量: {towers.TowerCount} | 平均等级: {towers.GetAverageTowerLevel()}");
                factors.Add($"总DPS: {towers.GetTotalDPS()}");
            }

            if (waves != null)
                factors.Add($"达到波次: {waves.CurrentWaveNumber} / {waves.TotalWaves}");

            if (weather != null && weather.CurrentWeather != WeatherType.Sunny)
                factors.Add($"结束时天气: {weather.CurrentWeatherName}");

            if (resources != null)
                factors.Add($"用时: {resources.ElapsedTime:F1}秒");

            return factors;
        }

        private PerformanceSnapshot CaptureSnapshot()
        {
            var perf = PerformanceStats.Instance;
            var snapshot = new PerformanceSnapshot();
            if (perf != null)
            {
                snapshot.averageFPS = perf.AverageFPS;
                snapshot.minFPS = perf.MinFPS;
                snapshot.sessionDuration = perf.SessionDuration;
                snapshot.stutterPercentage = perf.StutterPercentage;
            }
            return snapshot;
        }

        public string GetReasonName(FailedReason reason)
        {
            switch (reason)
            {
                case FailedReason.BaseDestroyed: return "基地被摧毁";
                case FailedReason.TimeOut: return "超时未完成";
                case FailedReason.TooManyEnemiesPassed: return "敌人泄露过多";
                case FailedReason.GoldDepleted: return "资源利用不足";
                case FailedReason.InsufficientDPS: return "火力输出不足";
                default: return reason.ToString();
            }
        }
    }

    [Serializable]
    public class FailureReport
    {
        public FailedReason primaryReason;
        public string primaryReasonName;
        public float primaryScore;
        public Dictionary<FailedReason, float> allScores;
        public List<string> suggestions;
        public List<string> replayAdvice;
        public List<string> contributingFactors;
        public PerformanceSnapshot performanceSnapshot;
    }

    [Serializable]
    public class PerformanceSnapshot
    {
        public float averageFPS;
        public float minFPS;
        public float sessionDuration;
        public float stutterPercentage;
    }
}
