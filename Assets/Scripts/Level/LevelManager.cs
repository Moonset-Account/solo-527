using System;
using System.Collections.Generic;
using UnityEngine;

namespace LakeNavigation
{
    public class LevelManager : MonoBehaviour
    {
        public List<LevelData> levels = new List<LevelData>();
        public int CurrentLevelIndex { get; private set; } = -1;

        public LevelData CurrentLevel => (CurrentLevelIndex >= 0 && CurrentLevelIndex < levels.Count)
            ? levels[CurrentLevelIndex]
            : null;

        public event Action<LevelData> OnLevelLoaded;
        public event Action<LevelData, LevelScoreResult> OnLevelCompleted;
        public event Action<LevelData, FailReason> OnLevelFailed;

        public bool IsLevelUnlocked(int levelIndex)
        {
            if (levelIndex < 0 || levelIndex >= levels.Count) return false;

            var level = levels[levelIndex];
            if (level.RequiredStarsToUnlock <= 0) return true;

            return GetTotalStars() >= level.RequiredStarsToUnlock;
        }

        public void LoadLevel(int index)
        {
            if (index < 0 || index >= levels.Count) return;

            CurrentLevelIndex = index;
            var level = levels[index];

            if (WeatherSystem.Instance != null && level.WeatherSchedule.Count > 0)
            {
                WeatherSystem.Instance.InitializeSchedule(level.WeatherSchedule);
            }

            var supplyManager = FindObjectOfType<SupplyManager>();
            if (supplyManager != null && level.StartingSupplies.Count > 0)
            {
                var supplyDict = new Dictionary<SupplyType, SupplyAmount>();
                foreach (var supply in level.StartingSupplies)
                {
                    supplyDict[supply.Type] = supply;
                }
                supplyManager.Initialize(supplyDict);
            }

            var missionManager = FindObjectOfType<MissionManager>();
            if (missionManager != null)
            {
                missionManager.Initialize(level.PhotoTargets, level.Objectives, level.TimeLimit);
            }

            var boat = FindObjectOfType<BoatController>();
            if (boat != null)
            {
                boat.ResetBoat(level.BoatStartPosition, level.BoatStartHealth);
            }

            var collisionDetector = FindObjectOfType<CollisionDetector>();
            if (collisionDetector != null)
            {
                collisionDetector.Initialize(
                    level.BoatStartPosition,
                    level.ObstaclePositions,
                    level.SupplyPickupPositions,
                    level.DockPositions,
                    level.PhotoTargets
                );
            }

            OnLevelLoaded?.Invoke(level);
        }

        public void CompleteCurrentLevel(LevelScoreResult result)
        {
            if (CurrentLevel == null) return;

            string starsKey = $"LevelStars_{CurrentLevelIndex}";
            int previousStars = PlayerPrefs.GetInt(starsKey, 0);
            if (result.StarCount > previousStars)
            {
                int difference = result.StarCount - previousStars;
                PlayerPrefs.SetInt(starsKey, result.StarCount);

                int currentTotal = PlayerPrefs.GetInt(GameConstants.PlayerPrefs.TotalStars, 0);
                PlayerPrefs.SetInt(GameConstants.PlayerPrefs.TotalStars, currentTotal + difference);
            }

            int highest = GetHighestUnlockedLevel();
            if (CurrentLevelIndex + 1 > highest && CurrentLevelIndex + 1 < levels.Count)
            {
                PlayerPrefs.SetInt(GameConstants.PlayerPrefs.HighestLevel, CurrentLevelIndex + 1);
            }

            PlayerPrefs.Save();

            OnLevelCompleted?.Invoke(CurrentLevel, result);
        }

        public void FailCurrentLevel(FailReason reason)
        {
            if (CurrentLevel == null) return;

            OnLevelFailed?.Invoke(CurrentLevel, reason);
        }

        public int GetHighestUnlockedLevel()
        {
            return PlayerPrefs.GetInt(GameConstants.PlayerPrefs.HighestLevel, 0);
        }

        public int GetLevelStars(int levelIndex)
        {
            return PlayerPrefs.GetInt($"LevelStars_{levelIndex}", 0);
        }

        public int GetTotalStars()
        {
            int total = 0;
            for (int i = 0; i < levels.Count; i++)
            {
                total += GetLevelStars(i);
            }
            return total;
        }
    }
}
