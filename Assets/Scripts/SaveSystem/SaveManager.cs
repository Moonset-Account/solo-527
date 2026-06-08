using System;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using UnityEngine;
using Kitchen.Config;

namespace Kitchen.Save
{
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        private const string SAVE_FILE_NAME = "kitchen_save.dat";
        private const string SAVE_FOLDER = "KitchenChaos";

        public GameSaveData CurrentSave { get; private set; }
        public bool IsLoaded { get; private set; }

        public event Action<GameSaveData> OnSaveLoaded;
        public event Action<GameSaveData> OnSaveWritten;
        public event Action<string> OnSaveError;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private string GetSavePath()
        {
            string folder = Path.Combine(Application.persistentDataPath, SAVE_FOLDER);
            if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
            return Path.Combine(folder, SAVE_FILE_NAME);
        }

        public void LoadOrCreateSave()
        {
            string path = GetSavePath();
            try
            {
                if (File.Exists(path))
                {
                    CurrentSave = LoadFromFile(path);
                    IsLoaded = true;
                    OnSaveLoaded?.Invoke(CurrentSave);
                }
                else
                {
                    CurrentSave = CreateNewSave();
                    IsLoaded = true;
                    SaveNow();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Load failed: {e.Message}");
                OnSaveError?.Invoke(e.Message);
                CurrentSave = CreateNewSave();
                IsLoaded = true;
            }
        }

        private GameSaveData LoadFromFile(string path)
        {
            byte[] encrypted = File.ReadAllBytes(path);
            string json = Encoding.UTF8.GetString(Obfuscate(encrypted));
            GameSaveData data = JsonUtility.FromJson<GameSaveData>(json);

            if (string.IsNullOrEmpty(data.saveVersion))
            {
                throw new Exception("Corrupted save file");
            }
            return data;
        }

        public void SaveNow()
        {
            if (CurrentSave == null) return;
            string path = GetSavePath();
            try
            {
                CurrentSave.timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                string json = JsonUtility.ToJson(CurrentSave, true);
                byte[] data = Encoding.UTF8.GetBytes(json);
                File.WriteAllBytes(path, Obfuscate(data));
                OnSaveWritten?.Invoke(CurrentSave);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Save failed: {e.Message}");
                OnSaveError?.Invoke(e.Message);
            }
        }

        private byte[] Obfuscate(byte[] data)
        {
            byte key = 0xAB;
            for (int i = 0; i < data.Length; i++)
            {
                data[i] ^= key;
                key = (byte)((key + data[i]) % 256);
            }
            return data;
        }

        public GameSaveData CreateNewSave()
        {
            return new GameSaveData
            {
                saveVersion = "1.0.0",
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                settings = new SettingsSaveData(),
                inputBindings = new InputSaveData(),
                playerStats = new PlayerStatsSaveData()
            };
        }

        public LevelSaveData GetOrCreateLevelData(LevelConfig level)
        {
            if (CurrentSave == null) LoadOrCreateSave();
            LevelSaveData existing = CurrentSave.levels.Find(l => l.levelId == level.levelId);
            if (existing != null) return existing;

            LevelSaveData newData = new LevelSaveData
            {
                levelId = level.levelId,
                isUnlocked = level.isUnlockedByDefault,
                bestScore = 0,
                starRating = 0,
                attempts = 0,
                successes = 0,
                failures = 0,
                consecutiveRetries = 0,
                tutorialSkipped = false,
                tutorialCompleted = false
            };
            CurrentSave.levels.Add(newData);
            return newData;
        }

        public void RecordLevelAttempt(LevelConfig level, bool success, int score, int stars,
            List<string> failureSteps, int retriesThisSession, bool tutorialSkipped = false)
        {
            LevelSaveData data = GetOrCreateLevelData(level);
            data.attempts++;
            if (success)
            {
                data.successes++;
                data.consecutiveRetries = 0;
                if (score > data.bestScore) data.bestScore = score;
                if (stars > data.starRating) data.starRating = stars;

                UnlockNextLevel(level.orderIndex);
            }
            else
            {
                data.failures++;
                data.consecutiveRetries++;
                data.failureSteps.AddRange(failureSteps);
                foreach (var step in failureSteps)
                {
                    if (!data.stepFailureCounts.ContainsKey(step)) data.stepFailureCounts[step] = 0;
                    data.stepFailureCounts[step]++;
                }
            }

            if (tutorialSkipped) data.tutorialSkipped = true;
            if (!success && !tutorialSkipped)
            {
            }

            SessionRecord record = new SessionRecord
            {
                levelId = level.levelId,
                startTime = CurrentSave.timestamp,
                endTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                score = score,
                stars = stars,
                completed = success,
                failureStepsThisSession = failureSteps,
                retriesThisSession = retriesThisSession
            };
            CurrentSave.playerStats.recentSessions.Add(record);
            if (CurrentSave.playerStats.recentSessions.Count > 50)
                CurrentSave.playerStats.recentSessions.RemoveAt(0);

            SaveNow();
        }

        public void RecordTutorialCompletion(LevelConfig level, bool skipped)
        {
            LevelSaveData data = GetOrCreateLevelData(level);
            if (skipped) data.tutorialSkipped = true;
            else data.tutorialCompleted = true;
            SaveNow();
        }

        private void UnlockNextLevel(int currentOrderIndex)
        {
            LevelConfig[] allLevels = Kitchen.Config.LevelConfigRegistry.GetAllLevels();
            foreach (var lv in allLevels)
            {
                if (lv.orderIndex == currentOrderIndex + 1)
                {
                    LevelSaveData data = GetOrCreateLevelData(lv);
                    data.isUnlocked = true;
                }
            }
        }

        public void RecordPlayerStat(string statType, int amount = 1)
        {
            if (CurrentSave == null) return;
            var stats = CurrentSave.playerStats;
            switch (statType)
            {
                case "OrderCompleted": stats.totalOrdersCompleted += amount; break;
                case "OrderFailed": stats.totalOrdersFailed += amount; break;
                case "Chopped": stats.totalIngredientsChopped += amount; break;
                case "Cooked": stats.totalIngredientsCooked += amount; break;
                case "Burned": stats.totalBurnedItems += amount; break;
                case "Cleaned": stats.totalPlatesCleaned += amount; break;
                case "Trashed": stats.totalTrashedItems += amount; break;
            }
        }

        public void RecordRecipeCompletion(string recipeId)
        {
            if (CurrentSave == null) return;
            var dict = CurrentSave.playerStats.recipeCompletionCounts;
            if (!dict.ContainsKey(recipeId)) dict[recipeId] = 0;
            dict[recipeId]++;
        }

        public void RecordFailReason(string reason)
        {
            if (CurrentSave == null) return;
            var dict = CurrentSave.playerStats.failReasonCounts;
            if (!dict.ContainsKey(reason)) dict[reason] = 0;
            dict[reason]++;
        }

        public SettingsSaveData GetSettings()
        {
            if (CurrentSave == null) LoadOrCreateSave();
            return CurrentSave.settings;
        }

        public void UpdateSettings(SettingsSaveData newSettings)
        {
            if (CurrentSave == null) return;
            CurrentSave.settings = newSettings;
            SaveNow();
        }

        public void ApplySettings()
        {
            SettingsSaveData s = GetSettings();
            Application.targetFrameRate = s.targetFrameRate;
            QualitySettings.vSyncCount = s.vsyncEnabled ? 1 : 0;
        }

        public void ClearSave()
        {
            string path = GetSavePath();
            if (File.Exists(path)) File.Delete(path);
            CurrentSave = CreateNewSave();
            IsLoaded = true;
            SaveNow();
        }

        public bool IsLevelUnlocked(LevelConfig level)
        {
            LevelSaveData data = GetOrCreateLevelData(level);
            return data.isUnlocked;
        }

        public int GetRetryCount(LevelConfig level)
        {
            LevelSaveData data = GetOrCreateLevelData(level);
            return data.consecutiveRetries;
        }
    }
}
