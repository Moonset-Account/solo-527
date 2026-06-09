using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;
using DecorMatch3.Utils;
using DecorMatch3.Core.Events;
using Newtonsoft.Json;

namespace DecorMatch3.Core
{
    [System.Serializable]
    public class PlayerSaveData
    {
        public string PlayerId;
        public string PlayerName;
        public long LastSaveTime;
        public long CreationTime;

        public int TotalCoins;
        public int TotalGems;
        public int TotalStars;
        public int HighestLevel;

        public Dictionary<int, int> LevelStars = new Dictionary<int, int>();
        public Dictionary<int, int> LevelBestScores = new Dictionary<int, int>();
        public Dictionary<int, int> LevelFailCounts = new Dictionary<int, int>();

        public Dictionary<int, int> MaterialsInventory = new Dictionary<int, int>();

        public List<int> CompletedOrderIds = new List<int>();
        public List<int> ActiveOrderIds = new List<int>();
        public Dictionary<int, int> OrderScores = new Dictionary<int, int>();
        public Dictionary<int, string> OrderDecorationChoices = new Dictionary<int, string>();

        public List<string> UnlockedAchievementIds = new List<string>();
        public Dictionary<string, int> AchievementProgress = new Dictionary<string, int>();

        public Dictionary<string, bool> CompletedDailyChallenges = new Dictionary<string, bool>();
        public List<LeaderboardEntryData> LocalLeaderboard = new List<LeaderboardEntryData>();

        public Dictionary<string, object> AnalyticsSessionData = new Dictionary<string, object>();

        public float MasterVolume = 1f;
        public float MusicVolume = 0.8f;
        public float SFXVolume = 1f;
        public bool VibrationEnabled = true;
        public string Language = "zh-CN";

        public int PlaySessionCount;
        public long TotalPlayTimeSeconds;
        public long LastSessionStartTime;
    }

    [System.Serializable]
    public class LeaderboardEntryData
    {
        public string PlayerName;
        public int Score;
        public int Level;
        public long Timestamp;
    }

    public class SaveSystem : Singleton<SaveSystem>
    {
        [SerializeField] private string _saveFileName = "player_save.json";
        [SerializeField] private string _backupFileName = "player_save_backup.json";
        [SerializeField] private bool _enableEncryption = true;
        [SerializeField] private int _autoSaveIntervalSeconds = 300;

        private PlayerSaveData _currentSaveData;
        private float _lastAutoSaveTime;
        private string _encryptionKey = "DecorMatch3_SaveKey_2024";

        public PlayerSaveData CurrentSave => _currentSaveData;
        public bool HasExistingSave { get; private set; }

        private string SaveFilePath => Path.Combine(Application.persistentDataPath, _saveFileName);
        private string BackupFilePath => Path.Combine(Application.persistentDataPath, _backupFileName);

        protected override void Awake()
        {
            base.Awake();
            HasExistingSave = File.Exists(SaveFilePath);
            LoadOrCreateSave();
        }

        private void Update()
        {
            if (_currentSaveData != null && Time.unscaledTime - _lastAutoSaveTime >= _autoSaveIntervalSeconds)
            {
                SaveAll(true);
                _lastAutoSaveTime = Time.unscaledTime;
            }
        }

        public void LoadOrCreateSave()
        {
            if (HasExistingSave)
            {
                LoadSave();
            }
            else
            {
                CreateNewSave();
            }

            _currentSaveData.LastSessionStartTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            _currentSaveData.PlaySessionCount++;
        }

        private void CreateNewSave()
        {
            Debug.Log("[SaveSystem] Creating new save data");

            _currentSaveData = new PlayerSaveData
            {
                PlayerId = SystemInfo.deviceUniqueIdentifier,
                PlayerName = "Player_" + UnityEngine.Random.Range(1000, 9999),
                CreationTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                LastSaveTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                TotalCoins = 100,
                TotalGems = 10,
                TotalStars = 0,
                HighestLevel = 0,
                PlaySessionCount = 0,
                TotalPlayTimeSeconds = 0
            };

            EventBus.Publish(new SaveDataLoadedEvent
            {
                SaveSlot = "default",
                LoadTime = DateTime.Now
            });
        }

        public void LoadSave()
        {
            try
            {
                string json = File.ReadAllText(SaveFilePath);

                if (_enableEncryption)
                {
                    json = DecryptString(json, _encryptionKey);
                }

                _currentSaveData = JsonConvert.DeserializeObject<PlayerSaveData>(json);

                if (_currentSaveData == null)
                {
                    Debug.LogWarning("[SaveSystem] Loaded save data is null, trying backup");
                    if (File.Exists(BackupFilePath))
                    {
                        json = File.ReadAllText(BackupFilePath);
                        if (_enableEncryption) json = DecryptString(json, _encryptionKey);
                        _currentSaveData = JsonConvert.DeserializeObject<PlayerSaveData>(json);
                    }
                }

                if (_currentSaveData != null)
                {
                    Debug.Log($"[SaveSystem] Save loaded successfully. Total play time: {_currentSaveData.TotalPlayTimeSeconds}s");
                    EventBus.Publish(new SaveDataLoadedEvent
                    {
                        SaveSlot = "default",
                        LoadTime = DateTime.Now
                    });
                }
                else
                {
                    Debug.LogError("[SaveSystem] Failed to load save, creating new one");
                    CreateNewSave();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Load failed: {e.Message}");
                CreateNewSave();
            }
        }

        public void SaveAll(bool isAutoSave = false)
        {
            if (_currentSaveData == null) return;

            try
            {
                UpdateSessionPlayTime();
                _currentSaveData.LastSaveTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                string json = JsonConvert.SerializeObject(_currentSaveData, Formatting.Indented);

                if (_enableEncryption)
                {
                    json = EncryptString(json, _encryptionKey);
                }

                if (File.Exists(SaveFilePath) && !isAutoSave)
                {
                    File.Copy(SaveFilePath, BackupFilePath, true);
                }

                File.WriteAllText(SaveFilePath, json);
                HasExistingSave = true;

                Debug.Log($"[SaveSystem] Save {(isAutoSave ? "auto-" : "")}saved successfully");

                EventBus.Publish(new SaveDataSavedEvent
                {
                    SaveSlot = "default",
                    SaveTime = DateTime.Now,
                    IsAutoSave = isAutoSave
                });
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Save failed: {e.Message}");
            }
        }

        private void UpdateSessionPlayTime()
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            long sessionDuration = now - _currentSaveData.LastSessionStartTime;
            _currentSaveData.TotalPlayTimeSeconds += sessionDuration;
            _currentSaveData.LastSessionStartTime = now;
        }

        public void AddCoins(int amount)
        {
            _currentSaveData.TotalCoins = Mathf.Max(0, _currentSaveData.TotalCoins + amount);
        }

        public void AddGems(int amount)
        {
            _currentSaveData.TotalGems = Mathf.Max(0, _currentSaveData.TotalGems + amount);
        }

        public void AddStars(int amount)
        {
            _currentSaveData.TotalStars = Mathf.Max(0, _currentSaveData.TotalStars + amount);
        }

        public void AddMaterial(int materialId, int amount)
        {
            if (_currentSaveData.MaterialsInventory.ContainsKey(materialId))
            {
                _currentSaveData.MaterialsInventory[materialId] += amount;
            }
            else
            {
                _currentSaveData.MaterialsInventory[materialId] = amount;
            }

            _currentSaveData.MaterialsInventory[materialId] = Mathf.Max(0, _currentSaveData.MaterialsInventory[materialId]);
        }

        public int GetMaterialCount(int materialId)
        {
            _currentSaveData.MaterialsInventory.TryGetValue(materialId, out int count);
            return count;
        }

        public bool SpendMaterials(Dictionary<int, int> materials)
        {
            foreach (var kvp in materials)
            {
                if (GetMaterialCount(kvp.Key) < kvp.Value)
                {
                    return false;
                }
            }

            foreach (var kvp in materials)
            {
                AddMaterial(kvp.Key, -kvp.Value);
            }

            return true;
        }

        public void RecordLevelResult(int levelId, int stars, int score)
        {
            _currentSaveData.LevelStars[levelId] = Mathf.Max(
                _currentSaveData.LevelStars.ContainsKey(levelId) ? _currentSaveData.LevelStars[levelId] : 0,
                stars);

            _currentSaveData.LevelBestScores[levelId] = Mathf.Max(
                _currentSaveData.LevelBestScores.ContainsKey(levelId) ? _currentSaveData.LevelBestScores[levelId] : 0,
                score);

            if (levelId > _currentSaveData.HighestLevel)
            {
                _currentSaveData.HighestLevel = levelId;
            }
        }

        public void RecordLevelFail(int levelId)
        {
            _currentSaveData.LevelFailCounts.TryGetValue(levelId, out int count);
            _currentSaveData.LevelFailCounts[levelId] = count + 1;
        }

        public void RecordOrderDecorationChoice(int orderId, string choiceKey, string choiceValue)
        {
            string fullKey = $"{orderId}_{choiceKey}";
            _currentSaveData.OrderDecorationChoices[fullKey] = choiceValue;
        }

        public void RecordOrderCompletion(int orderId, int score)
        {
            if (!_currentSaveData.CompletedOrderIds.Contains(orderId))
            {
                _currentSaveData.CompletedOrderIds.Add(orderId);
            }
            _currentSaveData.ActiveOrderIds.Remove(orderId);
            _currentSaveData.OrderScores[orderId] = score;
        }

        public void AddActiveOrder(int orderId)
        {
            if (!_currentSaveData.ActiveOrderIds.Contains(orderId))
            {
                _currentSaveData.ActiveOrderIds.Add(orderId);
            }
        }

        public bool IsAchievementUnlocked(string achievementId)
        {
            return _currentSaveData.UnlockedAchievementIds.Contains(achievementId);
        }

        public void UnlockAchievement(string achievementId)
        {
            if (!IsAchievementUnlocked(achievementId))
            {
                _currentSaveData.UnlockedAchievementIds.Add(achievementId);
            }
        }

        public int GetAchievementProgress(string achievementId)
        {
            _currentSaveData.AchievementProgress.TryGetValue(achievementId, out int progress);
            return progress;
        }

        public void SetAchievementProgress(string achievementId, int progress)
        {
            _currentSaveData.AchievementProgress[achievementId] = progress;
        }

        public bool IsDailyChallengeCompleted(string dateKey)
        {
            _currentSaveData.CompletedDailyChallenges.TryGetValue(dateKey, out bool completed);
            return completed;
        }

        public void MarkDailyChallengeCompleted(string dateKey)
        {
            _currentSaveData.CompletedDailyChallenges[dateKey] = true;
        }

        public void AddLeaderboardEntry(LeaderboardEntryData entry)
        {
            _currentSaveData.LocalLeaderboard.Add(entry);
            _currentSaveData.LocalLeaderboard.Sort((a, b) => b.Score.CompareTo(a.Score));
            if (_currentSaveData.LocalLeaderboard.Count > 100)
            {
                _currentSaveData.LocalLeaderboard.RemoveRange(100, _currentSaveData.LocalLeaderboard.Count - 100);
            }
        }

        public void UpdateSettings(string key, object value)
        {
            switch (key)
            {
                case "MasterVolume":
                    _currentSaveData.MasterVolume = Convert.ToSingle(value);
                    break;
                case "MusicVolume":
                    _currentSaveData.MusicVolume = Convert.ToSingle(value);
                    break;
                case "SFXVolume":
                    _currentSaveData.SFXVolume = Convert.ToSingle(value);
                    break;
                case "VibrationEnabled":
                    _currentSaveData.VibrationEnabled = Convert.ToBoolean(value);
                    break;
                case "Language":
                    _currentSaveData.Language = value.ToString();
                    break;
            }

            EventBus.Publish(new SettingsChangedEvent
            {
                SettingKey = key,
                OldValue = null,
                NewValue = value
            });
        }

        public void DeleteSave()
        {
            if (File.Exists(SaveFilePath))
            {
                File.Delete(SaveFilePath);
            }
            if (File.Exists(BackupFilePath))
            {
                File.Delete(BackupFilePath);
            }
            HasExistingSave = false;
            CreateNewSave();
        }

        private string EncryptString(string plainText, string key)
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(key.Substring(0, 16));
            using (Aes aes = Aes.Create())
            {
                aes.Key = keyBytes;
                aes.IV = keyBytes;

                ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter sw = new StreamWriter(cs))
                        {
                            sw.Write(plainText);
                        }
                        byte[] encrypted = ms.ToArray();
                        return Convert.ToBase64String(encrypted);
                    }
                }
            }
        }

        private string DecryptString(string cipherText, string key)
        {
            try
            {
                byte[] keyBytes = Encoding.UTF8.GetBytes(key.Substring(0, 16));
                byte[] cipherBytes = Convert.FromBase64String(cipherText);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = keyBytes;
                    aes.IV = keyBytes;

                    ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
                    using (MemoryStream ms = new MemoryStream(cipherBytes))
                    {
                        using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                        {
                            using (StreamReader sr = new StreamReader(cs))
                            {
                                return sr.ReadToEnd();
                            }
                        }
                    }
                }
            }
            catch
            {
                return cipherText;
            }
        }
    }
}
