using System;
using System.Collections.Generic;

namespace DecorMatch3.Core.Events
{
    public struct GameStateChangedEvent
    {
        public GameState PreviousState;
        public GameState NewState;
    }

    public struct SceneLoadStartedEvent
    {
        public string SceneName;
        public float Progress;
    }

    public struct SceneLoadCompletedEvent
    {
        public string SceneName;
    }

    public struct LevelStartedEvent
    {
        public int LevelId;
        public DateTime StartTime;
    }

    public struct LevelCompletedEvent
    {
        public int LevelId;
        public int Score;
        public int Stars;
        public float DurationSeconds;
        public int MovesUsed;
        public Dictionary<int, int> MaterialsCollected;
        public bool IsSuccess;
    }

    public struct LevelFailedEvent
    {
        public int LevelId;
        public int FailCount;
        public float DurationSeconds;
        public string FailReason;
    }

    public struct MatchDetectedEvent
    {
        public int MatchCount;
        public int TileType;
        public int ComboLevel;
    }

    public struct TileSwappedEvent
    {
        public int FromX;
        public int FromY;
        public int ToX;
        public int ToY;
        public bool IsValid;
    }

    public struct MaterialsCollectedEvent
    {
        public Dictionary<int, int> Materials;
    }

    public struct OrderAcceptedEvent
    {
        public int OrderId;
        public string CustomerId;
    }

    public struct DecorationChoiceMadeEvent
    {
        public int OrderId;
        public string ChoiceCategory;
        public int ChoiceId;
        public string ChoiceValue;
        public DateTime Timestamp;
    }

    public struct OrderCompletedEvent
    {
        public int OrderId;
        public string CustomerId;
        public int FinalScore;
        public int CustomerSatisfaction;
        public Dictionary<string, int> CategoryScores;
        public DateTime CompletedTime;
    }

    public struct AchievementUnlockedEvent
    {
        public string AchievementId;
        public string AchievementName;
        public DateTime UnlockTime;
    }

    public struct DailyChallengeStartedEvent
    {
        public string ChallengeId;
        public DateTime Date;
    }

    public struct DailyChallengeCompletedEvent
    {
        public string ChallengeId;
        public int Score;
        public bool IsSuccess;
    }

    public struct SaveDataLoadedEvent
    {
        public string SaveSlot;
        public DateTime LoadTime;
    }

    public struct SaveDataSavedEvent
    {
        public string SaveSlot;
        public DateTime SaveTime;
        public bool IsAutoSave;
    }

    public struct AnalyticsEventLogged
    {
        public string EventName;
        public Dictionary<string, object> Parameters;
        public DateTime Timestamp;
    }

    public struct SettingsChangedEvent
    {
        public string SettingKey;
        public object OldValue;
        public object NewValue;
    }
}
