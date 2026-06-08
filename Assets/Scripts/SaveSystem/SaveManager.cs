using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;

namespace SpaceCourier.SaveSystem
{
    public class SaveManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.SaveManager;

        private const string SETTINGS_FILE = "settings.json";
        private const string SAVE_FILE_PREFIX = "save_slot_";
        private const string PLAY_RECORD_PREFIX = "playrecord_";
        private const string SAVE_EXTENSION = ".json";

        private DataManager dataManager;
        private SettingsData cachedSettings;

        public event Action<SaveData> OnGameSaved;
        public event Action<SaveData> OnGameLoaded;
        public event Action<SettingsData> OnSettingsSaved;

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            cachedSettings = LoadSettings();
            Debug.Log("[SaveManager] Initialized.");
        }

        private string GetSaveDirectory()
        {
            string dir = Path.Combine(Application.persistentDataPath, "Saves");
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            return dir;
        }

        private string GetRecordsDirectory()
        {
            string dir = Path.Combine(Application.persistentDataPath, "PlayRecords");
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            return dir;
        }

        public SettingsData LoadSettings()
        {
            string path = Path.Combine(Application.persistentDataPath, SETTINGS_FILE);
            try
            {
                if (!File.Exists(path)) return SettingsData.GetDefault();

                string json = File.ReadAllText(path);
                var settings = JsonUtility.FromJson<SettingsData>(json);
                return settings ?? SettingsData.GetDefault();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SaveManager] Failed to load settings: {e.Message}");
                return SettingsData.GetDefault();
            }
        }

        public void SaveSettings(SettingsData settings)
        {
            if (settings == null) return;
            cachedSettings = settings;

            try
            {
                string path = Path.Combine(Application.persistentDataPath, SETTINGS_FILE);
                string json = JsonUtility.ToJson(settings, true);
                File.WriteAllText(path, json);
                OnSettingsSaved?.Invoke(settings);
                Debug.Log($"[SaveManager] Settings saved to {path}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Failed to save settings: {e.Message}");
            }
        }

        public SettingsData GetCachedSettings() => cachedSettings;

        public bool SaveGame(int slot = 0)
        {
            if (dataManager?.RuntimeData == null || dataManager.CurrentLevel == null)
            {
                Debug.LogWarning("[SaveManager] No game data to save.");
                return false;
            }

            try
            {
                var saveData = new SaveData
                {
                    SaveSlot = slot,
                    SaveTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    LevelId = dataManager.CurrentLevel.LevelId
                };
                saveData.FromRuntimeData(dataManager.RuntimeData);

                string path = GetSavePath(slot);
                string json = JsonUtility.ToJson(saveData, true);
                File.WriteAllText(path, json);
                OnGameSaved?.Invoke(saveData);
                Debug.Log($"[SaveManager] Game saved to {path}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Save failed: {e.Message}");
                return false;
            }
        }

        public bool LoadGame(int slot = 0)
        {
            string path = GetSavePath(slot);
            if (!File.Exists(path))
            {
                Debug.LogWarning($"[SaveManager] Save slot {slot} not found.");
                return false;
            }

            try
            {
                string json = File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<SaveData>(json);
                if (saveData == null) return false;

                if (!dataManager.LoadLevel(saveData.LevelId))
                {
                    Debug.LogError($"[SaveManager] Failed to load level {saveData.LevelId}");
                    return false;
                }

                var runtime = saveData.ToRuntimeData();
                dataManager.SetRuntimeData(runtime);

                OnGameLoaded?.Invoke(saveData);
                Debug.Log($"[SaveManager] Game loaded from slot {slot}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Load failed: {e.Message}");
                return false;
            }
        }

        public bool HasSavedGame(int slot = 0)
        {
            return File.Exists(GetSavePath(slot));
        }

        public string GetSavePath(int slot)
        {
            return Path.Combine(GetSaveDirectory(), $"{SAVE_FILE_PREFIX}{slot}{SAVE_EXTENSION}");
        }

        public SaveData GetSaveInfo(int slot = 0)
        {
            string path = GetSavePath(slot);
            if (!File.Exists(path)) return null;

            try
            {
                string json = File.ReadAllText(path);
                return JsonUtility.FromJson<SaveData>(json);
            }
            catch
            {
                return null;
            }
        }

        public void DeleteSave(int slot = 0)
        {
            string path = GetSavePath(slot);
            if (File.Exists(path))
            {
                File.Delete(path);
                Debug.Log($"[SaveManager] Deleted save slot {slot}");
            }
        }

        public void DeleteAllSaves()
        {
            string dir = GetSaveDirectory();
            if (Directory.Exists(dir))
            {
                Directory.Delete(dir, true);
                Directory.CreateDirectory(dir);
            }

            string settingsPath = Path.Combine(Application.persistentDataPath, SETTINGS_FILE);
            if (File.Exists(settingsPath)) File.Delete(settingsPath);

            cachedSettings = SettingsData.GetDefault();
            Debug.Log("[SaveManager] All saves deleted.");
        }

        public string SerializeRuntimeData()
        {
            if (dataManager?.RuntimeData == null) return null;
            var wrapper = new { runtime = dataManager.RuntimeData };
            return JsonUtility.ToJson(dataManager.RuntimeData, true);
        }

        public T DeserializeJSON<T>(string json) where T : class
        {
            try
            {
                return JsonUtility.FromJson<T>(json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Deserialize error: {e.Message}");
                return null;
            }
        }

        public void Shutdown()
        {
            if (dataManager != null && dataManager.RuntimeData != null)
            {
                SaveGame(0);
            }
            Debug.Log("[SaveManager] Shutdown.");
        }
    }
}
