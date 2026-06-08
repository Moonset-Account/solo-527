using System;
using System.Collections.Generic;

namespace Kitchen.Save
{
    [Serializable]
    public class GameSaveData
    {
        public string saveVersion = "1.0.0";
        public long timestamp;
        public int totalPlayTimeSeconds;
        public int totalCoins;
        public int highScore;
        public List<LevelSaveData> levels = new List<LevelSaveData>();
        public SettingsSaveData settings = new SettingsSaveData();
        public InputSaveData inputBindings = new InputSaveData();
        public PlayerStatsSaveData playerStats = new PlayerStatsSaveData();
    }

    [Serializable]
    public class LevelSaveData
    {
        public string levelId;
        public bool isUnlocked;
        public int bestScore;
        public int starRating;
        public int attempts;
        public int successes;
        public int failures;
        public int consecutiveRetries;
        public bool tutorialSkipped;
        public bool tutorialCompleted;
        public float bestTimeSeconds;
        public List<string> failureSteps = new List<string>();
        public Dictionary<string, int> stepFailureCounts = new Dictionary<string, int>();
    }

    [Serializable]
    public class SettingsSaveData
    {
        public float masterVolume = 1f;
        public float musicVolume = 0.8f;
        public float sfxVolume = 1f;
        public float uiVolume = 1f;
        public int targetFrameRate = 60;
        public bool vsyncEnabled = true;
        public FullScreenMode fullscreenMode = FullScreenMode.FullScreenWindow;
        public int resolutionWidth = 1920;
        public int resolutionHeight = 1080;
        public float uiScale = 1f;
        public bool showPerformanceStats = false;
        public bool screenShakeEnabled = true;
        public bool subtitlesEnabled = true;
        public bool rumbleEnabled = true;
        public bool inputHintsEnabled = true;
        public string language = "zh-CN";
    }

    [Serializable]
    public enum FullScreenMode
    {
        ExclusiveFullScreen,
        FullScreenWindow,
        MaximizedWindow,
        Windowed
    }

    [Serializable]
    public class InputSaveData
    {
        public List<PlayerInputSaveData> playerBindings = new List<PlayerInputSaveData>();
    }

    [Serializable]
    public class PlayerInputSaveData
    {
        public int playerIndex;
        public List<BindingSaveData> bindings = new List<BindingSaveData>();
    }

    [Serializable]
    public class BindingSaveData
    {
        public string action;
        public string primaryKey;
        public string secondaryKey;
        public string gamepadAxis;
        public int gamepadButton = -1;
        public bool isAxis;
        public bool invertAxis;
    }

    [Serializable]
    public class PlayerStatsSaveData
    {
        public int totalOrdersCompleted;
        public int totalOrdersFailed;
        public int totalIngredientsChopped;
        public int totalIngredientsCooked;
        public int totalBurnedItems;
        public int totalPlatesCleaned;
        public int totalTrashedItems;
        public int perfectOrders;
        public float highestComboMultiplier;
        public Dictionary<string, int> recipeCompletionCounts = new Dictionary<string, int>();
        public Dictionary<string, int> failReasonCounts = new Dictionary<string, int>();
        public List<SessionRecord> recentSessions = new List<SessionRecord>();
    }

    [Serializable]
    public class SessionRecord
    {
        public string levelId;
        public long startTime;
        public long endTime;
        public int score;
        public int stars;
        public bool completed;
        public List<string> failureStepsThisSession = new List<string>();
        public int retriesThisSession;
    }
}
