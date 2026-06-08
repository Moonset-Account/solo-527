using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class SaveSystem
    {
        private static SaveSystem _instance;
        public static SaveSystem Instance
        {
            get
            {
                if (_instance == null) _instance = new SaveSystem();
                return _instance;
            }
        }

        private string _saveDir;
        private string _playerSavePath;
        private string _gameSessionPath;
        private const string ChecksumKey = "TeaGardenDefense_v1";

        public event Action<PlayerSaveData> OnPlayerDataLoaded;
        public event Action<GameSessionData> OnSessionLoaded;
        public event Action<string> OnSaveFailed;
        public event Action<string> OnSaveSuccess;

        public PlayerSaveData PlayerData { get; private set; }
        public GameSessionData CurrentSession { get; private set; }

        public bool IsPlayerDataLoaded { get; private set; }

        private SaveSystem()
        {
            _saveDir = Path.Combine(Application.persistentDataPath, "Saves");
            _playerSavePath = Path.Combine(_saveDir, "player_data.json");
            _gameSessionPath = Path.Combine(_saveDir, "current_session.json");
        }

        public void Initialize()
        {
            if (!Directory.Exists(_saveDir))
            {
                Directory.CreateDirectory(_saveDir);
            }
            LoadPlayerData();
        }

        public void LoadPlayerData()
        {
            try
            {
                if (File.Exists(_playerSavePath))
                {
                    string encryptedJson = ReadEncrypted(_playerSavePath);
                    if (!string.IsNullOrEmpty(encryptedJson))
                    {
                        try
                        {
                            PlayerData = JsonUtility.FromJson<PlayerSaveData>(encryptedJson);
                        }
                        catch
                        {
                            PlayerData = CreateDefaultPlayerData();
                        }
                    }
                    else
                    {
                        PlayerData = CreateDefaultPlayerData();
                    }
                }
                else
                {
                    PlayerData = CreateDefaultPlayerData();
                    SavePlayerData();
                }

                if (PlayerData == null)
                {
                    PlayerData = CreateDefaultPlayerData();
                }
                if (PlayerData.unlockedLevels == null) PlayerData.unlockedLevels = new List<string>();
                if (PlayerData.completedLevels == null) PlayerData.completedLevels = new Dictionary<string, LevelCompletionData>();
                if (PlayerData.failureCounts == null) PlayerData.failureCounts = new Dictionary<string, int>();
                if (PlayerData.inputMappings == null) PlayerData.inputMappings = new Dictionary<string, InputMappingData>();
                if (PlayerData.settings == null) PlayerData.settings = new GameSettingsData();
                if (PlayerData.choiceLogs == null) PlayerData.choiceLogs = new List<ChoiceLogEntry>();

                IsPlayerDataLoaded = true;
                OnPlayerDataLoaded?.Invoke(PlayerData);
            }
            catch (Exception e)
            {
                Debug.LogError($"[Save] 加载玩家数据失败: {e.Message}");
                PlayerData = CreateDefaultPlayerData();
                IsPlayerDataLoaded = true;
                OnSaveFailed?.Invoke("player_load");
            }
        }

        public void SavePlayerData()
        {
            try
            {
                PlayerData.lastSaveTime = DateTime.Now.ToString("o");
                string json = JsonUtility.ToJson(PlayerData, true);
                WriteEncrypted(_playerSavePath, json);
                OnSaveSuccess?.Invoke("player");
            }
            catch (Exception e)
            {
                Debug.LogError($"[Save] 保存玩家数据失败: {e.Message}");
                OnSaveFailed?.Invoke("player_save");
            }
        }

        public bool HasLevelCompleted(string levelId)
        {
            return PlayerData.completedLevels.ContainsKey(levelId);
        }

        public LevelCompletionData GetLevelCompletion(string levelId)
        {
            if (PlayerData.completedLevels.TryGetValue(levelId, out var data))
                return data;
            return null;
        }

        public void RecordLevelCompletion(string levelId, LevelCompletionData completionData)
        {
            if (PlayerData.completedLevels.ContainsKey(levelId))
            {
                var existing = PlayerData.completedLevels[levelId];
                completionData.bestTimeSeconds = Math.Min(existing.bestTimeSeconds, completionData.bestTimeSeconds);
                completionData.fewestFailures = Math.Min(existing.fewestFailures, completionData.fewestFailures);
                completionData.highestScore = Math.Max(existing.highestScore, completionData.highestScore);
                completionData.playCount = existing.playCount + 1;
                completionData.starsEarned = Math.Max(existing.starsEarned, completionData.starsEarned);
            }
            PlayerData.completedLevels[levelId] = completionData;
            PlayerData.totalPlayTimeSeconds += completionData.bestTimeSeconds;
            if (!PlayerData.unlockedLevels.Contains(levelId))
                PlayerData.unlockedLevels.Add(levelId);
            SavePlayerData();
        }

        public void RecordLevelFailure(string levelId)
        {
            PlayerData.totalFailures++;
            if (PlayerData.failureCounts.ContainsKey(levelId))
                PlayerData.failureCounts[levelId]++;
            else
                PlayerData.failureCounts[levelId] = 1;
            SavePlayerData();
        }

        public void UnlockLevel(string levelId)
        {
            if (!PlayerData.unlockedLevels.Contains(levelId))
                PlayerData.unlockedLevels.Add(levelId);
            SavePlayerData();
        }

        public bool IsLevelUnlocked(string levelId)
        {
            return PlayerData.unlockedLevels.Contains(levelId);
        }

        public void SaveGameSession(GameSessionData session)
        {
            try
            {
                CurrentSession = session;
                session.saveTime = DateTime.Now.ToString("o");
                string json = JsonUtility.ToJson(session, true);
                WriteEncrypted(_gameSessionPath, json);
                OnSaveSuccess?.Invoke("session");
            }
            catch (Exception e)
            {
                Debug.LogError($"[Save] 保存会话失败: {e.Message}");
                OnSaveFailed?.Invoke("session_save");
            }
        }

        public GameSessionData LoadGameSession()
        {
            try
            {
                if (!File.Exists(_gameSessionPath))
                {
                    OnSaveFailed?.Invoke("no_session");
                    return null;
                }

                string json = ReadEncrypted(_gameSessionPath);
                if (string.IsNullOrEmpty(json)) return null;

                CurrentSession = JsonUtility.FromJson<GameSessionData>(json);
                OnSessionLoaded?.Invoke(CurrentSession);
                return CurrentSession;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Save] 加载会话失败: {e.Message}");
                OnSaveFailed?.Invoke("session_load");
                return null;
            }
        }

        public bool HasSavedSession()
        {
            return File.Exists(_gameSessionPath);
        }

        public void DeleteSavedSession()
        {
            if (File.Exists(_gameSessionPath))
            {
                File.Delete(_gameSessionPath);
            }
            CurrentSession = null;
        }

        public void UpdateInputMapping(string action, KeyCode primaryKey, KeyCode secondaryKey = KeyCode.None)
        {
            PlayerData.inputMappings[action] = new InputMappingData
            {
                actionName = action,
                primaryKey = primaryKey.ToString(),
                secondaryKey = secondaryKey.ToString()
            };
            SavePlayerData();
        }

        public InputMappingData GetInputMapping(string action)
        {
            if (PlayerData.inputMappings.TryGetValue(action, out var mapping))
                return mapping;
            return GetDefaultInputMapping(action);
        }

        public void UpdateSettings(GameSettingsData settings)
        {
            PlayerData.settings = settings;
            SavePlayerData();
        }

        public void RecordChoiceLog(ChoiceLogEntry entry)
        {
            if (PlayerData.choiceLogs.Count > 1000)
            {
                PlayerData.choiceLogs.RemoveRange(0, PlayerData.choiceLogs.Count - 1000);
            }
            PlayerData.choiceLogs.Add(entry);
        }

        public List<ChoiceLogEntry> GetRecentChoices(int count = 50)
        {
            int total = PlayerData.choiceLogs.Count;
            int start = Math.Max(0, total - count);
            int take = Math.Min(count, total - start);
            if (take <= 0) return new List<ChoiceLogEntry>();
            return PlayerData.choiceLogs.GetRange(start, take);
        }

        private PlayerSaveData CreateDefaultPlayerData()
        {
            var data = new PlayerSaveData
            {
                playerId = Guid.NewGuid().ToString(),
                createdTime = DateTime.Now.ToString("o"),
                lastSaveTime = "",
                unlockedLevels = new List<string> { "level_1" },
                completedLevels = new Dictionary<string, LevelCompletionData>(),
                failureCounts = new Dictionary<string, int>(),
                inputMappings = GetDefaultInputMappings(),
                settings = new GameSettingsData
                {
                    masterVolume = 1f,
                    musicVolume = 0.8f,
                    sfxVolume = 1f,
                    targetFrameRate = 60,
                    qualityLevel = 2,
                    isFullscreen = true,
                    resolutionWidth = 1920,
                    resolutionHeight = 1080,
                    showFPS = true,
                    showTutorial = true,
                    timeScale = 1f
                },
                totalPlayTimeSeconds = 0,
                totalFailures = 0,
                choiceLogs = new List<ChoiceLogEntry>()
            };
            return data;
        }

        private Dictionary<string, InputMappingData> GetDefaultInputMappings()
        {
            return new Dictionary<string, InputMappingData>
            {
                { "start_wave", new InputMappingData { actionName = "start_wave", primaryKey = "Space", secondaryKey = "Return" } },
                { "speed_up", new InputMappingData { actionName = "speed_up", primaryKey = "LeftShift", secondaryKey = "RightShift" } },
                { "pause", new InputMappingData { actionName = "pause", primaryKey = "Escape", secondaryKey = "P" } },
                { "select_tower_1", new InputMappingData { actionName = "select_tower_1", primaryKey = "Alpha1", secondaryKey = "Keypad1" } },
                { "select_tower_2", new InputMappingData { actionName = "select_tower_2", primaryKey = "Alpha2", secondaryKey = "Keypad2" } },
                { "select_tower_3", new InputMappingData { actionName = "select_tower_3", primaryKey = "Alpha3", secondaryKey = "Keypad3" } },
                { "select_tower_4", new InputMappingData { actionName = "select_tower_4", primaryKey = "Alpha4", secondaryKey = "Keypad4" } },
                { "select_tower_5", new InputMappingData { actionName = "select_tower_5", primaryKey = "Alpha5", secondaryKey = "Keypad5" } },
                { "upgrade_tower", new InputMappingData { actionName = "upgrade_tower", primaryKey = "U", secondaryKey = "None" } },
                { "sell_tower", new InputMappingData { actionName = "sell_tower", primaryKey = "S", secondaryKey = "None" } },
                { "cancel", new InputMappingData { actionName = "cancel", primaryKey = "Escape", secondaryKey = "C" } },
                { "confirm", new InputMappingData { actionName = "confirm", primaryKey = "Return", secondaryKey = "Mouse0" } }
            };
        }

        private InputMappingData GetDefaultInputMapping(string action)
        {
            var defaults = GetDefaultInputMappings();
            return defaults.ContainsKey(action) ? defaults[action] : new InputMappingData { actionName = action, primaryKey = "None", secondaryKey = "None" };
        }

        private void WriteEncrypted(string path, string content)
        {
            string encrypted = Encrypt(content);
            File.WriteAllText(path, encrypted);
        }

        private string ReadEncrypted(string path)
        {
            try
            {
                string content = File.ReadAllText(path);
                return Decrypt(content);
            }
            catch
            {
                try { return File.ReadAllText(path); }
                catch { return ""; }
            }
        }

        private string Encrypt(string plainText)
        {
            try
            {
                using (var sha = SHA256.Create())
                {
                    byte[] key = sha.ComputeHash(Encoding.UTF8.GetBytes(ChecksumKey));
                    using (var aes = Aes.Create())
                    {
                        aes.Key = key;
                        aes.GenerateIV();
                        var encryptor = aes.CreateEncryptor();
                        byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
                        byte[] encrypted = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
                        byte[] result = new byte[aes.IV.Length + encrypted.Length];
                        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
                        Buffer.BlockCopy(encrypted, 0, result, aes.IV.Length, encrypted.Length);
                        return Convert.ToBase64String(result);
                    }
                }
            }
            catch
            {
                return Convert.ToBase64String(Encoding.UTF8.GetBytes(plainText));
            }
        }

        private string Decrypt(string cipherText)
        {
            try
            {
                using (var sha = SHA256.Create())
                {
                    byte[] key = sha.ComputeHash(Encoding.UTF8.GetBytes(ChecksumKey));
                    byte[] full = Convert.FromBase64String(cipherText);
                    using (var aes = Aes.Create())
                    {
                        aes.Key = key;
                        byte[] iv = new byte[aes.IV.Length];
                        byte[] data = new byte[full.Length - iv.Length];
                        Buffer.BlockCopy(full, 0, iv, 0, iv.Length);
                        Buffer.BlockCopy(full, iv.Length, data, 0, data.Length);
                        aes.IV = iv;
                        var decryptor = aes.CreateDecryptor();
                        byte[] decrypted = decryptor.TransformFinalBlock(data, 0, data.Length);
                        return Encoding.UTF8.GetString(decrypted);
                    }
                }
            }
            catch
            {
                try { return Encoding.UTF8.GetString(Convert.FromBase64String(cipherText)); }
                catch { return cipherText; }
            }
        }

        public void ResetAllData()
        {
            if (Directory.Exists(_saveDir))
            {
                Directory.Delete(_saveDir, true);
            }
            PlayerData = CreateDefaultPlayerData();
            Initialize();
        }
    }

    [Serializable]
    public class PlayerSaveData
    {
        public string playerId;
        public string createdTime;
        public string lastSaveTime;
        public List<string> unlockedLevels;
        public SerializableDictionary<string, LevelCompletionData> completedLevels;
        public SerializableDictionary<string, int> failureCounts;
        public SerializableDictionary<string, InputMappingData> inputMappings;
        public GameSettingsData settings;
        public double totalPlayTimeSeconds;
        public int totalFailures;
        public List<ChoiceLogEntry> choiceLogs;
    }

    [Serializable]
    public class LevelCompletionData
    {
        public string levelId;
        public float bestTimeSeconds;
        public int fewestFailures;
        public int highestScore;
        public int playCount;
        public string completedTime;
        public List<string> towerChoices;
        public int starsEarned;
    }

    [Serializable]
    public class InputMappingData
    {
        public string actionName;
        public string primaryKey;
        public string secondaryKey;
    }

    [Serializable]
    public class GameSettingsData
    {
        public float masterVolume;
        public float musicVolume;
        public float sfxVolume;
        public int targetFrameRate;
        public int qualityLevel;
        public bool isFullscreen;
        public int resolutionWidth;
        public int resolutionHeight;
        public bool showFPS;
        public bool showTutorial;
        public float timeScale;
    }

    [Serializable]
    public class GameSessionData
    {
        public string levelId;
        public int currentWave;
        public int gold;
        public int baseHealth;
        public float elapsedTime;
        public string saveTime;
        public List<PlacedTowerData> placedTowers;
        public string currentWeather;
        public int enemiesKilled;
        public int enemiesPassed;
        public List<ChoiceLogEntry> sessionChoices;
    }

    [Serializable]
    public class PlacedTowerData
    {
        public string slotId;
        public string towerId;
        public int level;
    }

    [Serializable]
    public class ChoiceLogEntry
    {
        public string levelId;
        public float gameTime;
        public string choiceType;
        public string choiceDetail;
        public int goldBefore;
        public int goldAfter;
        public int waveNumber;
    }

    [Serializable]
    public class SerializableDictionary<TKey, TValue> : Dictionary<TKey, TValue>, ISerializationCallbackReceiver
    {
        [SerializeField] private List<TKey> keys = new List<TKey>();
        [SerializeField] private List<TValue> values = new List<TValue>();

        public void OnBeforeSerialize()
        {
            keys.Clear();
            values.Clear();
            foreach (var kvp in this)
            {
                keys.Add(kvp.Key);
                values.Add(kvp.Value);
            }
        }

        public void OnAfterDeserialize()
        {
            this.Clear();
            for (int i = 0; i < Math.Min(keys.Count, values.Count); i++)
            {
                this[keys[i]] = values[i];
            }
        }
    }
}
