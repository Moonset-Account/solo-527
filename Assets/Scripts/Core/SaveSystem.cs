using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;
using YouthTrainingManagement.InputSystem;
using YouthTrainingManagement.Models;
using YouthTrainingManagement.Utils;

namespace YouthTrainingManagement.Core
{
    [Serializable]
    public class GameSaveData
    {
        public string Version;
        public long Timestamp;
        public PlayerModel[] Players;
        public SeasonModel Season;
        public FinanceModel Finance;
        public GameStats Stats;
        public int TutorialStep;
        public string Checksum;
    }

    [Serializable]
    public class GameSettings
    {
        public int TargetFrameRate = 60;
        public int TargetFramerate { get => TargetFrameRate; set => TargetFrameRate = value; }
        public float MasterVolume = 1f;
        public float MusicVolume = 0.7f;
        public float SFXVolume = 0.8f;
        public float SfxVolume { get => SFXVolume; set => SFXVolume = value; }
        public float UIVolume = 1f;
        public float UiVolume { get => UIVolume; set => UIVolume = value; }
        public bool ShowTutorialOnFirstLaunch = true;
        public bool CompletedTutorial = false;
        public bool HasSeenTutorial { get => CompletedTutorial; set => CompletedTutorial = value; }
        public bool ShowFPSCounter = true;
        public bool ShowPerformanceStats { get => ShowFPSCounter; set => ShowFPSCounter = value; }
        public bool VSyncEnabled = true;
        public bool VSync { get => VSyncEnabled; set => VSyncEnabled = value; }
        public float AnimationSpeed = 1f;
        public float UiAnimationSpeed { get => AnimationSpeed; set => AnimationSpeed = value; }
        public float ScreenShakeIntensity = 0.5f;
        public int QualityLevel = 2;
        public string Language = "en";
        public InputBindings SavedInputBindings = new InputBindings();

        [NonSerialized] private Dictionary<GameAction, KeyBinding> _bindingsCache;
        public Dictionary<GameAction, KeyBinding> InputBindings
        {
            get
            {
                if (_bindingsCache != null) return _bindingsCache;
                _bindingsCache = new Dictionary<GameAction, KeyBinding>();
                if (SavedInputBindings?.Bindings != null)
                {
                    foreach (var b in SavedInputBindings.Bindings)
                    {
                        if (Enum.TryParse<GameAction>(b.ActionId, true, out var ga) ||
                            !string.IsNullOrEmpty(b.ActionId) && b.ActionId.Length > 2 &&
                            Enum.TryParse<GameAction>(System.Threading.Thread.CurrentThread.CurrentCulture.TextInfo.ToTitleCase(b.ActionId.Replace("_","")), true, out ga))
                        {
                            _bindingsCache[ga] = new KeyBinding { PrimaryKey = b.PrimaryKey, SecondaryKey = b.SecondaryKey };
                        }
                    }
                }
                if (_bindingsCache.Count == 0)
                    _bindingsCache = InputManager.GetDefaultBindings();
                return _bindingsCache;
            }
            set
            {
                _bindingsCache = value;
                if (value == null) return;
                SavedInputBindings ??= new InputBindings();
                SavedInputBindings.Bindings.Clear();
                foreach (var kvp in value)
                {
                    SavedInputBindings.Bindings.Add(new InputBinding
                    {
                        ActionId = kvp.Key.ToString(),
                        DisplayName = kvp.Key.ToString(),
                        PrimaryKey = kvp.Value.PrimaryKey,
                        SecondaryKey = kvp.Value.SecondaryKey,
                        CanBeRemapped = true,
                        Category = "General"
                    });
                }
            }
        }

        public GameSettings Clone()
        {
            var clone = (GameSettings)MemberwiseClone();
            clone.SavedInputBindings = new InputBindings();
            clone._bindingsCache = new Dictionary<GameAction, KeyBinding>();
            if (SavedInputBindings?.Bindings != null)
                foreach (var b in SavedInputBindings.Bindings)
                    clone.SavedInputBindings.Bindings.Add(new InputBinding
                    {
                        ActionId = b.ActionId, DisplayName = b.DisplayName,
                        PrimaryKey = b.PrimaryKey, SecondaryKey = b.SecondaryKey,
                        CanBeRemapped = b.CanBeRemapped, Category = b.Category
                    });
            foreach (var kvp in InputBindings)
                clone._bindingsCache[kvp.Key] = kvp.Value;
            return clone;
        }
    }

    public class SaveSystem
    {
        private readonly GameManager _gameManager;
        private readonly string _saveFilePath;
        private readonly string _settingsFilePath;
        private const string SaveFileName = "gamesave.json";
        private const string SettingsFileName = "settings.json";
        private const string EncryptionKey = "YouthTraining2024!SecureKey";

        public bool IsInitialized { get; private set; }

        public SaveSystem(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
            _saveFilePath = Path.Combine(Application.persistentDataPath, SaveFileName);
            _settingsFilePath = Path.Combine(Application.persistentDataPath, SettingsFileName);
        }

        public void Initialize()
        {
            try
            {
                EnsureDirectoryExists();
                LoadSettings();
                IsInitialized = true;
                Debug.Log($"SaveSystem initialized. Save path: {_saveFilePath}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to initialize SaveSystem: {ex.Message}");
                IsInitialized = false;
            }
        }

        public bool HasSaveData()
        {
            return File.Exists(_saveFilePath);
        }

        public void SaveAll()
        {
            try
            {
                var saveData = CreateSaveData();
                var json = JsonUtility.ToJson(saveData, true);
                var encrypted = Encrypt(json);
                File.WriteAllText(_saveFilePath, encrypted);
                SaveSettings();
                Debug.Log("Game saved successfully.");
                _gameManager.FeedbackSystem.ShowFeedback("Game Saved", FeedbackType.Info);
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to save game: {ex.Message}");
                _gameManager.FeedbackSystem.ShowFeedback("Failed to save game", FeedbackType.Error);
            }
        }

        public bool LoadAll()
        {
            try
            {
                if (!HasSaveData())
                {
                    Debug.LogWarning("No save data found.");
                    return false;
                }

                var encrypted = File.ReadAllText(_saveFilePath);
                var json = Decrypt(encrypted);
                var saveData = JsonUtility.FromJson<GameSaveData>(json);

                if (!ValidateChecksum(saveData))
                {
                    Debug.LogError("Save data checksum validation failed. Save file may be corrupted.");
                    return false;
                }

                ApplySaveData(saveData);
                Debug.Log("Game loaded successfully.");
                _gameManager.FeedbackSystem.ShowFeedback("Game Loaded", FeedbackType.Success);
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to load game: {ex.Message}");
                _gameManager.FeedbackSystem.ShowFeedback("Failed to load game", FeedbackType.Error);
                return false;
            }
        }

        public void SaveSettings()
        {
            try
            {
                var json = JsonUtility.ToJson(_gameManager.Settings, true);
                File.WriteAllText(_settingsFilePath, json);
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to save settings: {ex.Message}");
            }
        }

        public void LoadSettings()
        {
            try
            {
                if (File.Exists(_settingsFilePath))
                {
                    var json = File.ReadAllText(_settingsFilePath);
                    var settings = JsonUtility.FromJson<GameSettings>(json);
                    if (settings != null)
                    {
                        _gameManager.ApplySettings(settings);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to load settings: {ex.Message}");
            }
        }

        public void DeleteSave()
        {
            try
            {
                if (File.Exists(_saveFilePath))
                {
                    File.Delete(_saveFilePath);
                    Debug.Log("Save file deleted.");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to delete save: {ex.Message}");
            }
        }

        private GameSaveData CreateSaveData()
        {
            var players = _gameManager.PlayerSystem.GetAllPlayers();
            var saveData = new GameSaveData
            {
                Version = Application.version,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                Players = players.ToArray(),
                Season = _gameManager.Season,
                Finance = _gameManager.Finance,
                Stats = _gameManager.Stats,
                TutorialStep = 0
            };
            saveData.Checksum = CalculateChecksum(saveData);
            return saveData;
        }

        private void ApplySaveData(GameSaveData saveData)
        {
            if (saveData.Players != null)
            {
                _gameManager.PlayerSystem.InitializePlayers(saveData.Players);
            }
            if (saveData.Season != null)
            {
                _gameManager.Season = saveData.Season;
            }
            if (saveData.Finance != null)
            {
                _gameManager.Finance = saveData.Finance;
            }
            if (saveData.Stats != null)
            {
                _gameManager.Stats = saveData.Stats;
            }
        }

        private string CalculateChecksum(GameSaveData data)
        {
            var dataForChecksum = new StringBuilder()
                .Append(data.Version)
                .Append(data.Timestamp)
                .Append(JsonUtility.ToJson(data.Players))
                .Append(JsonUtility.ToJson(data.Season))
                .Append(JsonUtility.ToJson(data.Finance))
                .ToString();

            using (var sha256 = SHA256.Create())
            {
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(dataForChecksum));
                return Convert.ToBase64String(bytes);
            }
        }

        private bool ValidateChecksum(GameSaveData data)
        {
            var storedChecksum = data.Checksum;
            data.Checksum = null;
            var calculatedChecksum = CalculateChecksum(data);
            return storedChecksum == calculatedChecksum;
        }

        private string Encrypt(string plainText)
        {
            using (var aes = Aes.Create())
            {
                var key = new Rfc2898DeriveBytes(EncryptionKey, Encoding.UTF8.GetBytes("SaltValue123"));
                aes.Key = key.GetBytes(32);
                aes.IV = key.GetBytes(16);

                using (var encryptor = aes.CreateEncryptor())
                using (var ms = new MemoryStream())
                {
                    using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    using (var sw = new StreamWriter(cs))
                    {
                        sw.Write(plainText);
                    }
                    return Convert.ToBase64String(ms.ToArray());
                }
            }
        }

        private string Decrypt(string cipherText)
        {
            using (var aes = Aes.Create())
            {
                var key = new Rfc2898DeriveBytes(EncryptionKey, Encoding.UTF8.GetBytes("SaltValue123"));
                aes.Key = key.GetBytes(32);
                aes.IV = key.GetBytes(16);

                using (var decryptor = aes.CreateDecryptor())
                using (var ms = new MemoryStream(Convert.FromBase64String(cipherText)))
                using (var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                using (var sr = new StreamReader(cs))
                {
                    return sr.ReadToEnd();
                }
            }
        }

        private void EnsureDirectoryExists()
        {
            var dir = Path.GetDirectoryName(_saveFilePath);
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
        }
    }
}
