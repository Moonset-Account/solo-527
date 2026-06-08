using System.Collections.Generic;
using UnityEngine;

namespace LakeNavigation
{
    [System.Serializable]
    public struct LevelScoreResult
    {
        public int TotalScore;
        public int StarCount;
        public int PhotoScore;
        public int SpeedBonus;
        public int SupplyBonus;
        public int WeatherMasteryBonus;
        public string Grade;
    }

    public static class ScoreCalculator
    {
        private static readonly float[] QualityMultipliers = { 0.25f, 0.5f, 0.75f, 1.0f };

        public static LevelScoreResult CalculateLevelScore(MissionManager mission, SupplyManager supply, float timeUsed, float timeLimit, GameConfig config)
        {
            int photoScore = CalculatePhotoScore(mission, config);
            int speedBonus = CalculateSpeedBonus(timeUsed, timeLimit, config);
            int supplyBonus = CalculateSupplyBonus(supply, config);
            int weatherMasteryBonus = CalculateWeatherMasteryBonus(mission);
            int totalScore = photoScore + speedBonus + supplyBonus + weatherMasteryBonus;
            int maxPossibleScore = CalculateMaxPossibleScore(mission, supply, config);
            int starCount = CalculateStarCount(totalScore, maxPossibleScore, mission);
            string grade = CalculateGrade(totalScore, maxPossibleScore);

            return new LevelScoreResult
            {
                TotalScore = totalScore,
                StarCount = starCount,
                PhotoScore = photoScore,
                SpeedBonus = speedBonus,
                SupplyBonus = supplyBonus,
                WeatherMasteryBonus = weatherMasteryBonus,
                Grade = grade
            };
        }

        private static int CalculatePhotoScore(MissionManager mission, GameConfig config)
        {
            int score = 0;
            foreach (var kvp in mission.completedPhotos)
            {
                float multiplier = QualityMultipliers[(int)kvp.Value];
                score += Mathf.RoundToInt(config.BasePhotoScore * multiplier);
            }
            return score;
        }

        private static int CalculateSpeedBonus(float timeUsed, float timeLimit, GameConfig config)
        {
            float ratio = timeUsed / timeLimit;
            if (ratio < config.SpeedBonusThreshold)
            {
                return Mathf.RoundToInt(200f * (1f - ratio));
            }
            return 0;
        }

        private static int CalculateSupplyBonus(SupplyManager supply, GameConfig config)
        {
            int bonus = 0;
            List<float> percentages = GetSupplyRemainingPercentages(supply);
            foreach (float percentage in percentages)
            {
                if (percentage > config.SupplyBonusThreshold)
                {
                    bonus += Mathf.RoundToInt(100f * percentage);
                }
            }
            return bonus;
        }

        private static int CalculateWeatherMasteryBonus(MissionManager mission)
        {
            int bonus = 0;
            foreach (var kvp in mission.completedPhotos)
            {
                if (kvp.Key.PreferredWeather == WeatherType.Foggy || kvp.Key.PreferredWeather == WeatherType.Stormy)
                {
                    bonus += 150;
                }
            }
            return bonus;
        }

        private static int CalculateMaxPossibleScore(MissionManager mission, SupplyManager supply, GameConfig config)
        {
            int maxPhotoScore = mission.photoTargets.Count * config.BasePhotoScore;
            int maxSpeedBonus = 200;
            int maxSupplyBonus = GetSupplyRemainingPercentages(supply).Count * 100;
            int maxWeatherMastery = 0;
            foreach (var target in mission.photoTargets)
            {
                if (target.PreferredWeather == WeatherType.Foggy || target.PreferredWeather == WeatherType.Stormy)
                {
                    maxWeatherMastery += 150;
                }
            }
            return maxPhotoScore + maxSpeedBonus + maxSupplyBonus + maxWeatherMastery;
        }

        private static int CalculateStarCount(int totalScore, int maxPossibleScore, MissionManager mission)
        {
            if (!mission.AreAllRequiredMissionsCompleted())
                return 0;

            float percentage = maxPossibleScore > 0 ? (float)totalScore / maxPossibleScore : 0f;

            if (percentage >= 0.85f)
                return 3;
            if (percentage >= 0.60f)
                return 2;
            return 1;
        }

        private static string CalculateGrade(int totalScore, int maxPossibleScore)
        {
            float percentage = maxPossibleScore > 0 ? (float)totalScore / maxPossibleScore : 0f;

            if (percentage >= 0.90f) return "S";
            if (percentage >= 0.75f) return "A";
            if (percentage >= 0.60f) return "B";
            if (percentage >= 0.40f) return "C";
            return "D";
        }

        private static List<float> GetSupplyRemainingPercentages(SupplyManager supply)
        {
            var result = new List<float>();
            if (supply == null) return result;
            foreach (SupplyType type in System.Enum.GetValues(typeof(SupplyType)))
            {
                float max = supply.GetMax(type);
                if (max > 0f)
                {
                    result.Add(supply.GetPercentage(type));
                }
            }
            return result;
        }
    }
}
