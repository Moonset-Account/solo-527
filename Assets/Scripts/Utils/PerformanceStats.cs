using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Profiling;

namespace YouthTrainingManagement.Utils
{
    public class PerformanceStats : MonoBehaviour
    {
        public bool Enabled { get; set; } = true;
        public event Action<PerformanceReport> OnStatsUpdated;
        public Canvas PerformanceCanvas;

        private GUIStyle _labelStyle;
        private Rect _windowRect = new Rect(10, 10, 320, 140);

        private const int FrameSampleCount = 60;
        private readonly float[] _frameTimes = new float[FrameSampleCount];
        private int _frameSampleIndex;
        private float _accumulatedTime;
        private int _framesSinceLastUpdate;

        public PerformanceReport CurrentReport { get; private set; }

        private void Update()
        {
            if (!Enabled) return;
            RecordFrameTime(Time.unscaledDeltaTime);
        }

        public void Update(float deltaTime)
        {
            if (!Enabled) return;
            _accumulatedTime += deltaTime;
            _framesSinceLastUpdate++;

            if (_accumulatedTime >= 0.5f)
            {
                GenerateReport();
                _accumulatedTime = 0f;
                _framesSinceLastUpdate = 0;
            }
        }

        private void RecordFrameTime(float unscaledDeltaTime)
        {
            _frameTimes[_frameSampleIndex] = unscaledDeltaTime;
            _frameSampleIndex = (_frameSampleIndex + 1) % FrameSampleCount;
        }

        public PerformanceReport GenerateReport()
        {
            float minFrameTime = float.MaxValue;
            float maxFrameTime = float.MinValue;
            float totalFrameTime = 0f;

            for (int i = 0; i < FrameSampleCount; i++)
            {
                var ft = _frameTimes[i];
                if (ft <= 0f) continue;
                minFrameTime = Math.Min(minFrameTime, ft);
                maxFrameTime = Math.Max(maxFrameTime, ft);
                totalFrameTime += ft;
            }

            int validFrames = 0;
            for (int i = 0; i < FrameSampleCount; i++)
            {
                if (_frameTimes[i] > 0f) validFrames++;
            }

            float avgFrameTime = validFrames > 0 ? totalFrameTime / validFrames : 0f;
            float avgFPS = avgFrameTime > 0 ? 1f / avgFrameTime : 0f;
            float minFPS = minFrameTime > 0 ? 1f / minFrameTime : 0f;
            float maxFPS = maxFrameTime > 0 ? 1f / maxFrameTime : 0f;

            var fpsList = new List<float>();
            for (int i = 0; i < FrameSampleCount; i++)
            {
                if (_frameTimes[i] > 0f) fpsList.Add(1f / _frameTimes[i]);
            }
            fpsList.Sort();
            float percentile1LowFPS = fpsList.Count > 0 ? fpsList[(int)(fpsList.Count * 0.01f)] : 0f;
            float percentile5LowFPS = fpsList.Count > 0 ? fpsList[(int)(fpsList.Count * 0.05f)] : 0f;

            var report = new PerformanceReport
            {
                Timestamp = DateTime.Now,
                AverageFPS = avgFPS,
                MinFPS = minFPS,
                MaxFPS = maxFPS,
                AverageFrameTimeMs = avgFrameTime * 1000f,
                MinFrameTimeMs = minFrameTime * 1000f,
                MaxFrameTimeMs = maxFrameTime * 1000f,
                Percentile1LowFPS = percentile1LowFPS,
                Percentile5LowFPS = percentile5LowFPS,
                TotalAllocatedMemory = Profiler.GetTotalAllocatedMemoryLong() / (1024f * 1024f),
                TotalReservedMemory = Profiler.GetTotalReservedMemoryLong() / (1024f * 1024f),
                MonoHeapSize = Profiler.GetMonoHeapSizeLong() / (1024f * 1024f),
                MonoUsedMemory = Profiler.GetMonoUsedSizeLong() / (1024f * 1024f),
                TargetFrameRate = Application.targetFrameRate,
                VSyncEnabled = QualitySettings.vSyncCount > 0,
                QualityLevel = QualitySettings.names[QualitySettings.GetQualityLevel()],
                ScreenResolution = $"{Screen.width}x{Screen.height}@{Screen.currentResolution.refreshRate}Hz",
                WindowMode = Screen.fullScreen ? "Fullscreen" : "Windowed"
            };

            CurrentReport = report;
            OnStatsUpdated?.Invoke(report);
            return report;
        }

        public string GetDebugString()
        {
            if (CurrentReport == null) GenerateReport();
            var r = CurrentReport;
            return $"FPS: {r.AverageFPS:0.0} (1%: {r.Percentile1LowFPS:0.0}) | " +
                   $"Frame: {r.AverageFrameTimeMs:0.00}ms | " +
                   $"Memory: {r.TotalAllocatedMemory:0.0}MB | " +
                   $"Target: {r.TargetFrameRate}";
        }

        private void OnGUI()
        {
            if (!Enabled) return;
            if (_labelStyle == null)
            {
                _labelStyle = new GUIStyle(GUI.skin.label);
                _labelStyle.fontSize = 12;
                _labelStyle.normal.textColor = new Color(0.2f, 1f, 0.4f, 0.95f);
                _labelStyle.alignment = TextAnchor.UpperLeft;
                _labelStyle.wordWrap = false;
            }
            if (CurrentReport == null) GenerateReport();
            var r = CurrentReport;
            _windowRect = GUILayout.Window(GetInstanceID(), _windowRect, DrawWindow, "⚡ PERFORMANCE");
        }

        private void DrawWindow(int id)
        {
            var r = CurrentReport;
            GUILayout.Label($"FPS:   <b>{r.AverageFPS:0.0}</b>  (1%ile: <b>{r.Percentile1LowFPS:0.0}</b>)", _labelStyle);
            GUILayout.Label($"Frame: {r.AverageFrameTimeMs:0.00}ms  (min: {r.MinFrameTimeMs:0.00}, max: {r.MaxFrameTimeMs:0.00})", _labelStyle);
            GUILayout.Label($"Mem:   {r.TotalAllocatedMemory:0.0}MB  (Mono: {r.MonoUsedMemory:0.0}MB)", _labelStyle);
            GUILayout.Label($"Target: {r.TargetFrameRate} FPS  Quality: {r.QualityLevel}", _labelStyle);
            GUI.DragWindow(new Rect(0, 0, 10000, 20));
        }
    }

    public class PerformanceReport
    {
        public DateTime Timestamp;
        public float AverageFPS;
        public float MinFPS;
        public float MaxFPS;
        public float AverageFrameTimeMs;
        public float MinFrameTimeMs;
        public float MaxFrameTimeMs;
        public float Percentile1LowFPS;
        public float Percentile5LowFPS;
        public float TotalAllocatedMemory;
        public float TotalReservedMemory;
        public float MonoHeapSize;
        public float MonoUsedMemory;
        public int TargetFrameRate;
        public bool VSyncEnabled;
        public string QualityLevel;
        public string ScreenResolution;
        public string WindowMode;
    }
}
