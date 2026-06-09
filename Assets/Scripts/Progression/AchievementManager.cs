using System;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Utils;
using DecorMatch3.Core;
using DecorMatch3.Core.Events;

namespace DecorMatch3.Progression
{
    public class AchievementManager : Singleton<AchievementManager>
    {
        [SerializeField] private List<AchievementData> _allAchievements = new List<AchievementData>();
        private readonly Dictionary<string, AchievementProgress> _progressMap = new Dictionary<string, AchievementProgress>();

        public IReadOnlyList<AchievementData> AllAchievements => _allAchievements;

        public event Action<AchievementData, AchievementProgress> OnAchievementProgressChanged;
        public event Action<AchievementData> OnAchievementUnlocked;
        public event Action<AchievementData, AchievementMilestone> OnMilestoneReached;

        protected override void Awake()
        {
            base.Awake();
            LoadAllProgress();
            SubscribeToEvents();
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<LevelCompletedEvent>(HandleLevelCompleted);
            EventBus.Subscribe<MatchDetectedEvent>(HandleMatchDetected);
            EventBus.Subscribe<OrderCompletedEvent>(HandleOrderCompleted);
            EventBus.Subscribe<MaterialsCollectedEvent>(HandleMaterialsCollected);
            EventBus.Subscribe<DailyChallengeCompletedEvent>(HandleDailyChallengeCompleted);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<LevelCompletedEvent>(HandleLevelCompleted);
            EventBus.Unsubscribe<MatchDetectedEvent>(HandleMatchDetected);
            EventBus.Unsubscribe<OrderCompletedEvent>(HandleOrderCompleted);
            EventBus.Unsubscribe<MaterialsCollectedEvent>(HandleMaterialsCollected);
            EventBus.Unsubscribe<DailyChallengeCompletedEvent>(HandleDailyChallengeCompleted);
        }

        private void LoadAllProgress()
        {
            foreach (AchievementData achievement in _allAchievements)
            {
                LoadProgress(achievement);
            }
        }

        private AchievementProgress LoadProgress(AchievementData achievement)
        {
            AchievementProgress progress = new AchievementProgress
            {
                AchievementId = achievement.AchievementId,
                IsUnlocked = SaveSystem.Instance != null && SaveSystem.Instance.IsAchievementUnlocked(achievement.AchievementId),
                CurrentValue = SaveSystem.Instance != null ? SaveSystem.Instance.GetAchievementProgress(achievement.AchievementId) : 0
            };

            _progressMap[achievement.AchievementId] = progress;
            return progress;
        }

        public AchievementProgress GetProgress(string achievementId)
        {
            if (_progressMap.TryGetValue(achievementId, out AchievementProgress progress))
                return progress;

            AchievementData data = _allAchievements.Find(a => a.AchievementId == achievementId);
            if (data != null)
            {
                return LoadProgress(data);
            }

            return null;
        }

        public void RegisterAchievement(AchievementData achievement)
        {
            if (!_allAchievements.Contains(achievement))
            {
                _allAchievements.Add(achievement);
                LoadProgress(achievement);
            }
        }

        private void UpdateProgress(AchievementConditionType type, long value)
        {
            foreach (AchievementData achievement in _allAchievements)
            {
                if (achievement.ConditionType != type) continue;

                AchievementProgress progress = GetOrCreateProgress(achievement);
                if (progress.IsUnlocked) continue;

                progress.CurrentValue = Math.Max(progress.CurrentValue, value);

                CheckMilestones(achievement, progress);

                if (progress.CurrentValue >= achievement.TargetValue && !progress.IsUnlocked)
                {
                    UnlockAchievement(achievement, progress);
                }

                SaveProgress(achievement, progress);
                OnAchievementProgressChanged?.Invoke(achievement, progress);
            }
        }

        private void IncrementProgress(AchievementConditionType type, long increment)
        {
            foreach (AchievementData achievement in _allAchievements)
            {
                if (achievement.ConditionType != type) continue;

                AchievementProgress progress = GetOrCreateProgress(achievement);
                if (progress.IsUnlocked) continue;

                progress.CurrentValue += increment;

                CheckMilestones(achievement, progress);

                if (progress.CurrentValue >= achievement.TargetValue && !progress.IsUnlocked)
                {
                    UnlockAchievement(achievement, progress);
                }

                SaveProgress(achievement, progress);
                OnAchievementProgressChanged?.Invoke(achievement, progress);
            }
        }

        private AchievementProgress GetOrCreateProgress(AchievementData achievement)
        {
            if (!_progressMap.TryGetValue(achievement.AchievementId, out AchievementProgress progress))
            {
                progress = LoadProgress(achievement);
            }
            return progress;
        }

        private void CheckMilestones(AchievementData achievement, AchievementProgress progress)
        {
            if (achievement.Milestones == null || achievement.Milestones.Count == 0) return;

            foreach (AchievementMilestone milestone in achievement.Milestones)
            {
                if (!progress.CompletedMilestones.Contains(milestone.Value) &&
                    progress.CurrentValue >= milestone.Value)
                {
                    progress.CompletedMilestones.Add(milestone.Value);

                    if (SaveSystem.Instance != null)
                    {
                        if (milestone.CoinBonus > 0) SaveSystem.Instance.AddCoins(milestone.CoinBonus);
                        if (milestone.GemBonus > 0) SaveSystem.Instance.AddGems(milestone.GemBonus);
                    }

                    OnMilestoneReached?.Invoke(achievement, milestone);
                    Debug.Log($"[AchievementManager] Milestone reached: {achievement.AchievementId} @ {milestone.Value}");
                }
            }
        }

        private void UnlockAchievement(AchievementData achievement, AchievementProgress progress)
        {
            progress.IsUnlocked = true;
            progress.UnlockTime = DateTime.UtcNow;

            if (SaveSystem.Instance != null)
            {
                SaveSystem.Instance.UnlockAchievement(achievement.AchievementId);
                if (achievement.CoinReward > 0) SaveSystem.Instance.AddCoins(achievement.CoinReward);
                if (achievement.GemReward > 0) SaveSystem.Instance.AddGems(achievement.GemReward);
            }

            OnAchievementUnlocked?.Invoke(achievement);
            AnalyticsSystem.Instance?.RecordAchievementUnlocked(achievement.AchievementId, achievement.Name);

            Debug.Log($"[AchievementManager] Achievement unlocked: {achievement.AchievementId} - {achievement.Name}");
        }

        private void SaveProgress(AchievementData achievement, AchievementProgress progress)
        {
            if (SaveSystem.Instance != null)
            {
                SaveSystem.Instance.SetAchievementProgress(achievement.AchievementId, (int)progress.CurrentValue);
            }
        }

        public List<AchievementData> GetUnlockedAchievements()
        {
            List<AchievementData> result = new List<AchievementData>();
            foreach (AchievementData a in _allAchievements)
            {
                AchievementProgress p = GetProgress(a.AchievementId);
                if (p != null && p.IsUnlocked) result.Add(a);
            }
            return result;
        }

        public List<AchievementData> GetAchievementsByCategory(AchievementCategory category)
        {
            return _allAchievements.FindAll(a => a.Category == category);
        }

        public float GetOverallProgress()
        {
            if (_allAchievements.Count == 0) return 0f;
            int unlocked = 0;
            foreach (AchievementData a in _allAchievements)
            {
                AchievementProgress p = GetProgress(a.AchievementId);
                if (p != null && p.IsUnlocked) unlocked++;
            }
            return (float)unlocked / _allAchievements.Count;
        }

        private void HandleLevelCompleted(LevelCompletedEvent e)
        {
            IncrementProgress(AchievementConditionType.LevelsCompleted, 1);
            UpdateProgress(AchievementConditionType.HighScore, e.Score);

            if (e.Stars >= 3)
            {
                IncrementProgress(AchievementConditionType.PerfectLevels, 1);
            }
        }

        private void HandleMatchDetected(MatchDetectedEvent e)
        {
            IncrementProgress(AchievementConditionType.TotalMatches, e.MatchCount);

            if (e.ComboLevel >= 4)
            {
                UpdateProgress(AchievementConditionType.ComboReached, e.ComboLevel);
            }
        }

        private void HandleOrderCompleted(OrderCompletedEvent e)
        {
            IncrementProgress(AchievementConditionType.OrdersCompleted, 1);

            if (e.CustomerSatisfaction >= 90)
            {
                IncrementProgress(AchievementConditionType.FiveStarOrders, 1);
            }
        }

        private void HandleMaterialsCollected(MaterialsCollectedEvent e)
        {
            long total = 0;
            foreach (var kvp in e.Materials) total += kvp.Value;
            IncrementProgress(AchievementConditionType.MaterialsCollected, total);
        }

        private void HandleDailyChallengeCompleted(DailyChallengeCompletedEvent e)
        {
            if (e.IsSuccess)
            {
                IncrementProgress(AchievementConditionType.DailyChallengesCompleted, 1);
            }
        }
    }
}
