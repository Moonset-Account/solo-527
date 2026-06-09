using BeatRunner.Core;
using UnityEngine;

namespace BeatRunner.Diagnostics
{
    public class FrameRateAdaptor : MonoBehaviour
    {
        public static FrameRateAdaptor Instance { get; private set; }

        [Header("Strategy")]
        [SerializeField] private bool _enableAdaptation = true;
        [SerializeField] private float _monitorInterval = 2f;
        [SerializeField] private float _fpsDropThreshold = 0.85f;
        [SerializeField] private int _minFramerate = 30;

        [Header("Quality Tiers")]
        [SerializeField] private int[] _tierFrameRates = { 30, 60, 120, 144 };
        [SerializeField] private int[] _tierQualityLevels = { 0, 1, 2, 3 };

        [Header("Diagnostics")]
        [SerializeField] private int _currentTier;
        [SerializeField] private float _averagedFps;

        private float _monitorTimer;
        private float _fpsAccumulator;
        private int _fpsSampleCount;
        private PerformanceStats _stats;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            if (SaveSystem.CurrentSave != null && SaveSystem.CurrentSave.targetFrameRate > 0)
            {
                Application.targetFrameRate = SaveSystem.CurrentSave.targetFrameRate;
                SelectTierForFrameRate(SaveSystem.CurrentSave.targetFrameRate);
            }
            else
            {
                SelectTierForFrameRate(60);
            }
        }

        private void Update()
        {
            if (!_enableAdaptation) return;

            _monitorTimer += Time.unscaledDeltaTime;
            _fpsAccumulator += 1f / Mathf.Max(0.001f, Time.unscaledDeltaTime);
            _fpsSampleCount++;

            if (_monitorTimer >= _monitorInterval)
            {
                _averagedFps = _fpsAccumulator / Mathf.Max(1, _fpsSampleCount);
                CheckAdaptation();

                _monitorTimer = 0f;
                _fpsAccumulator = 0f;
                _fpsSampleCount = 0;
            }
        }

        private void SelectTierForFrameRate(int targetFps)
        {
            int bestTier = 0;
            for (int i = 0; i < _tierFrameRates.Length; i++)
            {
                if (_tierFrameRates[i] <= targetFps) bestTier = i;
                else break;
            }
            SetTier(bestTier);
        }

        private void CheckAdaptation()
        {
            if (_currentTier < 0 || _currentTier >= _tierFrameRates.Length) return;

            int targetFps = _tierFrameRates[_currentTier];
            float expectedAverage = targetFps * _fpsDropThreshold;

            if (_averagedFps < expectedAverage && _currentTier > 0)
            {
                SetTier(_currentTier - 1);
            }
            else if (_averagedFps >= targetFps * 0.98f &&
                     _currentTier < _tierFrameRates.Length - 1)
            {
                int maxTierAllowed = Mathf.Clamp(SaveSystem.CurrentSave != null
                    ? SaveSystem.CurrentSave.targetFrameRate : 60, _minFramerate, 144);
                int highestAllowedTier = 0;
                for (int i = 0; i < _tierFrameRates.Length; i++)
                {
                    if (_tierFrameRates[i] <= maxTierAllowed) highestAllowedTier = i;
                    else break;
                }

                if (_currentTier < highestAllowedTier)
                {
                    SetTier(_currentTier + 1);
                }
            }
        }

        public void SetTier(int tier)
        {
            _currentTier = Mathf.Clamp(tier, 0, _tierFrameRates.Length - 1);
            int targetFps = _tierFrameRates[_currentTier];
            int quality = _tierQualityLevels[Mathf.Clamp(tier, 0, _tierQualityLevels.Length - 1)];

            Application.targetFrameRate = targetFps;
            QualitySettings.SetQualityLevel(quality, true);

            Debug.Log($"Adaptation: set tier {_currentTier} -> {targetFps} FPS, quality {quality}");
        }

        public void ForceFrameRate(int fps)
        {
            fps = Mathf.Clamp(fps, _minFramerate, 144);
            Application.targetFrameRate = fps;
            SelectTierForFrameRate(fps);
            SaveSystem.CurrentSave.targetFrameRate = fps;
            SaveSystem.SaveSaveData();
        }
    }
}
