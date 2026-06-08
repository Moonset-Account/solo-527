using System;
using UnityEngine;

namespace LightShadowPlatformer.Core
{
    [Serializable]
    public class SettingsData
    {
        [Header("Audio")]
        public float masterVolume = 1f;
        public float musicVolume = 0.8f;
        public float sfxVolume = 1f;
        public float uiVolume = 0.9f;

        [Header("Display")]
        public int resolutionIndex = 0;
        public bool fullscreen = true;
        public int qualityLevel = 2;
        public int vsyncCount = 1;

        [Header("Gameplay")]
        public float cameraShakeIntensity = 1f;
        public float screenShakeEnabled = 1f;
        public bool tutorialEnabled = true;

        [Header("Controls")]
        public string moveLeftKey = "A";
        public string moveRightKey = "D";
        public string jumpKey = "Space";
        public string switchLightKey = "E";
        public string interactKey = "F";
        public string pauseKey = "Escape";
    }

    public class SettingsManager : MonoBehaviour
    {
        public static SettingsManager Instance { get; private set; }

        public SettingsData CurrentSettings { get; private set; }

        public event Action<SettingsData> OnSettingsChanged;

        private string _settingsFilePath;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            _settingsFilePath = System.IO.Path.Combine(Application.persistentDataPath, "settings.json");
            LoadSettings();
        }

        private void Start()
        {
            ApplySettings();
        }

        public void LoadSettings()
        {
            CurrentSettings = new SettingsData();

            if (System.IO.File.Exists(_settingsFilePath))
            {
                try
                {
                    string json = System.IO.File.ReadAllText(_settingsFilePath);
                    CurrentSettings = JsonUtility.FromJson<SettingsData>(json);
                }
                catch (Exception e)
                {
                    Debug.LogWarning($"Failed to load settings: {e.Message}");
                    CurrentSettings = new SettingsData();
                }
            }
        }

        public void SaveSettings()
        {
            try
            {
                string json = JsonUtility.ToJson(CurrentSettings, true);
                System.IO.File.WriteAllText(_settingsFilePath, json);
                ApplySettings();
                OnSettingsChanged?.Invoke(CurrentSettings);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save settings: {e.Message}");
            }
        }

        public void ApplySettings()
        {
            if (CurrentSettings == null) return;

            AudioListener.volume = CurrentSettings.masterVolume;
            QualitySettings.SetQualityLevel(CurrentSettings.qualityLevel);
            QualitySettings.vSyncCount = CurrentSettings.vsyncCount;

            if (CurrentSettings.fullscreen)
            {
                Screen.SetResolution(Screen.currentResolution.width, Screen.currentResolution.height, FullScreenMode.FullScreenWindow);
            }
        }

        public void SetMasterVolume(float value)
        {
            CurrentSettings.masterVolume = Mathf.Clamp01(value);
            AudioListener.volume = CurrentSettings.masterVolume;
        }

        public void SetMusicVolume(float value)
        {
            CurrentSettings.musicVolume = Mathf.Clamp01(value);
        }

        public void SetSfxVolume(float value)
        {
            CurrentSettings.sfxVolume = Mathf.Clamp01(value);
        }

        public void SetUIVolume(float value)
        {
            CurrentSettings.uiVolume = Mathf.Clamp01(value);
        }

        public void SetFullscreen(bool value)
        {
            CurrentSettings.fullscreen = value;
        }

        public void SetQualityLevel(int level)
        {
            CurrentSettings.qualityLevel = Mathf.Clamp(level, 0, QualitySettings.names.Length - 1);
        }

        public void ResetToDefaults()
        {
            CurrentSettings = new SettingsData();
            ApplySettings();
            SaveSettings();
        }
    }
}
