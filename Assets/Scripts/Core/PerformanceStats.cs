using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class PerformanceStats : MonoBehaviour
    {
        private static PerformanceStats _instance;
        public static PerformanceStats Instance { get; private set; }

        [Header("Settings")]
        [SerializeField] private float _sampleInterval = 1f;
        [SerializeField] private int _frameHistorySize = 300;

        private float _currentFPS;
        private float _avgFPS;
        private float _minFPS;
        private float _maxFPS;
        private float _fpsAccumulator;
        private int _frameCount;
        private float _lastSampleTime;

        private Queue<float> _fpsHistory;
        private float _fpsSum;

        private long _totalMemoryBytes;
        private long _usedMemoryBytes;
        private float _memoryUsageMB;

        private int _drawCalls;
        private int _triangles;
        private int _vertices;

        private float _gameStartTime;
        private float _sessionDuration;
        private int _totalFrames;
        private int _stutterFrames;

        private Dictionary<string, PerformanceCounter> _customCounters;
        private bool _isRecording;

        public float CurrentFPS => _currentFPS;
        public float AverageFPS => _avgFPS;
        public float MinFPS => _minFPS;
        public float MaxFPS => _maxFPS;
        public float MemoryUsageMB => _memoryUsageMB;
        public int DrawCalls => _drawCalls;
        public int TriangleCount => _triangles;
        public int VertexCount => _vertices;
        public float SessionDuration => _sessionDuration;
        public float StutterPercentage => _totalFrames > 0 ? (float)_stutterFrames / _totalFrames * 100f : 0f;

        public event Action<PerformanceStats> OnStatsUpdated;
        public event Action<string> OnPerformanceWarning;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Initialize();
        }

        private void Initialize()
        {
            _fpsHistory = new Queue<float>(_frameHistorySize);
            _customCounters = new Dictionary<string, PerformanceCounter>();
            _gameStartTime = Time.realtimeSinceStartup;
            _minFPS = float.MaxValue;
            _maxFPS = 0;
            _isRecording = true;
        }

        private void Update()
        {
            if (!_isRecording) return;

            float deltaTime = Time.unscaledDeltaTime;
            float instantaneousFPS = 1f / Mathf.Max(0.0001f, deltaTime);
            _currentFPS = instantaneousFPS;
            _totalFrames++;
            _sessionDuration = Time.realtimeSinceStartup - _gameStartTime;

            if (instantaneousFPS < Application.targetFrameRate * 0.5f)
            {
                _stutterFrames++;
                if (instantaneousFPS < 20)
                {
                    OnPerformanceWarning?.Invoke($"Low FPS: {instantaneousFPS:F1}");
                }
            }

            _minFPS = Mathf.Min(_minFPS, instantaneousFPS);
            _maxFPS = Mathf.Max(_maxFPS, instantaneousFPS);

            if (_fpsHistory.Enqueue(instantaneousFPS);
            _fpsSum += instantaneousFPS;

            while (_fpsHistory.Count > _frameHistorySize)
            {
                _fpsSum -= _fpsHistory.Dequeue();
            }

            _avgFPS = _fpsSum / _fpsHistory.Count;

            _fpsAccumulator += deltaTime;
            _frameCount++;

            if (_fpsAccumulator >= _sampleInterval)
            {
                UpdateMemoryStats();
                OnStatsUpdated?.Invoke(this);
                _fpsAccumulator = 0f;
            }
        }

        private void UpdateMemoryStats()
        {
            _totalMemoryBytes = System.GC.GetTotalMemory(false);
            _usedMemoryBytes = _totalMemoryBytes;
            _memoryUsageMB = _usedMemoryBytes / (1024f * 1024f);

            _triangles = 0;
            _vertices = 0;
        }

        public void RegisterCounter(string name, string description = "")
        {
            if (!_customCounters.ContainsKey(name))
            {
                _customCounters[name] = new PerformanceCounter
                {
                    name = name,
                    description = description
                };
            }
        }

        public void IncrementCounter(string name, int amount = 1)
        {
            if (_customCounters.TryGetValue(name, out var counter))
            {
                counter.Increment(amount);
            }
        }

        public void SetCounterValue(string name, float value)
        {
            if (_customCounters.TryGetValue(name, out var counter))
            {
                counter.SetValue(value);
            }
        }

        public void StartTimedEvent(string eventName)
        {
            RegisterCounter(eventName);
            if (_customCounters.TryGetValue(eventName, out var counter))
            {
                counter.StartTiming();
            }
        }

        public void StopTimedEvent(string eventName)
        {
            if (_customCounters.TryGetValue(eventName, out var counter))
            {
                counter.StopTiming();
            }
        }

        public PerformanceCounter GetCounter(string name)
        {
            return _customCounters.TryGetValue(name, out var counter) ? counter : null;
        }

        public Dictionary<string, PerformanceCounter> GetAllCounters()
        {
            return new Dictionary<string, PerformanceCounter>(_customCounters);
        }

        public PerformanceReport GenerateReport()
        {
            return new PerformanceReport
            {
                averageFPS = _avgFPS,
                minFPS = _minFPS,
                maxFPS = _maxFPS,
                currentFPS = _currentFPS,
                memoryUsageMB = _memoryUsageMB,
                sessionDuration = _sessionDuration,
                stutterPercentage = StutterPercentage,
                totalFrames = _totalFrames,
                counters = new Dictionary<string, PerformanceCounter>(_customCounters)
            };
        }

        public void ResetSessionStats()
        {
            _minFPS = float.MaxValue;
            _maxFPS = 0;
            _minFPS = float.MaxValue;
            _fpsHistory.Clear();
            _fpsSum = 0;
            _stutterFrames = 0;
            _totalFrames = 0;
            _gameStartTime = Time.realtimeSinceStartup;
            foreach (var counter in _customCounters)
            {
                counter.Value.Reset();
            }
        }

        public void SetRecording(bool recording)
        {
            _isRecording = recording;
        }

        public string GetSummaryString()
        {
            return $"FPS: {_currentFPS:F0} (Avg: {_avgFPS:F0} | Min: {_minFPS:F0} | Max: {_maxFPS:F0})\n" +
                   $"Memory: {_memoryUsageMB:F1} MB | Session: {_sessionDuration:F0}s | Stutter: {StutterPercentage:F1}%";
        }
    }

    [Serializable]
    public class PerformanceCounter
    {
        public string name;
        public string description;
        public long count;
        public float currentValue;
        public float minValue;
        public float maxValue;
        public float totalValue;
        public long sampleCount;
        private System.Diagnostics.Stopwatch _stopwatch;
        public float lastTimedDuration;

        public PerformanceCounter()
        {
            minValue = float.MaxValue;
            maxValue = 0;
            _stopwatch = new System.Diagnostics.Stopwatch();
        }

        public void Increment(int amount = 1)
        {
            count += amount;
            currentValue = count;
            sampleCount++;
            UpdateStats(count);
        }

        public void SetValue(float value)
        {
            currentValue = value;
            sampleCount++;
            UpdateStats(value);
        }

        public void StartTiming()
        {
            _stopwatch.Reset();
            _stopwatch.Start();
        }

        public void StopTiming()
        {
            _stopwatch.Stop();
            lastTimedDuration = (float)_stopwatch.Elapsed.TotalMilliseconds;
            SetValue(lastTimedDuration);
        }

        private void UpdateStats(float value)
        {
            totalValue += value;
            minValue = Math.Min(minValue, value);
            maxValue = Math.Max(maxValue, value);
        }

        public float AverageValue => sampleCount > 0 ? totalValue / sampleCount : 0;

        public void Reset()
        {
            count = 0;
            currentValue = 0;
            minValue = float.MaxValue;
            maxValue = 0;
            totalValue = 0;
            sampleCount = 0;
            lastTimedDuration = 0;
        }
    }

    [Serializable]
    public class PerformanceReport
    {
        public float averageFPS;
        public float minFPS;
        public float maxFPS;
        public float currentFPS;
        public float memoryUsageMB;
        public float sessionDuration;
        public float stutterPercentage;
        public int totalFrames;
        public Dictionary<string, PerformanceCounter> counters;

        public override string ToString()
        {
            string report = $"=== Performance Report ===\n" +
                           $"Average FPS: {averageFPS:F1}\n" +
                           $"Min FPS: {minFPS:F1}\n" +
                           $"Max FPS: {maxFPS:F1}\n" +
                           $"Current FPS: {currentFPS:F1}\n" +
                           $"Memory: {memoryUsageMB:F1} MB\n" +
                           $"Session Time: {sessionDuration:F1}s\n" +
                           $"Stutter: {stutterPercentage:F2}%\n" +
                           $"Total Frames: {totalFrames}\n";

            if (counters != null)
            {
                report += "\n=== Custom Counters ===\n";
                foreach (var kvp in counters)
                {
                    report += $"{kvp.Key}: {kvp.Value.currentValue:F2} (avg: {kvp.Value.AverageValue:F2})\n";
                }
            }
            return report;
        }
    }
}
