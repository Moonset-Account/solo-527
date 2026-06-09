using UnityEngine;
using System;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Data;

namespace LakeSailing.Meta
{
    public class AchievementSystem : PersistentSingleton<AchievementSystem>
    {
        [SerializeField] private List<AchievementData> allAchievements = new List<AchievementData>();
        [SerializeField] private List<string> unlockedIds = new List<string>();
        [SerializeField] private bool isLoaded;

        public event Action<AchievementData> OnAchievementUnlocked;
        public event Action OnAchievementsLoaded;

        public List<AchievementData> AllAchievements => allAchievements;
        public List<string> UnlockedIds => unlockedIds;
        public bool IsLoaded => isLoaded;

        public void Initialize(IEnumerable<AchievementData> achievements)
        {
            allAchievements = new List<AchievementData>(achievements);
            if (SaveSystem.Instance.CurrentSave != null)
            {
                unlockedIds = new List<string>(SaveSystem.Instance.CurrentSave.unlockedAchievementIds);
            }
            isLoaded = true;
            OnAchievementsLoaded?.Invoke();
        }

        public AchievementData GetAchievement(string id)
        {
            return allAchievements.Find(a => a.achievementId == id);
        }

        public bool IsUnlocked(string achievementId)
        {
            return unlockedIds.Contains(achievementId);
        }

        public List<AchievementData> GetUnlocked()
        {
            var result = new List<AchievementData>();
            foreach (var id in unlockedIds)
            {
                var a = GetAchievement(id);
                if (a != null) result.Add(a);
            }
            return result;
        }

        public List<AchievementData> GetLocked()
        {
            var result = new List<AchievementData>();
            foreach (var a in allAchievements)
            {
                if (!unlockedIds.Contains(a.achievementId))
                {
                    result.Add(a);
                }
            }
            return result;
        }

        public float GetProgress()
        {
            if (allAchievements.Count == 0) return 0f;
            return (float)unlockedIds.Count / allAchievements.Count;
        }

        public async void Unlock(string achievementId)
        {
            if (IsUnlocked(achievementId)) return;
            var achievement = GetAchievement(achievementId);
            if (achievement == null) return;

            unlockedIds.Add(achievementId);
            await SaveSystem.Instance.UnlockAchievement(achievementId);
            await SaveSystem.Instance.AddXP(achievement.xpReward);
            await SaveSystem.Instance.AddCoins(achievement.coinReward);

            OnAchievementUnlocked?.Invoke(achievement);
        }

        public void CheckAndUnlockAchievements()
        {
            var save = SaveSystem.Instance.CurrentSave;
            if (save == null) return;

            int totalPhotos = save.stats.totalPhotosTaken;
            int totalDistance = save.stats.totalDistanceTraveled;
            int completedLevels = save.completedLevelIds.Count;
            int dailyStreak = save.currentDailyChallengeStreak;

            foreach (var achievement in allAchievements)
            {
                if (IsUnlocked(achievement.achievementId)) continue;

                switch (achievement.type)
                {
                    case AchievementType.TotalPhotos:
                        if (totalPhotos >= achievement.requirementValue)
                            Unlock(achievement.achievementId);
                        break;
                    case AchievementType.TotalDistance:
                        if (totalDistance >= achievement.requirementValue)
                            Unlock(achievement.achievementId);
                        break;
                    case AchievementType.DailyStreak:
                        if (dailyStreak >= achievement.requirementValue)
                            Unlock(achievement.achievementId);
                        break;
                    case AchievementType.CompleteAllLevels:
                        if (completedLevels >= achievement.requirementValue)
                            Unlock(achievement.achievementId);
                        break;
                }
            }
        }
    }
}
