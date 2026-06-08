using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace DecorMatch3
{
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        public SaveData CurrentSave { get; private set; }

        public string SavePath => Path.Combine(Application.persistentDataPath, "save.json");

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void Save()
        {
            CurrentSave.saveTimestamp = DateTime.Now.ToBinary();
            string json = JsonUtility.ToJson(CurrentSave, true);
            File.WriteAllText(SavePath, json);
        }

        public void Load()
        {
            if (File.Exists(SavePath))
            {
                string json = File.ReadAllText(SavePath);
                if (JsonHelper.TryDeserialize<SaveData>(json, out SaveData loaded))
                {
                    CurrentSave = loaded;
                }
            }
            if (CurrentSave == null)
            {
                CurrentSave = CreateDefaultSave();
            }
        }

        public void DeleteSave()
        {
            if (File.Exists(SavePath))
            {
                File.Delete(SavePath);
            }
            CurrentSave = null;
        }

        public bool HasSave => File.Exists(SavePath);

        public SaveData CreateDefaultSave()
        {
            return new SaveData
            {
                playerProfile = new PlayerProfileData
                {
                    currentLevel = 1,
                    coins = 100
                },
                levelRecords = new List<LevelRecordData>(),
                analytics = new AnalyticsData
                {
                    entries = new List<AnalyticsEntryData>(),
                    tutorialSkipped = false
                },
                settings = new GameSettingsData
                {
                    musicVolume = 0.7f,
                    sfxVolume = 1.0f,
                    keyBindings = new List<StringPair>()
                },
                saveTimestamp = DateTime.Now.ToBinary()
            };
        }

        public void UpdateLevelRecord(int levelId, int score, int stars, bool completed, string failedStep = null)
        {
            if (CurrentSave.levelRecords == null)
            {
                CurrentSave.levelRecords = new List<LevelRecordData>();
            }

            var existing = CurrentSave.levelRecords.Find(r => r.levelId == levelId);

            if (existing != null)
            {
                existing.bestScore = Mathf.Max(existing.bestScore, score);
                existing.bestStars = Mathf.Max(existing.bestStars, stars);
                existing.completed = existing.completed || completed;
                if (failedStep != null)
                {
                    existing.failedStep = failedStep;
                }
            }
            else
            {
                CurrentSave.levelRecords.Add(new LevelRecordData
                {
                    levelId = levelId,
                    bestScore = score,
                    bestStars = stars,
                    completed = completed,
                    failedStep = failedStep,
                    retryCount = 0
                });
            }
        }

        public void AddAnalyticsEntry(string eventType, Dictionary<string, string> parameters = null)
        {
            if (CurrentSave.analytics == null)
            {
                CurrentSave.analytics = new AnalyticsData
                {
                    entries = new List<AnalyticsEntryData>(),
                    tutorialSkipped = false
                };
            }

            var entry = new AnalyticsEntryData
            {
                eventType = eventType,
                timestamp = DateTime.Now.ToBinary()
            };

            if (parameters != null)
            {
                var pairs = new List<StringPair>();
                foreach (var kvp in parameters)
                {
                    pairs.Add(new StringPair { key = kvp.Key, value = kvp.Value });
                }
                entry.parameters = pairs;
            }

            CurrentSave.analytics.entries.Add(entry);
        }

        public void RecordTutorialSkip()
        {
            if (CurrentSave.analytics != null)
            {
                CurrentSave.analytics.tutorialSkipped = true;
            }
            AddAnalyticsEntry("tutorial_skip");
        }

        public void RecordRetry(int levelId)
        {
            AddAnalyticsEntry("level_retry", new Dictionary<string, string> { { "levelId", levelId.ToString() } });

            if (CurrentSave.levelRecords == null)
            {
                CurrentSave.levelRecords = new List<LevelRecordData>();
            }

            var existing = CurrentSave.levelRecords.Find(r => r.levelId == levelId);
            if (existing != null)
            {
                existing.retryCount++;
            }
        }
    }
}
