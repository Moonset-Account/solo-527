using UnityEngine;
using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace LakeSailing.Core
{
    public class SaveSystem : PersistentSingleton<SaveSystem>
    {
        private const string SaveFileName = "gamesave.json";
        private const string SettingsFileName = "settings.json";
        private string saveDirectory;

        private GameSaveData cachedSaveData;
        private SettingsData cachedSettingsData;
        private bool isLoaded;

        public event Action<GameSaveData> OnSaveLoaded;
        public event Action<GameSaveData> OnSaveCompleted;
        public event Action<SettingsData> OnSettingsLoaded;
        public event Action<SettingsData> OnSettingsSaved;

        public bool IsLoaded => isLoaded;
        public GameSaveData CurrentSave => cachedSaveData;
        public SettingsData CurrentSettings => cachedSettingsData;

        protected override void Awake()
        {
            base.Awake();
            saveDirectory = Path.Combine(Application.persistentDataPath, "Saves");
            if (!Directory.Exists(saveDirectory))
            {
                Directory.CreateDirectory(saveDirectory);
            }
        }

        public async Task LoadAllData()
        {
            await LoadSettings();
            await LoadSave();
            isLoaded = true;
        }

        public async Task LoadSave()
        {
            var path = Path.Combine(saveDirectory, SaveFileName);
            GameSaveData data = null;

            if (File.Exists(path))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(path);
                    data = JsonUtility.FromJson<GameSaveData>(json);
                }
                catch (Exception e)
                {
                    Debug.LogError($"[SaveSystem] Failed to load save: {e.Message}");
                    data = CreateDefaultSave();
                }
            }
            else
            {
                data = CreateDefaultSave();
                await SaveGame(data);
            }

            cachedSaveData = data;
            OnSaveLoaded?.Invoke(cachedSaveData);
        }

        public async Task SaveGame()
        {
            if (cachedSaveData == null)
            {
                cachedSaveData = CreateDefaultSave();
            }
            await SaveGame(cachedSaveData);
        }

        public async Task SaveGame(GameSaveData data)
        {
            data.lastSaveTime = DateTime.Now.ToString("O");
            var path = Path.Combine(saveDirectory, SaveFileName);
            try
            {
                var json = JsonUtility.ToJson(data, true);
                await File.WriteAllTextAsync(path, json);
                cachedSaveData = data;
                OnSaveCompleted?.Invoke(cachedSaveData);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Failed to save: {e.Message}");
            }
        }

        public async Task LoadSettings()
        {
            var path = Path.Combine(saveDirectory, SettingsFileName);
            SettingsData data = null;

            if (File.Exists(path))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(path);
                    data = JsonUtility.FromJson<SettingsData>(json);
                }
                catch (Exception e)
                {
                    Debug.LogError($"[SaveSystem] Failed to load settings: {e.Message}");
                    data = CreateDefaultSettings();
                }
            }
            else
            {
                data = CreateDefaultSettings();
                await SaveSettings(data);
            }

            cachedSettingsData = data;
            ApplySettings(data);
            OnSettingsLoaded?.Invoke(cachedSettingsData);
        }

        public async Task SaveSettings(SettingsData data)
        {
            var path = Path.Combine(saveDirectory, SettingsFileName);
            try
            {
                var json = JsonUtility.ToJson(data, true);
                await File.WriteAllTextAsync(path, json);
                cachedSettingsData = data;
                ApplySettings(data);
                OnSettingsSaved?.Invoke(cachedSettingsData);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Failed to save settings: {e.Message}");
            }
        }

        private void ApplySettings(SettingsData data)
        {
            AudioListener.volume = data.masterVolume;
            QualitySettings.SetQualityLevel(data.qualityLevel);
            Application.targetFrameRate = data.targetFrameRate;
            if (data.fullscreen)
            {
                Screen.fullScreenMode = FullScreenMode.ExclusiveFullScreen;
            }
            else
            {
                Screen.fullScreenMode = FullScreenMode.Windowed;
            }
        }

        public GameSaveData CreateDefaultSave()
        {
            return new GameSaveData
            {
                playerName = "Skipper",
                totalCoins = 0,
                totalXP = 0,
                currentLevel = 1,
                playTimeSeconds = 0,
                unlockedLevelIds = new List<string> { "tutorial_01" },
                completedLevelIds = new List<string>(),
                levelBestScores = new LevelScoreDictionary(),
                unlockedGalleryItemIds = new List<string>(),
                unlockedAchievementIds = new List<string>(),
                completedDailyChallengeDates = new List<string>(),
                highestDailyChallengeStreak = 0,
                currentDailyChallengeStreak = 0,
                lastDailyChallengeDate = "",
                stats = new PlayerStats()
            };
        }

        public SettingsData CreateDefaultSettings()
        {
            return new SettingsData
            {
                masterVolume = 0.8f,
                musicVolume = 0.7f,
                sfxVolume = 0.9f,
                ambientVolume = 0.6f,
                qualityLevel = QualitySettings.GetQualityLevel(),
                targetFrameRate = 60,
                fullscreen = true,
                resolutionWidth = Screen.currentResolution.width,
                resolutionHeight = Screen.currentResolution.height,
                language = "zh-CN",
                showFPS = false,
                enableHints = true,
                enableWeatherWarnings = true,
                cameraShakeIntensity = 0.5f
            };
        }

        public async Task ResetProgress()
        {
            cachedSaveData = CreateDefaultSave();
            await SaveGame();
        }

        public async Task AddCoins(int amount)
        {
            cachedSaveData.totalCoins += amount;
            await SaveGame();
        }

        public async Task AddXP(int amount)
        {
            cachedSaveData.totalXP += amount;
            await SaveGame();
        }

        public async Task UnlockLevel(string levelId)
        {
            if (!cachedSaveData.unlockedLevelIds.Contains(levelId))
            {
                cachedSaveData.unlockedLevelIds.Add(levelId);
                await SaveGame();
            }
        }

        public async Task CompleteLevel(string levelId, int score, int stars)
        {
            if (!cachedSaveData.completedLevelIds.Contains(levelId))
            {
                cachedSaveData.completedLevelIds.Add(levelId);
            }

            if (cachedSaveData.levelBestScores.ContainsKey(levelId))
            {
                if (score > cachedSaveData.levelBestScores[levelId].score)
                {
                    cachedSaveData.levelBestScores[levelId] = new LevelScoreData { score = score, stars = stars };
                }
            }
            else
            {
                cachedSaveData.levelBestScores.Add(levelId, new LevelScoreData { score = score, stars = stars });
            }

            await SaveGame();
        }

        public async Task UnlockGalleryItem(string itemId)
        {
            if (!cachedSaveData.unlockedGalleryItemIds.Contains(itemId))
            {
                cachedSaveData.unlockedGalleryItemIds.Add(itemId);
                await SaveGame();
            }
        }

        public async Task UnlockAchievement(string achievementId)
        {
            if (!cachedSaveData.unlockedAchievementIds.Contains(achievementId))
            {
                cachedSaveData.unlockedAchievementIds.Add(achievementId);
                await SaveGame();
                EventBus.Trigger(new AchievementUnlockedEvent(achievementId));
            }
        }

        public bool HasCompletedLevel(string levelId)
        {
            return cachedSaveData?.completedLevelIds?.Contains(levelId) ?? false;
        }

        public bool IsLevelUnlocked(string levelId)
        {
            return cachedSaveData?.unlockedLevelIds?.Contains(levelId) ?? false;
        }

        public LevelScoreData GetLevelBestScore(string levelId)
        {
            if (cachedSaveData?.levelBestScores != null && cachedSaveData.levelBestScores.ContainsKey(levelId))
            {
                return cachedSaveData.levelBestScores[levelId];
            }
            return new LevelScoreData { score = 0, stars = 0 };
        }
    }

    [Serializable]
    public class GameSaveData
    {
        public string playerName;
        public int totalCoins;
        public int totalXP;
        public int currentLevel;
        public long playTimeSeconds;
        public string lastSaveTime;
        public List<string> unlockedLevelIds;
        public List<string> completedLevelIds;
        public LevelScoreDictionary levelBestScores;
        public List<string> unlockedGalleryItemIds;
        public List<string> unlockedAchievementIds;
        public List<string> completedDailyChallengeDates;
        public int highestDailyChallengeStreak;
        public int currentDailyChallengeStreak;
        public string lastDailyChallengeDate;
        public PlayerStats stats;
    }

    [Serializable]
    public class SettingsData
    {
        public float masterVolume;
        public float musicVolume;
        public float sfxVolume;
        public float ambientVolume;
        public int qualityLevel;
        public int targetFrameRate;
        public bool fullscreen;
        public int resolutionWidth;
        public int resolutionHeight;
        public string language;
        public bool showFPS;
        public bool enableHints;
        public bool enableWeatherWarnings;
        public float cameraShakeIntensity;
    }

    [Serializable]
    public struct LevelScoreData
    {
        public int score;
        public int stars;
    }

    [Serializable]
    public class PlayerStats
    {
        public int totalPhotosTaken;
        public int totalDistanceTraveled;
        public int totalFishCaught;
        public int weathersSurvived;
        public int perfectRoutesPlanned;
        public int totalSuppliesConsumed;
    }

    [Serializable]
    public class LevelScoreDictionary : SerializableDictionary<string, LevelScoreData> { }

    public struct AchievementUnlockedEvent : IEvent
    {
        public readonly string AchievementId;

        public AchievementUnlockedEvent(string achievementId)
        {
            AchievementId = achievementId;
        }
    }
}
