using System.Collections.Generic;
using UnityEngine;
using Kitchen.Save;

namespace Kitchen.Performance
{
    public class FrameRateAdapter : MonoBehaviour
    {
        public static FrameRateAdapter Instance { get; private set; }

        [Header("Auto-Adapt Settings")]
        public bool enableAutoAdapt = true;
        [Range(5, 120)] public int targetFramerate = 60;
        [Range(5, 120)] public int minFramerate = 30;
        [Range(5, 120)] public int maxFramerate = 120;
        [Range(1, 60)] public float adaptCheckInterval = 5f;
        [Range(0.1f, 0.9f)] public float minFPSPercentileThreshold = 0.85f;
        [Range(0, 5)] public int qualityStepUpDown = 1;

        [Header("Battery & Thermal")]
        public bool respectBatteryLevel = true;
        [Range(0.1f, 0.8f)] public float lowBatteryThreshold = 0.2f;
        public int batterySaverTargetFPS = 30;
        public bool pauseOnBackground = true;

        [Header("Debug")]
        [SerializeField] private int currentQualityLevel;
        [SerializeField] private bool isAdaptationRunning;
        [SerializeField] private float adaptTimer;
        [SerializeField] private List<float> adaptationLog = new List<float>();

        public int CurrentQualityLevel => currentQualityLevel;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Start()
        {
            ApplySettingsFromSave();
            currentQualityLevel = QualitySettings.GetQualityLevel();
        }

        private void Update()
        {
            if (!enableAutoAdapt || !isAdaptationRunning) return;

            adaptTimer += Time.unscaledDeltaTime;
            if (adaptTimer >= adaptCheckInterval)
            {
                CheckAndAdapt();
                adaptTimer = 0f;
            }
        }

        private void OnApplicationPause(bool pause)
        {
            if (pauseOnBackground && pause)
            {
                Application.targetFrameRate = Mathf.Min(Application.targetFrameRate, 15);
            }
            else if (!pause)
            {
                ApplySettingsFromSave();
            }
        }

        public void ApplySettingsFromSave()
        {
            SettingsSaveData s = SaveManager.Instance?.GetSettings();
            if (s == null)
            {
                Application.targetFrameRate = targetFramerate;
                QualitySettings.vSyncCount = 1;
                return;
            }

            Application.targetFrameRate = s.targetFrameRate;
            QualitySettings.vSyncCount = s.vsyncEnabled ? 1 : 0;
            targetFramerate = s.targetFrameRate;

            switch (s.fullscreenMode)
            {
                case FullScreenMode.ExclusiveFullScreen:
                    Screen.fullScreenMode = UnityEngine.FullScreenMode.ExclusiveFullScreen;
                    break;
                case FullScreenMode.FullScreenWindow:
                    Screen.fullScreenMode = UnityEngine.FullScreenMode.FullScreenWindow;
                    break;
                case FullScreenMode.MaximizedWindow:
                    Screen.fullScreenMode = UnityEngine.FullScreenMode.MaximizedWindow;
                    break;
                case FullScreenMode.Windowed:
                    Screen.fullScreenMode = UnityEngine.FullScreenMode.Windowed;
                    break;
            }

            if (s.resolutionWidth > 0 && s.resolutionHeight > 0)
            {
                Screen.SetResolution(s.resolutionWidth, s.resolutionHeight, Screen.fullScreenMode);
            }
        }

        public void SetTargetFramerate(int fps)
        {
            targetFramerate = Mathf.Clamp(fps, minFramerate, maxFramerate);
            Application.targetFrameRate = targetFramerate;
            if (SaveManager.Instance != null)
            {
                SettingsSaveData s = SaveManager.Instance.GetSettings();
                s.targetFrameRate = targetFramerate;
                SaveManager.Instance.UpdateSettings(s);
            }
        }

        public void SetQualityLevel(int level)
        {
            currentQualityLevel = Mathf.Clamp(level, 0, QualitySettings.names.Length - 1);
            QualitySettings.SetQualityLevel(currentQualityLevel, true);
        }

        public void StartAdaptation()
        {
            isAdaptationRunning = true;
            adaptTimer = 0f;
            PerformanceStats.Instance?.ResetStats();
        }

        public void StopAdaptation()
        {
            isAdaptationRunning = false;
        }

        private void CheckAndAdapt()
        {
            if (PerformanceStats.Instance == null) return;

            float p95 = PerformanceStats.Instance.averageFPS;
            float targetPercent = p95 / (float)targetFramerate;

            adaptationLog.Add(p95);
            if (adaptationLog.Count > 60) adaptationLog.RemoveAt(0);

            if (respectBatteryLevel && IsLowBattery())
            {
                if (Application.targetFrameRate != batterySaverTargetFPS)
                    SetTargetFramerate(batterySaverTargetFPS);
                return;
            }

            if (targetPercent < minFPSPercentileThreshold && currentQualityLevel > 0)
            {
                SetQualityLevel(currentQualityLevel - qualityStepUpDown);
                Debug.Log($"[FrameRateAdapter] Dropping quality to {currentQualityLevel} (FPS: {p95:F1})");
            }
            else if (targetPercent > 1.05f && currentQualityLevel < QualitySettings.names.Length - 1)
            {
                SetQualityLevel(currentQualityLevel + qualityStepUpDown);
                Debug.Log($"[FrameRateAdapter] Raising quality to {currentQualityLevel} (FPS: {p95:F1})");
            }
        }

        private bool IsLowBattery()
        {
            try
            {
                if (SystemInfo.batteryStatus != BatteryStatus.Charging &&
                    SystemInfo.batteryStatus != BatteryStatus.Full &&
                    SystemInfo.batteryLevel >= 0 &&
                    SystemInfo.batteryLevel <= lowBatteryThreshold)
                {
                    return true;
                }
            }
            catch { }
            return false;
        }

        public string[] GetQualityLevelNames()
        {
            return QualitySettings.names;
        }
    }
}
