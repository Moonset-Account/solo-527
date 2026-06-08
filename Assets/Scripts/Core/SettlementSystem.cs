using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class SettlementSystem
    {
        private GameManager _gameManager;
        private LevelConfig _levelConfig;
        private FailureAnalyzer _failureAnalyzer;

        public event Action<SettlementData> OnVictory;
        public event Action<SettlementData, FailureReport> OnDefeat;
        public event Action<int> OnStarsCalculated;

        public SettlementSystem()
        {
            _failureAnalyzer = new FailureAnalyzer();
        }

        public void Initialize(GameManager gameManager, LevelConfig levelConfig)
        {
            _gameManager = gameManager;
            _levelConfig = levelConfig;
            _failureAnalyzer.Initialize(gameManager, levelConfig);
        }

        public void HandleVictory()
        {
            var data = CalculateSettlementData(true);
            int stars = CalculateStars(data);
            data.starsEarned = stars;

            SaveCompletionData(data);
            RecordPlayLog(true);

            OnStarsCalculated?.Invoke(stars);
            OnVictory?.Invoke(data);
        }

        public void HandleDefeat(FailedReason triggerReason)
        {
            var data = CalculateSettlementData(false);
            var failureReport = _failureAnalyzer.AnalyzeFailure(triggerReason);
            data.failureReport = failureReport;

            RecordPlayLog(false);
            SaveSystem.Instance.RecordLevelFailure(_levelConfig.levelId);

            OnDefeat?.Invoke(data, failureReport);
        }

        private SettlementData CalculateSettlementData(bool victory)
        {
            var data = new SettlementData
            {
                levelId = _levelConfig.levelId,
                levelName = _levelConfig.levelName,
                difficulty = _levelConfig.difficulty,
                victory = victory,
                timestamp = DateTime.Now.ToString("o")
            };

            var resources = _gameManager.Resources;
            var enemies = _gameManager.Enemies;
            var towers = _gameManager.Towers;
            var waves = _gameManager.Waves;
            var weather = _gameManager.Weather;

            if (resources != null)
            {
                data.totalPlayTime = resources.ElapsedTime;
                data.remainingGold = resources.Gold;
                data.remainingBaseHealth = resources.BaseHealth;
                data.maxBaseHealth = resources.MaxBaseHealth;
                data.totalGoldEarned = resources.GetTotalGoldEarned();
                data.totalGoldSpent = resources.GetTotalGoldSpent();
            }

            if (enemies != null)
            {
                data.enemiesKilled = enemies.TotalKilled;
                data.enemiesPassed = enemies.TotalPassed;
                data.totalDamageToBase = enemies.TotalDamageToBase;
            }

            if (towers != null)
            {
                data.towersBuilt = towers.TowerCount;
                data.averageTowerLevel = towers.GetAverageTowerLevel();
                data.totalDPS = towers.GetTotalDPS();
                data.towerTypeCounts = towers.GetTowerTypeCounts();
                data.unlockedSlots = towers.UnlockedSlotCount;

                foreach (var tower in towers.GetAllTowers())
                {
                    data.towerChoices.Add(tower.Config.id);
                }
            }

            if (waves != null)
            {
                data.wavesCompleted = waves.CurrentWaveNumber - (waves.IsWaveActive ? 1 : 0);
                data.totalWaves = waves.TotalWaves;
            }

            data.score = CalculateScore(data);
            data.perfectScore = CalculatePerfectScore();

            return data;
        }

        private int CalculateScore(SettlementData data)
        {
            int score = 0;

            if (data.victory)
            {
                score += 1000;

                float healthPercent = (float)data.remainingBaseHealth / data.maxBaseHealth;
                score += Mathf.FloorToInt(healthPercent * 500);

                if (data.totalPlayTime < 120f)
                    score += Mathf.FloorToInt((120f - data.totalPlayTime) * 5);

                score += data.enemiesKilled * 10;
                score -= data.enemiesPassed * 50;

                if (data.averageTowerLevel >= 3 && data.towersBuilt <= 5)
                    score += 300;
            }
            else
            {
                score += data.wavesCompleted * 200;
                score += data.enemiesKilled * 5;
            }

            return Mathf.Max(0, score);
        }

        private int CalculatePerfectScore()
        {
            int baseScore = 1000;
            int healthBonus = 500;
            int timeBonus = 600;
            int waveBonus = _levelConfig.waves.Count * 50;
            int perfectBonus = 500;
            return baseScore + healthBonus + timeBonus + waveBonus + perfectBonus;
        }

        private int CalculateStars(SettlementData data)
        {
            if (!data.victory) return 0;

            int stars = 1;

            float healthPercent = (float)data.remainingBaseHealth / data.maxBaseHealth;
            if (healthPercent >= 0.6f) stars = 2;
            if (healthPercent >= 0.9f && data.enemiesPassed <= 2) stars = 3;

            var condition = _levelConfig.victoryCondition;
            if (condition != null && condition.maxFailedEnemies > 0)
            {
                if (data.enemiesPassed == 0)
                {
                    stars = Math.Max(stars, data.remainingBaseHealth >= data.maxBaseHealth ? 3 : 2);
                }
            }

            return stars;
        }

        private void SaveCompletionData(SettlementData data)
        {
            var completionData = new LevelCompletionData
            {
                levelId = data.levelId,
                bestTimeSeconds = data.totalPlayTime,
                fewestFailures = 0,
                highestScore = data.score,
                playCount = 1,
                completedTime = data.timestamp,
                towerChoices = data.towerChoices,
                starsEarned = data.starsEarned
            };

            SaveSystem.Instance.RecordLevelCompletion(data.levelId, completionData);

            var index = int.TryParse(data.levelId.Split('_')[1], out int id) ? id : 1;
            string nextLevelId = $"level_{index + 1}";
            var config = ConfigManager.Instance.GetLevelConfig(nextLevelId);
            if (config != null)
            {
                SaveSystem.Instance.UnlockLevel(nextLevelId);
            }
        }

        private void RecordPlayLog(bool victory)
        {
            var entry = new ChoiceLogEntry
            {
                levelId = _levelConfig.levelId,
                gameTime = _gameManager?.Resources?.ElapsedTime ?? 0,
                choiceType = victory ? "victory" : "defeat",
                choiceDetail = $"waves:{_gameManager?.Waves?.CurrentWaveNumber ?? 0},towers:{_gameManager?.Towers?.TowerCount ?? 0}",
                goldBefore = _gameManager?.Resources?.Gold ?? 0,
                goldAfter = _gameManager?.Resources?.Gold ?? 0,
                waveNumber = _gameManager?.Waves?.CurrentWaveNumber ?? 0
            };
            SaveSystem.Instance.RecordChoiceLog(entry);
        }

        public SettlementData QuickRetryStats()
        {
            return new SettlementData
            {
                levelId = _levelConfig.levelId,
                levelName = _levelConfig.levelName,
                difficulty = _levelConfig.difficulty,
                victory = false,
                timestamp = DateTime.Now.ToString("o"),
                towersBuilt = _gameManager?.Towers?.TowerCount ?? 0,
                wavesCompleted = Math.Max(0, (_gameManager?.Waves?.CurrentWaveNumber ?? 0) - 1),
                totalWaves = _gameManager?.Waves?.TotalWaves ?? 0,
                enemiesKilled = _gameManager?.Enemies?.TotalKilled ?? 0,
                enemiesPassed = _gameManager?.Enemies?.TotalPassed ?? 0
            };
        }
    }

    [Serializable]
    public class SettlementData
    {
        public string levelId;
        public string levelName;
        public int difficulty;
        public bool victory;
        public string timestamp;
        public int starsEarned;

        public float totalPlayTime;
        public int remainingGold;
        public int remainingBaseHealth;
        public int maxBaseHealth;
        public int totalGoldEarned;
        public int totalGoldSpent;

        public int enemiesKilled;
        public int enemiesPassed;
        public int totalDamageToBase;

        public int towersBuilt;
        public int averageTowerLevel;
        public int totalDPS;
        public Dictionary<string, int> towerTypeCounts;
        public int unlockedSlots;
        public List<string> towerChoices = new List<string>();

        public int wavesCompleted;
        public int totalWaves;

        public int score;
        public int perfectScore;

        public FailureReport failureReport;

        public string GetSummaryString()
        {
            string result = victory ? "胜利！" : "失败";
            string summary = $"=== {result} ===\n关卡: {levelName}\n用时: {totalPlayTime:F1}秒\n";

            if (victory)
            {
                summary += $"⭐ 星级: {starsEarned}/3\n得分: {score}/{perfectScore}\n";
            }

            summary += $"\n战斗数据:\n击杀敌人: {enemiesKilled}\n漏掉敌人: {enemiesPassed}\n";
            summary += $"基地剩余: {remainingBaseHealth}/{maxBaseHealth}\n完成波次: {wavesCompleted}/{totalWaves}\n";
            summary += $"建造塔数: {towersBuilt} (平均等级: {averageTowerLevel})\n总DPS: {totalDPS}\n";

            if (failureReport != null)
            {
                summary += $"\n失败原因: {failureReport.primaryReasonName}\n";
            }

            return summary;
        }
    }
}
