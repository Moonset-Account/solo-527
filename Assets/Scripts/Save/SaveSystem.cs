using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;

public class SaveSystem : MonoBehaviour
{
    public static SaveSystem Instance { get; private set; }

    public const int SlotCount = 3;
    public const string CurrentVersion = "1.0";

    private int currentSlotIndex;
    private SaveData currentSaveData;
    private float sessionStartTime;
    private int accumulatedPlayTimeSeconds;

    public int CurrentSlotIndex => currentSlotIndex;
    public SaveData CurrentSaveData => currentSaveData;

    public event System.Action<SaveData> OnSaveCompleted;
    public event System.Action<SaveData> OnLoadCompleted;
    public event System.Action<int> OnSaveDeleted;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
        sessionStartTime = Time.time;
        accumulatedPlayTimeSeconds = 0;
    }

    private void OnEnable()
    {
        GameEvents.SaveRequested += HandleSaveRequested;
        GameEvents.LoadRequested += HandleLoadRequested;
        GameEvents.LevelCompleted += HandleLevelCompleted;
        SceneManager.sceneLoaded += HandleSceneLoaded;
    }

    private void OnDisable()
    {
        GameEvents.SaveRequested -= HandleSaveRequested;
        GameEvents.LoadRequested -= HandleLoadRequested;
        GameEvents.LevelCompleted -= HandleLevelCompleted;
        SceneManager.sceneLoaded -= HandleSceneLoaded;
    }

    private void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus && currentSaveData != null)
            AutoSave();
    }

    private void OnApplicationQuit()
    {
        if (currentSaveData != null)
            AutoSave();
    }

    private void HandleSaveRequested()
    {
        Save();
    }

    private void HandleLoadRequested()
    {
        if (HasSave(currentSlotIndex))
        {
            var data = Load(currentSlotIndex);
            RestoreFromSave(data);
        }
    }

    private void HandleLevelCompleted(string levelId, int totalScore)
    {
        AutoSave();
    }

    private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if (currentSaveData != null)
            AutoSave();
    }

    public void SetCurrentSlot(int slotIndex)
    {
        if (slotIndex < 0 || slotIndex >= SlotCount)
        {
            Debug.LogError($"Invalid slot index: {slotIndex}. Must be 0-{SlotCount - 1}");
            return;
        }
        currentSlotIndex = slotIndex;
    }

    public string GetSaveFilePath(int slotIndex)
    {
        return Path.Combine(Application.persistentDataPath, $"save_slot_{slotIndex}.json");
    }

    private string GetBackupFilePath(int slotIndex)
    {
        return Path.Combine(Application.persistentDataPath, $"save_slot_{slotIndex}.bak");
    }

    public void Save()
    {
        SaveToSlot(currentSlotIndex);
    }

    public void SaveToSlot(int slotIndex)
    {
        if (slotIndex < 0 || slotIndex >= SlotCount) return;

        if (currentSaveData == null)
            currentSaveData = new SaveData();

        CaptureGameState(currentSaveData);
        currentSaveData.version = CurrentVersion;
        currentSaveData.SetSaveTime(DateTime.Now);
        currentSaveData.totalPlayTimeSeconds = accumulatedPlayTimeSeconds + (int)(Time.time - sessionStartTime);

        if (HasSave(slotIndex))
        {
            try
            {
                string sourcePath = GetSaveFilePath(slotIndex);
                string backupPath = GetBackupFilePath(slotIndex);
                File.Copy(sourcePath, backupPath, true);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Backup failed for slot {slotIndex}: {e.Message}");
            }
        }

        try
        {
            string json = JsonUtility.ToJson(currentSaveData, true);
            string filePath = GetSaveFilePath(slotIndex);
            string directory = Path.GetDirectoryName(filePath);
            if (!Directory.Exists(directory))
                Directory.CreateDirectory(directory);
            File.WriteAllText(filePath, json);
            OnSaveCompleted?.Invoke(currentSaveData);
        }
        catch (Exception e)
        {
            Debug.LogError($"Save failed for slot {slotIndex}: {e.Message}");
        }
    }

    public SaveData Load(int slotIndex)
    {
        if (slotIndex < 0 || slotIndex >= SlotCount) return null;

        string filePath = GetSaveFilePath(slotIndex);
        if (!File.Exists(filePath)) return null;

        try
        {
            string json = File.ReadAllText(filePath);
            SaveData data = JsonUtility.FromJson<SaveData>(json);

            if (data != null && data.version != CurrentVersion)
                data = SaveDataMigration(data);

            currentSlotIndex = slotIndex;
            currentSaveData = data;
            accumulatedPlayTimeSeconds = data.totalPlayTimeSeconds;
            sessionStartTime = Time.time;

            OnLoadCompleted?.Invoke(data);
            return data;
        }
        catch (Exception e)
        {
            Debug.LogError($"Load failed for slot {slotIndex}: {e.Message}");

            string backupPath = GetBackupFilePath(slotIndex);
            if (File.Exists(backupPath))
            {
                try
                {
                    string backupJson = File.ReadAllText(backupPath);
                    SaveData data = JsonUtility.FromJson<SaveData>(backupJson);
                    if (data != null)
                    {
                        currentSaveData = data;
                        return data;
                    }
                }
                catch (Exception be)
                {
                    Debug.LogError($"Backup load also failed: {be.Message}");
                }
            }

            return null;
        }
    }

    public void AutoSave()
    {
        if (currentSaveData != null)
            SaveToSlot(currentSlotIndex);
    }

    public void DeleteSave(int slotIndex)
    {
        if (slotIndex < 0 || slotIndex >= SlotCount) return;

        try
        {
            string filePath = GetSaveFilePath(slotIndex);
            if (File.Exists(filePath))
                File.Delete(filePath);

            string backupPath = GetBackupFilePath(slotIndex);
            if (File.Exists(backupPath))
                File.Delete(backupPath);

            if (currentSlotIndex == slotIndex)
                currentSaveData = null;

            OnSaveDeleted?.Invoke(slotIndex);
        }
        catch (Exception e)
        {
            Debug.LogError($"Delete failed for slot {slotIndex}: {e.Message}");
        }
    }

    public bool HasSave(int slotIndex)
    {
        if (slotIndex < 0 || slotIndex >= SlotCount) return false;
        return File.Exists(GetSaveFilePath(slotIndex));
    }

    public SaveSlotPreview GetSaveInfo(int slotIndex)
    {
        if (!HasSave(slotIndex)) return null;

        try
        {
            string json = File.ReadAllText(GetSaveFilePath(slotIndex));
            SaveData data = JsonUtility.FromJson<SaveData>(json);
            if (data == null) return null;

            var preview = new SaveSlotPreview
            {
                saveTime = data.saveTime,
                totalScore = data.profile.totalScore,
                playerName = data.profile.playerName
            };

            if (data.levels != null && data.levels.Length > 0)
            {
                LevelSaveData lastLevel = null;
                for (int i = data.levels.Length - 1; i >= 0; i--)
                {
                    if (data.levels[i].isCompleted)
                    {
                        lastLevel = data.levels[i];
                        break;
                    }
                }
                preview.levelId = lastLevel != null ? lastLevel.levelId : data.levels[0].levelId;
            }

            return preview;
        }
        catch
        {
            return null;
        }
    }

    private void CaptureGameState(SaveData data)
    {
        CaptureLevelState(data);
        CaptureCollectionState(data);
        CaptureSettingsState(data);
    }

    public void CaptureLevelState(SaveData data)
    {
        if (LevelManager.Instance == null || !LevelManager.Instance.IsLevelActive) return;

        string levelId = LevelManager.Instance.CurrentLevelId;
        int totalScore = MissionManager.Instance != null ? MissionManager.Instance.GetTotalScore() : 0;

        UpdateLevelSave(levelId, totalScore, 0, false);
    }

    public void CaptureCollectionState(SaveData data)
    {
        if (CollectionManager.Instance == null) return;

        var unlockedItems = CollectionManager.Instance.GetUnlockedItems();
        foreach (var item in unlockedItems)
        {
            UnlockCollectionItem(item.itemId);
        }
    }

    public void CaptureSettingsState(SaveData data)
    {
        if (AudioTrigger.Instance != null)
        {
            data.settings.musicVolume = 1f;
            data.settings.sfxVolume = 1f;
        }

        if (WeatherSystem.Instance != null)
        {
            data.settings.weatherTimeScale = WeatherSystem.Instance.weatherTimeScale;
        }

        data.settings.qualityLevel = QualitySettings.GetQualityLevel();

        if (InputMapper.Instance != null)
        {
            var bindings = new Dictionary<string, string>();
            string[] actions = new string[] { "Move", "Confirm", "Cancel", "Pause", "Zoom", "Photo", "OpenMap", "OpenSupply", "OpenCollection" };
            foreach (var action in actions)
            {
                KeyCode key = InputMapper.Instance.GetBinding(action);
                if (key != KeyCode.None)
                    bindings[action] = key.ToString();
            }
            SettingsSaveData.SetInputBindingsFromDict(data.settings, bindings);
        }
    }

    public void RestoreFromSave(SaveData data)
    {
        if (data == null) return;

        currentSaveData = data;
        currentSlotIndex = GetCurrentSlotFromData(data);
        accumulatedPlayTimeSeconds = data.totalPlayTimeSeconds;
        sessionStartTime = Time.time;

        RestoreCollectionFromSave(data);
        RestoreSettingsFromSave(data);
    }

    private void RestoreCollectionFromSave(SaveData data)
    {
        if (CollectionManager.Instance == null || data.collection == null) return;

        var unlockedIds = new HashSet<string>(data.collection.unlockedItemIds);
        var viewCounts = new Dictionary<string, int>();
        foreach (var entry in data.collection.entries)
        {
            viewCounts[entry.id] = entry.viewCount;
        }

        CollectionManager.Instance.RestoreFromSave(unlockedIds, viewCounts);
    }

    private void RestoreSettingsFromSave(SaveData data)
    {
        if (data.settings == null) return;

        if (AudioTrigger.Instance != null)
        {
            AudioTrigger.Instance.SetMusicVolume(data.settings.musicVolume);
            AudioTrigger.Instance.SetSFXVolume(data.settings.sfxVolume);
        }

        if (WeatherSystem.Instance != null)
        {
            WeatherSystem.Instance.weatherTimeScale = data.settings.weatherTimeScale;
        }

        QualitySettings.SetQualityLevel(data.settings.qualityLevel, true);

        if (InputMapper.Instance != null)
        {
            var bindings = data.settings.GetInputBindingsDict();
            foreach (var kvp in bindings)
            {
                if (System.Enum.IsDefined(typeof(KeyCode), kvp.Value))
                {
                    InputMapper.Instance.RebindAction(kvp.Key, (KeyCode)System.Enum.Parse(typeof(KeyCode), kvp.Value));
                }
            }
        }
    }

    private int GetCurrentSlotFromData(SaveData data)
    {
        for (int i = 0; i < SlotCount; i++)
        {
            string path = GetSaveFilePath(i);
            if (File.Exists(path))
            {
                try
                {
                    string json = File.ReadAllText(path);
                    if (json.Contains(data.saveTime))
                        return i;
                }
                catch { }
            }
        }
        return currentSlotIndex;
    }

    public void UpdateLevelSave(string levelId, int score, int stars, bool completed)
    {
        if (currentSaveData == null)
            currentSaveData = new SaveData();

        LevelSaveData levelData = null;
        if (currentSaveData.levels != null)
        {
            foreach (var lvl in currentSaveData.levels)
            {
                if (lvl.levelId == levelId)
                {
                    levelData = lvl;
                    break;
                }
            }
        }

        if (levelData == null)
        {
            levelData = new LevelSaveData { levelId = levelId };
            var list = new List<LevelSaveData>(currentSaveData.levels ?? new LevelSaveData[0])
            {
                levelData
            };
            currentSaveData.levels = list.ToArray();
        }

        levelData.attemptCount++;
        if (score > levelData.bestScore)
            levelData.bestScore = score;
        if (stars > levelData.starCount)
            levelData.starCount = Mathf.Clamp(stars, 0, 3);
        if (completed)
            levelData.isCompleted = true;
        levelData.isUnlocked = true;
    }

    public void UnlockCollectionItem(string itemId)
    {
        if (currentSaveData == null)
            currentSaveData = new SaveData();

        if (currentSaveData.collection.unlockedItemIds.Contains(itemId))
            return;

        currentSaveData.collection.unlockedItemIds.Add(itemId);
        currentSaveData.collection.entries.Add(new CollectionEntry
        {
            id = itemId
        });
        currentSaveData.collection.entries[currentSaveData.collection.entries.Count - 1].SetUnlockedTime(DateTime.Now);
    }

    public void IncrementCollectionViewCount(string itemId)
    {
        if (currentSaveData == null) return;

        foreach (var entry in currentSaveData.collection.entries)
        {
            if (entry.id == itemId)
            {
                entry.viewCount++;
                return;
            }
        }
    }

    public void UpdateSettings(float musicVol, float sfxVol, int quality, string lang, bool showWarnings, float weatherTimeScale)
    {
        if (currentSaveData == null)
            currentSaveData = new SaveData();

        currentSaveData.settings.musicVolume = musicVol;
        currentSaveData.settings.sfxVolume = sfxVol;
        currentSaveData.settings.qualityLevel = quality;
        currentSaveData.settings.language = lang;
        currentSaveData.settings.showWeatherWarnings = showWarnings;
        currentSaveData.settings.weatherTimeScale = weatherTimeScale;
    }

    public void UpdatePlayerProfile(string name, int totalScore, int levelsCompleted)
    {
        if (currentSaveData == null)
            currentSaveData = new SaveData();

        currentSaveData.profile.playerName = name;
        currentSaveData.profile.totalScore = totalScore;
        currentSaveData.profile.levelsCompleted = levelsCompleted;

        if (string.IsNullOrEmpty(currentSaveData.profile.firstPlayDate))
            currentSaveData.profile.SetFirstPlayDate(DateTime.Now);
    }

    public SaveData SaveDataMigration(SaveData data)
    {
        if (data == null) return null;

        Version dataVersion;
        Version currentVer;
        if (!Version.TryParse(data.version, out dataVersion))
            dataVersion = new Version(1, 0);
        if (!Version.TryParse(CurrentVersion, out currentVer))
            currentVer = new Version(1, 0);

        if (dataVersion < new Version(1, 1))
            MigrateTo_1_1(data);
        if (dataVersion < new Version(1, 2))
            MigrateTo_1_2(data);

        data.version = CurrentVersion;
        return data;
    }

    private void MigrateTo_1_1(SaveData data)
    {
        if (data.profile == null)
            data.profile = new PlayerProfile();
        if (data.collection == null)
            data.collection = new CollectionSaveData();
    }

    private void MigrateTo_1_2(SaveData data)
    {
        if (data.settings == null)
            data.settings = new SettingsSaveData();
        if (data.settings.inputBindings == null)
            data.settings.inputBindings = new List<StringStringPair>();
    }
}
