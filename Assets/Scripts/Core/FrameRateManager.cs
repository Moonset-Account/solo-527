using System;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class FrameRateManager
    {
        private static FrameRateManager _instance;
        public static FrameRateManager Instance
        {
            get
            {
                if (_instance == null) _instance = new FrameRateManager();
                return _instance;
            }
        }

        private int _targetFrameRate;
        private int _minFrameRate;
        private float _dynamicQualityLevel;
        private bool _vSyncEnabled;
        private Resolution _currentResolution;
        private FrameRateProfile _currentProfile;

        public event Action<int> OnTargetFrameRateChanged;
        public event Action<int> OnQualityLevelChanged;
        public event Action<Resolution> OnResolutionChanged;
        public event Action<FrameRateProfile> OnProfileChanged;

        public int TargetFrameRate => _targetFrameRate;
        public int MinFrameRate => _minFrameRate;
        public FrameRateProfile CurrentProfile => _currentProfile;

        private FrameRateManager()
        {
        }

        public void Initialize(GlobalSettings settings)
        {
            _targetFrameRate = settings.targetFrameRate;
            _minFrameRate = settings.minFrameRate;
            _currentProfile = FrameRateProfile.Balanced;
            ApplySettings();
        }

        public void InitializeFromSave()
        {
            var save = SaveSystem.Instance;
            if (!save.IsPlayerDataLoaded) return;

            var s = save.PlayerData.settings;
            _targetFrameRate = s.targetFrameRate;
            QualitySettings.SetQualityLevel(s.qualityLevel);

            if (s.isFullscreen)
            {
                Screen.SetResolution(s.resolutionWidth, s.resolutionHeight, true);
            }
            ApplySettings();
        }

        private void ApplySettings()
        {
            Application.targetFrameRate = _targetFrameRate;
            QualitySettings.vSyncCount = _vSyncEnabled ? 1 : 0;
            OnTargetFrameRateChanged?.Invoke(_targetFrameRate);
        }

        public void SetTargetFrameRate(int fps)
        {
            _targetFrameRate = Mathf.Clamp(fps, 15, 240);
            ApplySettings();
            SaveSettings();
        }

        public void SetVSync(bool enabled)
        {
            _vSyncEnabled = enabled;
            ApplySettings();
            SaveSettings();
        }

        public void SetQualityLevel(int level)
        {
            level = Mathf.Clamp(level, 0, QualitySettings.names.Length - 1);
            QualitySettings.SetQualityLevel(level, true);
            _dynamicQualityLevel = level;
            OnQualityLevelChanged?.Invoke(level);
            SaveSettings();
        }

        public void SetResolution(int width, int height, bool fullscreen)
        {
            Screen.SetResolution(width, height, fullscreen);
            _currentResolution = Screen.currentResolution;
            _currentResolution.width = width;
            _currentResolution.height = height;
            OnResolutionChanged?.Invoke(_currentResolution);
            SaveSettings();
        }

        public void ApplyProfile(FrameRateProfile profile)
        {
            _currentProfile = profile;
            switch (profile)
            {
                case FrameRateProfile.PowerSaver:
                    SetTargetFrameRate(30);
                    SetQualityLevel(Math.Max(0, QualitySettings.names.Length - 2));
                    break;
                case FrameRateProfile.Balanced:
                    SetTargetFrameRate(60);
                    SetQualityLevel(Mathf.Clamp(QualitySettings.names.Length / 2, 0, QualitySettings.names.Length - 1));
                    break;
                case FrameRateProfile.Performance:
                    SetTargetFrameRate(120);
                    SetQualityLevel(QualitySettings.names.Length - 1);
                    break;
                case FrameRateProfile.MaxQuality:
                    SetTargetFrameRate(Mathf.Max(144, Screen.currentResolution.refreshRate));
                    SetQualityLevel(QualitySettings.names.Length - 1);
                    SetVSync(true);
                    break;
            }
            OnProfileChanged?.Invoke(profile);
        }

        public void DynamicQualityAdjustment(float currentFPS, float avgFPS)
        {
            if (avgFPS < _minFrameRate && _dynamicQualityLevel > 0)
            {
                if (currentFPS < _minFrameRate * 0.8f)
                {
                    int newLevel = Mathf.Max(0, (int)_dynamicQualityLevel - 1);
                    if (newLevel != (int)_dynamicQualityLevel)
                    {
                        SetQualityLevel(newLevel);
                        Debug.Log($"Quality reduced to maintain FPS: {newLevel}");
                    }
                }
            }
            else if (avgFPS > _targetFrameRate * 1.1f && _dynamicQualityLevel < QualitySettings.names.Length - 1)
            {
                int newLevel = Mathf.Min(QualitySettings.names.Length - 1, (int)_dynamicQualityLevel + 1);
                if (newLevel != (int)_dynamicQualityLevel)
                {
                    SetQualityLevel(newLevel);
                }
            }
        }

        private void SaveSettings()
        {
            var save = SaveSystem.Instance;
            if (!save.IsPlayerDataLoaded) return;

            save.PlayerData.settings.targetFrameRate = _targetFrameRate;
            save.PlayerData.settings.qualityLevel = (int)_dynamicQualityLevel;
            save.PlayerData.settings.isFullscreen = Screen.fullScreen;
            save.PlayerData.settings.resolutionWidth = Screen.width;
            save.PlayerData.settings.resolutionHeight = Screen.height;
            save.SavePlayerData();
        }

        public string GetCurrentProfileName()
        {
            switch (_currentProfile)
            {
                case FrameRateProfile.PowerSaver: return "省电模式";
                case FrameRateProfile.Balanced: return "平衡模式";
                case FrameRateProfile.Performance: return "性能模式";
                case FrameRateProfile.MaxQuality: return "最高画质";
                default: return "自定义";
            }
        }
    }

    public enum FrameRateProfile
    {
        Custom,
        PowerSaver,
        Balanced,
        Performance,
        MaxQuality
    }
}
