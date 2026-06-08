using System;
using System.Collections.Generic;
using UnityEngine;

namespace Kitchen.Performance
{
    public class PerformanceStats : MonoBehaviour
    {
        public static PerformanceStats Instance { get; private set; }

        [Header("FPS Tracking")]
        [Range(0.1f, 2f)] public float fpsUpdateInterval = 0.5f;
        [Range(10, 500)] public int frameSamples = 120;

        [Header("Memory Tracking")]
        public bool trackMemory = true;
        public float memoryUpdateInterval = 1f;

        [Header("Runtime Stats")]
        [SerializeField] private float currentFPS;
        [SerializeField] private float minFPS;
        [SerializeField] private float maxFPS;
        [SerializeField] private float averageFPS;
        [SerializeField] private long allocatedMemoryKB;
        [SerializeField] private long reservedMemoryKB;
        [SerializeField] private float msPerFrame;
        [SerializeField] private int drawCalls;
        [SerializeField] private int totalTriangles;

        public float CurrentFPS => currentFPS;
        public float MinFPS => minFPS;
        public float MaxFPS => maxFPS;
        public float AverageFPS => averageFPS;
        public float MsPerFrame => msPerFrame;
        public long AllocatedMemoryKB => allocatedMemoryKB;
        public long ReservedMemoryKB => reservedMemoryKB;
        public int DrawCalls => drawCalls;
        public int TotalTriangles => totalTriangles;

        public event Action OnStatsUpdated;

        private Queue<float> fpsHistory = new Queue<float>();
        private float fpsTimer;
        private int frameCountSinceUpdate;
        private float memoryTimer;
        private float sessionStartTime;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Start()
        {
            sessionStartTime = Time.realtimeSinceStartup;
            ResetStats();
        }

        public void ResetStats()
        {
            currentFPS = 0f;
            minFPS = float.MaxValue;
            maxFPS = float.MinValue;
            averageFPS = 0f;
            fpsHistory.Clear();
            fpsTimer = 0f;
            frameCountSinceUpdate = 0;
            memoryTimer = 0f;
        }

        private void Update()
        {
            frameCountSinceUpdate++;
            fpsTimer += Time.unscaledDeltaTime;
            memoryTimer += Time.unscaledDeltaTime;

            if (fpsTimer >= fpsUpdateInterval)
            {
                UpdateFPSStats();
                fpsTimer = 0f;
            }

            if (trackMemory && memoryTimer >= memoryUpdateInterval)
            {
                UpdateMemoryStats();
                memoryTimer = 0f;
            }
        }

        private void UpdateFPSStats()
        {
            float fps = frameCountSinceUpdate / fpsUpdateInterval;
            currentFPS = fps;
            msPerFrame = 1000f / Mathf.Max(fps, 1f);

            if (fps < minFPS) minFPS = fps;
            if (fps > maxFPS) maxFPS = fps;

            fpsHistory.Enqueue(fps);
            while (fpsHistory.Count > frameSamples) fpsHistory.Dequeue();

            float sum = 0f;
            foreach (float f in fpsHistory) sum += f;
            averageFPS = fpsHistory.Count > 0 ? sum / fpsHistory.Count : fps;

            frameCountSinceUpdate = 0;
            OnStatsUpdated?.Invoke();
        }

        private void UpdateMemoryStats()
        {
            allocatedMemoryKB = GC.GetTotalMemory(false) / 1024;
#if UNITY_5_6_OR_NEWER
            reservedMemoryKB = UnityEngine.Profiling.Profiler.GetTotalReservedMemoryLong() / 1024;
#endif
        }

        public string GetSummaryString()
        {
            return $"FPS: {currentFPS:F1} ({minFPS:F0}-{maxFPS:F0}) Avg: {averageFPS:F1}\n" +
                   $"Frame: {msPerFrame:F2}ms | Mem: {allocatedMemoryKB}KB / {reservedMemoryKB}KB";
        }

        public PerformanceReport GenerateReport()
        {
            return new PerformanceReport
            {
                sessionDurationSeconds = Time.realtimeSinceStartup - sessionStartTime,
                avgFPS = averageFPS,
                minFPS = minFPS,
                maxFPS = maxFPS,
                percentile99FPS = CalculatePercentile(99),
                percentile95FPS = CalculatePercentile(95),
                allocatedMemoryKB = allocatedMemoryKB,
                reservedMemoryKB = reservedMemoryKB,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };
        }

        private float CalculatePercentile(int percentile)
        {
            if (fpsHistory.Count == 0) return 0;
            float[] arr = new float[fpsHistory.Count];
            fpsHistory.CopyTo(arr, 0);
            Array.Sort(arr);
            int idx = Mathf.RoundToInt(arr.Length * (100 - percentile) / 100f);
            return arr[Mathf.Clamp(idx, 0, arr.Length - 1)];
        }
    }

    [Serializable]
    public class PerformanceReport
    {
        public float sessionDurationSeconds;
        public float avgFPS;
        public float minFPS;
        public float maxFPS;
        public float percentile99FPS;
        public float percentile95FPS;
        public long allocatedMemoryKB;
        public long reservedMemoryKB;
        public long timestamp;
    }
}
