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

        private PlayerSaveData _playerData;

        private Dictionary<string, LevelCompletionData> _completedLevels;
        private Dictionary<string, int> _failureCounts;
        private Dictionary<string, InputMappingData> _inputMappings;

        public PlayerSaveData PlayerData => _playerData;
        public GameSessionData CurrentSession { get; private set; }

        public Dictionary<string, LevelCompletionData> CompletedLevels => _completedLevels;
        public Dictionary<string, int> FailureCounts => _failureCounts;
        public Dictionary<string, InputMappingData> InputMappings => _inputMappings;

        public bool IsPlayerDataLoaded { get; private set; }

        private SaveSystem()
        {
            _saveDir = Path.Combine(Application.persistentDataPath, "Saves");
            _playerSavePath = Path.Combine(_saveDir, "player_data.json");
            _gameSessionPath = Path.Combine(_saveDir, "current_session.json");
            _completedLevels = new Dictionary<string, LevelCompletionData>();
            _failureCounts = new Dictionary<string, int>();
            _inputMappings = new Dictionary<string, InputMappingData>();
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
                PlayerSaveData raw = null;
                if (File.Exists(_playerSavePath))
                {
                    string encryptedJson = ReadEncrypted(_playerSavePath);
                    if (!string.IsNullOrEmpty(encryptedJson))
                    {
                        try { raw = JsonUtility.FromJson<PlayerSaveData>(encryptedJson); }
                        catch { raw = null; }
                    }
                }

                if (raw == null)
                {
                    raw = CreateDefaultPlayerData();
                }

                _playerData = raw;

                if (_playerData.unlockedLevels == null)
                    _playerData.unlockedLevels = new List<string> { "level_1" };
                if (_playerData.choiceLogs == null)
                    _playerData.choiceLogs = new List<ChoiceLogEntry>();
                if (_playerData.settings == null)
                    _playerData.settings = CreateDefaultSettings();
                if (string.IsNullOrEmpty(_playerData.playerId))
                    _playerData.playerId = Guid.NewGuid().ToString();
                if (string.IsNullOrEmpty(_playerData.createdTime))
                    _playerData.createdTime = DateTime.Now.ToString("o");

                _completedLevels = StringKeyValueSerializer.Deserialize<LevelCompletionData>(
                    _playerData.completedLevelKeys, _playerData.completedLevelValues);
                _failureCounts = StringKeyValueSerializer.DeserializeInt(
                    _playerData.failureCountKeys, _playerData.failureCountValues);
                _inputMappings = StringKeyValueSerializer.Deserialize<InputMappingData>(
                    _playerData.inputMappingKeys, _playerData.inputMappingValues);

                if (_completedLevels == null) _completedLevels = new Dictionary<string, LevelCompletionData>();
                if (_failureCounts == null) _failureCounts = new Dictionary<string, int>();
                if (_inputMappings == null || _inputMappings.Count == 0)
                    _inputMappings = GetDefaultInputMappings();

                if (_playerData.unlockedLevels.Count == 0)
                    _playerData.unlockedLevels.Add("level_1");

                IsPlayerDataLoaded = true;
                OnPlayerDataLoaded?.Invoke(_playerData);

                if (!File.Exists(_playerSavePath))
                {
                    SavePlayerData();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[Save] 加载玩家数据失败: {e.Message}\n{e.StackTrace}");
                _playerData = CreateDefaultPlayerData();
                _completedLevels = new Dictionary<string, LevelCompletionData>();
                _failureCounts = new Dictionary<string, int>();
                _inputMappings = GetDefaultInputMappings();
                IsPlayerDataLoaded = true;
                OnSaveFailed?.Invoke("player_load");
            }
        }

        public void SavePlayerData()
        {
            try
            {
                _playerData.lastSaveTime = DateTime.Now.ToString("o");

                StringKeyValueSerializer.Serialize(_completedLevels,
                    out _playerData.completedLevelKeys, out _playerData.completedLevelValues);
                StringKeyValueSerializer.SerializeInt(_failureCounts,
                    out _playerData.failureCountKeys, out _playerData.failureCountValues);
                StringKeyValueSerializer.Serialize(_inputMappings,
                    out _playerData.inputMappingKeys, out _playerData.inputMappingValues);

                string json = JsonUtility.ToJson(_playerData, true);
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
            return _completedLevels.ContainsKey(levelId);
        }

        public LevelCompletionData GetLevelCompletion(string levelId)
        {
            if (_completedLevels.TryGetValue(levelId, out var data))
                return data;
            return null;
        }

        public void RecordLevelCompletion(string levelId, LevelCompletionData completionData)
        {
            if (_completedLevels.ContainsKey(levelId))
            {
                var existing = _completedLevels[levelId];
                completionData.bestTimeSeconds = Math.Min(existing.bestTimeSeconds, completionData.bestTimeSeconds);
                completionData.fewestFailures = Math.Min(existing.fewestFailures, completionData.fewestFailures);
                completionData.highestScore = Math.Max(existing.highestScore, completionData.highestScore);
                completionData.playCount = existing.playCount + 1;
                completionData.starsEarned = Math.Max(existing.starsEarned, completionData.starsEarned);
            }
            _completedLevels[levelId] = completionData;
            _playerData.totalPlayTimeSeconds += completionData.bestTimeSeconds;
            if (!_playerData.unlockedLevels.Contains(levelId))
                _playerData.unlockedLevels.Add(levelId);
            SavePlayerData();
        }

        public void RecordLevelFailure(string levelId)
        {
            _playerData.totalFailures++;
            if (_failureCounts.ContainsKey(levelId))
                _failureCounts[levelId]++;
            else
                _failureCounts[levelId] = 1;
            SavePlayerData();
        }

        public void UnlockLevel(string levelId)
        {
            if (!_playerData.unlockedLevels.Contains(levelId))
                _playerData.unlockedLevels.Add(levelId);
            SavePlayerData();
        }

        public bool IsLevelUnlocked(string levelId)
        {
            return _playerData.unlockedLevels.Contains(levelId);
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
            _inputMappings[action] = new InputMappingData
            {
                actionName = action,
                primaryKey = primaryKey.ToString(),
                secondaryKey = secondaryKey.ToString()
            };
            SavePlayerData();
        }

        public InputMappingData GetInputMapping(string action)
        {
            if (_inputMappings.TryGetValue(action, out var mapping))
                return mapping;
            return GetDefaultInputMapping(action);
        }

        public void UpdateSettings(GameSettingsData settings)
        {
            _playerData.settings = settings;
            SavePlayerData();
        }

        public void RecordChoiceLog(ChoiceLogEntry entry)
        {
            if (_playerData.choiceLogs.Count > 1000)
            {
                _playerData.choiceLogs.RemoveRange(0, _playerData.choiceLogs.Count - 1000);
            }
            _playerData.choiceLogs.Add(entry);
        }

        public List<ChoiceLogEntry> GetRecentChoices(int count = 50)
        {
            int total = _playerData.choiceLogs.Count;
            int start = Math.Max(0, total - count);
            int take = Math.Min(count, total - start);
            if (take <= 0) return new List<ChoiceLogEntry>();
            return _playerData.choiceLogs.GetRange(start, take);
        }

        private PlayerSaveData CreateDefaultPlayerData()
        {
            var data = new PlayerSaveData
            {
                playerId = Guid.NewGuid().ToString(),
                createdTime = DateTime.Now.ToString("o"),
                lastSaveTime = "",
                unlockedLevels = new List<string> { "level_1" },
                settings = CreateDefaultSettings(),
                totalPlayTimeSeconds = 0,
                totalFailures = 0,
                choiceLogs = new List<ChoiceLogEntry>()
            };
            return data;
        }

        private GameSettingsData CreateDefaultSettings()
        {
            return new GameSettingsData
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
            };
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
            _playerData = CreateDefaultPlayerData();
            _completedLevels = new Dictionary<string, LevelCompletionData>();
            _failureCounts = new Dictionary<string, int>();
            _inputMappings = GetDefaultInputMappings();
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
        public GameSettingsData settings;
        public double totalPlayTimeSeconds;
        public int totalFailures;
        public List<ChoiceLogEntry> choiceLogs;

        public List<string> completedLevelKeys;
        public List<LevelCompletionData> completedLevelValues;

        public List<string> failureCountKeys;
        public List<int> failureCountValues;

        public List<string> inputMappingKeys;
        public List<InputMappingData> inputMappingValues;
    }

    public static class StringKeyValueSerializer
    {
        public static void Serialize<T>(Dictionary<string, T> dict,
            out List<string> keys, out List<T> values)
        {
            keys = new List<string>();
            values = new List<T>();
            if (dict == null) return;
            foreach (var kvp in dict)
            {
                keys.Add(kvp.Key);
                values.Add(kvp.Value);
            }
        }

        public static Dictionary<string, T> Deserialize<T>(List<string> keys, List<T> values)
        {
            var result = new Dictionary<string, T>();
            if (keys == null || values == null) return result;
            int count = Math.Min(keys.Count, values.Count);
            for (int i = 0; i < count; i++)
            {
                result[keys[i]] = values[i];
            }
            return result;
        }

        public static void SerializeInt(Dictionary<string, int> dict,
            out List<string> keys, out List<int> values)
        {
            Serialize(dict, out keys, out values);
        }

        public static Dictionary<string, int> DeserializeInt(List<string> keys, List<int> values)
        {
            return Deserialize(keys, values);
        }
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
}
