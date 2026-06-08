using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ShadowPlatformer.Save
{
    [Serializable]
    public class StringLevelSavePair
    {
        public string key;
        public LevelSaveData value;
    }

    [Serializable]
    public class GameSaveData
    {
        public string currentLevelId;
        public string lastCheckpointId;
        public Vector2 lastCheckpointPosition;
        public List<StringLevelSavePair> levelSaves = new List<StringLevelSavePair>();
        public SettingsData settings = new SettingsData();
        public float totalPlayTime;

        public LevelSaveData GetLevelSave(string levelId)
        {
            var pair = levelSaves.FirstOrDefault(p => p.key == levelId);
            return pair?.value;
        }

        public void SetLevelSave(string levelId, LevelSaveData data)
        {
            var pair = levelSaves.FirstOrDefault(p => p.key == levelId);
            if (pair != null)
                pair.value = data;
            else
                levelSaves.Add(new StringLevelSavePair { key = levelId, value = data });
        }

        public bool HasLevelSave(string levelId)
        {
            return levelSaves.Any(p => p.key == levelId);
        }
    }

    [Serializable]
    public class LevelSaveData
    {
        public string levelId;
        public bool isCompleted;
        public float bestTime;
        public int deathCount;
        public string lastCheckpointId;
    }

    [Serializable]
    public class SettingsData
    {
        public float masterVolume = 1f;
        public float musicVolume = 0.8f;
        public float sfxVolume = 1f;
        public int resolutionWidth = 1920;
        public int resolutionHeight = 1080;
        public bool fullscreen = true;
        public int qualityLevel = 2;
    }

    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        private const string SAVE_KEY = "ShadowPlatformer_Save";
        private GameSaveData _currentSave;

        public GameSaveData CurrentSave => _currentSave;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadGame();
        }

        public void SaveCheckpoint(string checkpointId, Vector2 position)
        {
            _currentSave.lastCheckpointId = checkpointId;
            _currentSave.lastCheckpointPosition = position;
            SaveGame();
        }

        public void SaveLevelCompletion(string levelId, float time, int deaths)
        {
            LevelSaveData ls;
            if (_currentSave.HasLevelSave(levelId))
                ls = _currentSave.GetLevelSave(levelId);
            else
            {
                ls = new LevelSaveData { levelId = levelId };
                _currentSave.SetLevelSave(levelId, ls);
            }

            ls.isCompleted = true;
            ls.lastCheckpointId = null;
            if (time < ls.bestTime || ls.bestTime <= 0f)
                ls.bestTime = time;
            ls.deathCount = deaths;
            SaveGame();
        }

        public void SaveSettings(SettingsData settings)
        {
            _currentSave.settings = settings;
            ApplySettings(settings);
            SaveGame();
        }

        public void SaveGame()
        {
            string json = JsonUtility.ToJson(_currentSave);
            PlayerPrefs.SetString(SAVE_KEY, json);
            PlayerPrefs.Save();
        }

        public void LoadGame()
        {
            if (PlayerPrefs.HasKey(SAVE_KEY))
            {
                string json = PlayerPrefs.GetString(SAVE_KEY);
                _currentSave = JsonUtility.FromJson<GameSaveData>(json);
            }
            else
            {
                _currentSave = new GameSaveData();
            }

            if (_currentSave == null)
                _currentSave = new GameSaveData();
            if (_currentSave.settings == null)
                _currentSave.settings = new SettingsData();
        }

        public void DeleteSave()
        {
            PlayerPrefs.DeleteKey(SAVE_KEY);
            _currentSave = new GameSaveData();
        }

        public void ApplySettings(SettingsData settings)
        {
            Audio.AudioManager.Instance?.SetMasterVolume(settings.masterVolume);
            Audio.AudioManager.Instance?.SetMusicVolume(settings.musicVolume);
            Audio.AudioManager.Instance?.SetSFXVolume(settings.sfxVolume);

            Screen.SetResolution(settings.resolutionWidth, settings.resolutionHeight, settings.fullscreen);
            QualitySettings.SetQualityLevel(settings.qualityLevel, true);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
