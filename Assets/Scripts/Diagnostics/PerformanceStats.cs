using System;
using System.Collections.Generic;
using BeatRunner.Core;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.Diagnostics
{
    public class PerformanceStats : MonoBehaviour
    {
        public static PerformanceStats Instance { get; private set; }

        [SerializeField] private GameObject _statsPanel;
        [SerializeField] private Text _fpsText;
        [SerializeField] private Text _msText;
        [SerializeField] private Text _memoryText;
        [SerializeField] private Text _sceneText;
        [SerializeField] private Text _audioLatencyText;
        [SerializeField] private Text _beatInfoText;

        [Header("Settings")]
        [SerializeField] private float _updateInterval = 0.5f;
        [SerializeField] private bool _visibleByDefault;

        public bool IsVisible => _statsPanel != null && _statsPanel.activeSelf;

        private float _timer;
        private int _frameCount;
        private readonly Queue<float> _frameTimes = new Queue<float>();
        private const int MaxFrameSamples = 60;

        public float CurrentFps { get; private set; }
        public float AverageMs { get; private set; }
        public float MinFps { get; private set; }
        public float MaxFps { get; private set; }
        public long MemoryAllocatedMb { get; private set; }

        private GameSettings _settings;

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
            ServiceLocator.TryGet(out _settings);
            bool visible = _visibleByDefault;
            if (_settings != null) visible = _settings.enablePerformanceStats;
            SetVisible(visible);
        }

        private void Update()
        {
            if (!IsVisible) return;

            _timer += Time.unscaledDeltaTime;
            _frameCount++;

            float frameMs = Time.unscaledDeltaTime * 1000f;
            _frameTimes.Enqueue(frameMs);
            if (_frameTimes.Count > MaxFrameSamples) _frameTimes.Dequeue();

            if (_timer >= _updateInterval)
            {
                UpdateStats();
                _timer = 0f;
                _frameCount = 0;
            }
        }

        private void UpdateStats()
        {
            CurrentFps = 1f / Time.unscaledDeltaTime;

            float sumMs = 0f;
            float minMs = float.MaxValue;
            float maxMs = float.MinValue;
            foreach (var ms in _frameTimes)
            {
                sumMs += ms;
                if (ms < minMs) minMs = ms;
                if (ms > maxMs) maxMs = ms;
            }
            int count = _frameTimes.Count;
            AverageMs = count > 0 ? sumMs / count : 0f;
            MinFps = count > 0 ? 1000f / maxMs : 0f;
            MaxFps = count > 0 ? 1000f / minMs : 0f;

            MemoryAllocatedMb = GC.GetTotalMemory(false) / (1024 * 1024);

            if (_fpsText) _fpsText.text = $"FPS: {CurrentFps:F0}  (min {MinFps:F0} / max {MaxFps:F0})";
            if (_msText) _msText.text = $"Frame: {AverageMs:F2} ms";
            if (_memoryText) _memoryText.text = $"Memory: {MemoryAllocatedMb} MB";
            if (_sceneText) _sceneText.text = $"Scene: {UnityEngine.SceneManagement.SceneManager.GetActiveScene().name}";

            if (_audioLatencyText && Audio.AudioManager.Instance != null)
            {
                _audioLatencyText.text = $"Latency: {Audio.AudioManager.Instance.audioLatencyMs:F0} ms";
            }

            if (_beatInfoText && Audio.BeatSystem.Instance != null)
            {
                _beatInfoText.text = $"Beat: {Audio.BeatSystem.Instance.CurrentBeatIndex}  " +
                                     $"Prog: {Audio.BeatSystem.Instance.BeatProgress:F2}";
            }
        }

        public void SetVisible(bool visible)
        {
            if (_statsPanel) _statsPanel.SetActive(visible);
        }

        public void ToggleVisible()
        {
            SetVisible(!IsVisible);
        }

        public string GetSummaryText()
        {
            return $"FPS: {CurrentFps:F0} | {AverageMs:F1}ms | Mem: {MemoryAllocatedMb}MB";
        }
    }
}
