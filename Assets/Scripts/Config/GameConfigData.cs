using System;
using System.Collections.Generic;

namespace TeaGardenDefense.Config
{
    [Serializable]
    public class TowerConfig
    {
        public string id;
        public string towerName;
        public string description;
        public TowerType type;
        public int baseCost;
        public List<TowerLevel> levels;
    }

    [Serializable]
    public enum TowerType
    {
        SingleTarget,
        AreaOfEffect,
        Slow,
        Splash,
        Poison
    }

    [Serializable]
    public class TowerLevel
    {
        public int level;
        public int damage;
        public float range;
        public float fireRate;
        public int upgradeCost;
        public float specialEffectValue;
        public string upgradeDescription;
    }

    [Serializable]
    public class EnemyConfig
    {
        public string id;
        public string enemyName;
        public string description;
        public EnemyType type;
        public int baseHealth;
        public float moveSpeed;
        public int reward;
        public int damageToBase;
        public float fireResistance;
        public float iceResistance;
        public float poisonResistance;
    }

    [Serializable]
    public enum EnemyType
    {
        Normal,
        Fast,
        Tank,
        Flying,
        Boss
    }

    [Serializable]
    public class WaveConfig
    {
        public int waveNumber;
        public List<WaveSpawn> spawns;
        public int reward;
        public float preDelay;
    }

    [Serializable]
    public class WaveSpawn
    {
        public string enemyId;
        public int count;
        public float interval;
        public float startDelay;
    }

    [Serializable]
    public class LevelConfig
    {
        public string levelId;
        public string levelName;
        public int difficulty;
        public string description;
        public string tutorialMessage;
        public List<WeatherPattern> weatherPatterns;
        public int startGold;
        public int baseHealth;
        public float maxTimeSeconds;
        public List<PathPoint> pathPoints;
        public List<TowerSlot> towerSlots;
        public List<WaveConfig> waves;
        public List<string> availableTowerIds;
        public VictoryCondition victoryCondition;
        public List<FailedReasonCheck> failedReasons;
    }

    [Serializable]
    public class PathPoint
    {
        public float x;
        public float y;
        public float z;
    }

    [Serializable]
    public class TowerSlot
    {
        public string slotId;
        public float x;
        public float y;
        public float z;
        public bool isUnlocked;
        public int unlockCost;
    }

    [Serializable]
    public class WeatherPattern
    {
        public WeatherType type;
        public float startAtWave;
        public float durationWaves;
        public float intensity;
    }

    [Serializable]
    public enum WeatherType
    {
        Sunny,
        Rain,
        Fog,
        Snow,
        Wind
    }

    [Serializable]
    public class VictoryCondition
    {
        public int minSurvivingBaseHealth;
        public int maxFailedEnemies;
        public float maxTimeSeconds;
    }

    [Serializable]
    public class FailedReasonCheck
    {
        public FailedReason reason;
        public string suggestion;
        public int priority;
    }

    [Serializable]
    public enum FailedReason
    {
        BaseDestroyed,
        TimeOut,
        TooManyEnemiesPassed,
        GoldDepleted,
        InsufficientDPS
    }

    [Serializable]
    public class GameConfig
    {
        public string version;
        public List<TowerConfig> towers;
        public List<EnemyConfig> enemies;
        public List<LevelConfig> levels;
        public GlobalSettings settings;
    }

    [Serializable]
    public class GlobalSettings
    {
        public float timeScaleNormal = 1f;
        public float timeScaleFast = 2f;
        public int targetFrameRate = 60;
        public int minFrameRate = 30;
        public float autoSaveIntervalSeconds = 60f;
        public float performanceSampleInterval = 1f;
    }
}
