using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace DecorMatch3.Data
{
    [Serializable]
    public class PlayerProgress
    {
        public int PlayerLevel = 1;
        public int TotalXP = 0;
        public int Coins = 500;
        public int HighestUnlockedLevel = 1;
        public List<int> CompletedLevels = new List<int>();
        public List<MaterialItem> PlayerMaterials = new List<MaterialItem>();
        public List<int> CompletedOrders = new List<int>();
        public int TotalScore = 0;
        public bool TutorialCompleted = false;
        public DateTime LastSaveTime;
    }

    [Serializable]
    public class AudioSettings
    {
        [Range(0, 1)] public float MasterVolume = 1f;
        [Range(0, 1)] public float MusicVolume = 0.7f;
        [Range(0, 1)] public float SFXVolume = 1f;
        public bool MusicMuted = false;
        public bool SFXMuted = false;
    }

    [Serializable]
    public class GameSettings
    {
        public AudioSettings Audio = new AudioSettings();
        public bool Fullscreen = true;
        public int QualityLevel = 2;
        public bool ShowTutorials = true;
        public bool VibrationEnabled = true;
        public bool AutoSaveEnabled = true;
        public string Language = "zh-CN";
    }

    [Serializable]
    public class SaveData
    {
        public PlayerProgress Progress = new PlayerProgress();
        public GameSettings Settings = new GameSettings();
        public string SaveVersion = "1.0.0";
    }

    public class SaveManager : DecorMatch3.Core.Singleton<SaveManager>
    {
        private const string SaveFileName = "decormatch3_save.json";
        private const string PlayerPrefsKey = "DecorMatch3_SaveData";
        private const string SettingsKey = "DecorMatch3_Settings";

        public SaveData CurrentSave { get; private set; } = new SaveData();

        public event Action OnSaveLoaded;
        public event Action OnSaveCompleted;
        public event Action OnSettingsChanged;

        private string SaveFilePath => Path.Combine(Application.persistentDataPath, SaveFileName);

        protected override void Awake()
        {
            base.Awake();
            LoadOrCreateSave();
        }

        private void LoadOrCreateSave()
        {
            if (!LoadFromPlayerPrefs())
            {
                if (!LoadFromFile())
                {
                    CreateNewSave();
                }
            }

            CurrentSave.Progress.LastSaveTime = DateTime.Now;
            OnSaveLoaded?.Invoke();
        }

        public void CreateNewSave()
        {
            CurrentSave = new SaveData
            {
                Progress = new PlayerProgress
                {
                    PlayerMaterials = InitializeDefaultMaterials()
                },
                Settings = new GameSettings()
            };

            SaveToPlayerPrefs();
            Debug.Log("[SaveManager] Created new save file.");
        }

        private List<MaterialItem> InitializeDefaultMaterials()
        {
            return new List<MaterialItem>
            {
                new MaterialItem { MaterialType = MaterialType.Paint, CurrentAmount = 50 },
                new MaterialItem { MaterialType = MaterialType.Fabric, CurrentAmount = 30 },
                new MaterialItem { MaterialType = MaterialType.Wood, CurrentAmount = 20 },
                new MaterialItem { MaterialType = MaterialType.Metal, CurrentAmount = 15 },
                new MaterialItem { MaterialType = MaterialType.Tile, CurrentAmount = 25 },
                new MaterialItem { MaterialType = MaterialType.Wallpaper, CurrentAmount = 10 }
            };
        }

        private bool LoadFromPlayerPrefs()
        {
            if (PlayerPrefs.HasKey(PlayerPrefsKey))
            {
                try
                {
                    string json = PlayerPrefs.GetString(PlayerPrefsKey);
                    CurrentSave = JsonUtility.FromJson<SaveData>(json);
                    if (CurrentSave != null)
                    {
                        return true;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[SaveManager] Failed to load from PlayerPrefs: {e.Message}");
                }
            }
            return false;
        }

        private bool LoadFromFile()
        {
            if (File.Exists(SaveFilePath))
            {
                try
                {
                    string json = File.ReadAllText(SaveFilePath);
                    CurrentSave = JsonUtility.FromJson<SaveData>(json);
                    if (CurrentSave != null)
                    {
                        SaveToPlayerPrefs();
                        return true;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[SaveManager] Failed to load from file: {e.Message}");
                }
            }
            return false;
        }

        public void SaveGame(bool forceFileSave = false)
        {
            CurrentSave.Progress.LastSaveTime = DateTime.Now;
            SaveToPlayerPrefs();

            if (forceFileSave || CurrentSave.Settings.AutoSaveEnabled)
            {
                SaveToFile();
            }

            OnSaveCompleted?.Invoke();
        }

        private void SaveToPlayerPrefs()
        {
            try
            {
                string json = JsonUtility.ToJson(CurrentSave, true);
                PlayerPrefs.SetString(PlayerPrefsKey, json);
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Failed to save to PlayerPrefs: {e.Message}");
            }
        }

        private void SaveToFile()
        {
            try
            {
                string json = JsonUtility.ToJson(CurrentSave, true);
                File.WriteAllText(SaveFilePath, json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Failed to save to file: {e.Message}");
            }
        }

        public void UpdateSettings(GameSettings newSettings)
        {
            CurrentSave.Settings = newSettings;
            SaveSettingsToPlayerPrefs();
            OnSettingsChanged?.Invoke();
            DecorMatch3.Core.EventBus.Publish(new SettingsChangedEvent { Settings = newSettings });
        }

        private void SaveSettingsToPlayerPrefs()
        {
            try
            {
                string json = JsonUtility.ToJson(CurrentSave.Settings, true);
                PlayerPrefs.SetString(SettingsKey, json);
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Failed to save settings: {e.Message}");
            }
        }

        public void LoadSettings()
        {
            if (PlayerPrefs.HasKey(SettingsKey))
            {
                try
                {
                    string json = PlayerPrefs.GetString(SettingsKey);
                    CurrentSave.Settings = JsonUtility.FromJson<GameSettings>(json);
                }
                catch (Exception e)
                {
                    Debug.LogError($"[SaveManager] Failed to load settings: {e.Message}");
                }
            }
        }

        public int GetMaterialAmount(MaterialType type)
        {
            MaterialItem item = CurrentSave.Progress.PlayerMaterials.Find(m => m.MaterialType == type);
            return item?.CurrentAmount ?? 0;
        }

        public bool AddMaterial(MaterialType type, int amount)
        {
            MaterialItem item = CurrentSave.Progress.PlayerMaterials.Find(m => m.MaterialType == type);
            if (item == null)
            {
                item = new MaterialItem { MaterialType = type, CurrentAmount = 0 };
                CurrentSave.Progress.PlayerMaterials.Add(item);
            }

            item.CurrentAmount = Mathf.Min(item.CurrentAmount + amount, item.MaxStorage);
            return true;
        }

        public bool ConsumeMaterial(MaterialType type, int amount)
        {
            MaterialItem item = CurrentSave.Progress.PlayerMaterials.Find(m => m.MaterialType == type);
            if (item == null || item.CurrentAmount < amount)
            {
                return false;
            }

            item.CurrentAmount -= amount;
            return true;
        }

        public bool AddCoins(int amount)
        {
            if (amount < 0) return false;
            CurrentSave.Progress.Coins += amount;
            return true;
        }

        public bool SpendCoins(int amount)
        {
            if (CurrentSave.Progress.Coins < amount) return false;
            CurrentSave.Progress.Coins -= amount;
            return true;
        }

        public void AddXP(int amount)
        {
            CurrentSave.Progress.TotalXP += amount;
            int xpNeeded = CurrentSave.Progress.PlayerLevel * 1000;
            while (CurrentSave.Progress.TotalXP >= xpNeeded)
            {
                CurrentSave.Progress.TotalXP -= xpNeeded;
                CurrentSave.Progress.PlayerLevel++;
                xpNeeded = CurrentSave.Progress.PlayerLevel * 1000;
            }
        }

        public void CompleteLevel(int levelId)
        {
            if (!CurrentSave.Progress.CompletedLevels.Contains(levelId))
            {
                CurrentSave.Progress.CompletedLevels.Add(levelId);
            }
            CurrentSave.Progress.HighestUnlockedLevel = Mathf.Max(
                CurrentSave.Progress.HighestUnlockedLevel,
                levelId + 1
            );
        }

        public void CompleteOrder(int orderId)
        {
            if (!CurrentSave.Progress.CompletedOrders.Contains(orderId))
            {
                CurrentSave.Progress.CompletedOrders.Add(orderId);
            }
        }

        public void ResetProgress()
        {
            PlayerPrefs.DeleteKey(PlayerPrefsKey);
            PlayerPrefs.DeleteKey(SettingsKey);
            if (File.Exists(SaveFilePath))
            {
                File.Delete(SaveFilePath);
            }
            CreateNewSave();
            OnSaveLoaded?.Invoke();
        }

        public void MarkTutorialCompleted()
        {
            CurrentSave.Progress.TutorialCompleted = true;
        }
    }

    public struct SettingsChangedEvent
    {
        public GameSettings Settings;
    }
}
