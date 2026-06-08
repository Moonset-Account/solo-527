using System;
using System.Collections.Generic;

namespace DecorMatch3
{
    [Serializable]
    public class SaveData
    {
        public PlayerProfileData playerProfile;
        public List<LevelRecordData> levelRecords;
        public AnalyticsData analytics;
        public GameSettingsData settings;
        public string saveVersion;
        public long saveTimestamp;
    }

    [Serializable]
    public class PlayerProfileData
    {
        public int currentLevel;
        public int totalStars;
        public int coins;
        public List<string> unlockedFurniture;
        public List<StringPair> roomDecorations;
        public int tutorialStep;
        public bool tutorialCompleted;
        public bool skippedTutorial;
    }

    [Serializable]
    public class StringPair
    {
        public string key;
        public string value;
    }

    [Serializable]
    public class LevelRecordData
    {
        public int levelId;
        public int bestScore;
        public int bestStars;
        public int attempts;
        public int retryCount;
        public bool completed;
        public bool skipped;
        public string failedStep;
        public int comboRecord;
        public long lastPlayTimestamp;
    }

    [Serializable]
    public class AnalyticsData
    {
        public List<AnalyticsEntryData> entries;
        public float totalPlayTimeSeconds;
        public int totalMatches;
        public int totalCombos;
        public int totalLevelsCompleted;
        public bool tutorialSkipped;
    }

    [Serializable]
    public class AnalyticsEntryData
    {
        public string eventType;
        public long timestamp;
        public List<StringPair> parameters;
    }

    [Serializable]
    public class GameSettingsData
    {
        public float musicVolume;
        public float sfxVolume;
        public bool musicEnabled;
        public bool sfxEnabled;
        public int targetFrameRate;
        public string language;
        public List<StringPair> keyBindings;
    }
}
