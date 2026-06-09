using UnityEngine;
using System;
using LakeSailing.Core;

namespace LakeSailing.Data
{
    [CreateAssetMenu(fileName = "LevelConfig", menuName = "LakeSailing/Level Configuration", order = 0)]
    public class LevelConfigData : ScriptableObject
    {
        [Header("基础信息")]
        public string levelId;
        public string levelName;
        [TextArea] public string levelDescription;
        public int difficulty = 1;
        public int unlockRequirement = 0;
        public int seed = 42;

        [Header("场景设置")]
        public Vector2 lakeSize = new Vector2(200f, 150f);
        public Vector2 startDockPosition = Vector2.zero;
        public Vector2[] supplyStops;

        [Header("船只设置")]
        public float startFuel = 100f;
        public float startFood = 50f;
        public float startBattery = 100f;
        public float boatMaxSpeed = 5f;

        [Header("时间设置")]
        public float timeLimitSeconds = 600f;
        public float weatherChangeInterval = 60f;

        [Header("任务设置")]
        public PhotoTaskData[] photoTasks;
        public int minStarsScore = 500;
        public int twoStarsScore = 1500;
        public int threeStarsScore = 3000;

        [Header("天气模式")]
        public WeatherForecast[] weatherPatterns;

        [Header("图鉴解锁")]
        public string[] galleryItemIds;
    }

    [Serializable]
    public class PhotoTaskData
    {
        public string taskId;
        public string targetName;
        public string description;
        public Vector2 targetPosition;
        public float detectionRadius = 8f;
        public float optimalDistance = 5f;
        public int basePoints = 100;
        public string requiredGalleryItemId;
        public Sprite targetPreviewSprite;
        public int targetRarity = 1;
    }

    [CreateAssetMenu(fileName = "GalleryItem", menuName = "LakeSailing/Gallery Item", order = 1)]
    public class GalleryItemData : ScriptableObject
    {
        public string itemId;
        public string itemName;
        [TextArea] public string description;
        public int rarity = 1;
        public Sprite previewImage;
        public Sprite galleryImage;
        public Vector2 defaultSpawnPosition;
        public WeatherType[] preferredWeathers;
        public string unlockHint;
    }

    [CreateAssetMenu(fileName = "Achievement", menuName = "LakeSailing/Achievement", order = 2)]
    public class AchievementData : ScriptableObject
    {
        public string achievementId;
        public string title;
        [TextArea] public string description;
        public Sprite icon;
        public int xpReward = 100;
        public int coinReward = 50;
        public AchievementType type;
        public int requirementValue;
    }

    public enum AchievementType
    {
        TotalPhotos,
        TotalDistance,
        LevelStars,
        PerfectWeather,
        NoDamageClear,
        TotalCoins,
        DailyStreak,
        CompleteAllLevels,
        RarityCollection,
        StormSurvivor
    }
}
