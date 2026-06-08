using UnityEngine;

namespace DecorMatch3
{
    public class PerformanceMonitor : MonoBehaviour
    {
        public static PerformanceMonitor Instance { get; private set; }

        public float CurrentFPS { get; private set; }
        public float AverageFPS { get; private set; }
        public long MemoryUsage => System.GC.GetTotalMemory(false);
        public int TargetFrameRate { get; set; }

        private float _fpsAccumulator;
        private int _fpsFrames;
        private float _fpsUpdateInterval = 1f;
        private float _fpsTimer;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void Init()
        {
            TargetFrameRate = 60;
            Application.targetFrameRate = TargetFrameRate;
        }

        private void Update()
        {
            float instantFPS = Time.unscaledDeltaTime > 0f ? 1f / Time.unscaledDeltaTime : 0f;
            CurrentFPS = instantFPS;

            _fpsAccumulator += instantFPS;
            _fpsFrames++;
            _fpsTimer += Time.unscaledDeltaTime;

            if (_fpsTimer >= _fpsUpdateInterval)
            {
                AverageFPS = _fpsAccumulator / _fpsFrames;
                _fpsAccumulator = 0f;
                _fpsFrames = 0;
                _fpsTimer -= _fpsUpdateInterval;
            }
        }

        public void AdaptFrameRate()
        {
            if (AverageFPS < 30f && TargetFrameRate > 30)
            {
                TargetFrameRate = Mathf.Max(30, TargetFrameRate - 10);
                Application.targetFrameRate = TargetFrameRate;
            }
            else if (AverageFPS > 55f && TargetFrameRate < 60)
            {
                TargetFrameRate = Mathf.Min(60, TargetFrameRate + 10);
                Application.targetFrameRate = TargetFrameRate;
            }
        }

        public string GetStatsReport()
        {
            return $"FPS: {CurrentFPS:F1} | Avg: {AverageFPS:F1} | Target: {TargetFrameRate} | Mem: {MemoryUsage / 1024 / 1024}MB";
        }
    }
}
