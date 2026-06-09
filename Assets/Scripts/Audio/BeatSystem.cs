using System;
using System.Collections.Generic;
using BeatRunner.Core;
using UnityEngine;

namespace BeatRunner.Audio
{
    public class BeatSystem : MonoBehaviour
    {
        public static BeatSystem Instance { get; private set; }

        private GameSettings _settings;
        private RuntimeGameData _runtimeData;

        [SerializeField] private float _bpm = 120f;
        public float BPM
        {
            get => _bpm;
            set
            {
                _bpm = Mathf.Max(10f, value);
                RecalculateTiming();
            }
        }

        public float SecondsPerBeat { get; private set; }
        public float SecondsPerMeasure { get; private set; }

        public int CurrentBeatIndex { get; private set; } = -1;
        public int CurrentMeasureIndex { get; private set; } = -1;

        public float BeatProgress { get; private set; }

        public event Action<int, int> OnBeat;
        public event Action<int> OnMeasure;
        public event Action<float> OnBeatProgress;

        private double _startTime;
        private bool _isRunning;

        private readonly List<BeatEvent> _scheduledEvents = new List<BeatEvent>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            RecalculateTiming();
        }

        private void Start()
        {
            if (ServiceLocator.TryGet(out GameSettings settings)) _settings = settings;
            if (ServiceLocator.TryGet(out RuntimeGameData data)) _runtimeData = data;
        }

        private void RecalculateTiming()
        {
            SecondsPerBeat = 60f / _bpm;
            SecondsPerMeasure = SecondsPerBeat * 4f;
        }

        public void StartSystem(float bpm, double startTime)
        {
            BPM = bpm;
            _startTime = startTime;
            _isRunning = true;
            CurrentBeatIndex = -1;
            CurrentMeasureIndex = -1;
            _scheduledEvents.Clear();
        }

        public void StopSystem()
        {
            _isRunning = false;
            _scheduledEvents.Clear();
        }

        private void Update()
        {
            if (!_isRunning) return;

            double latency = 0;
            if (AudioManager.Instance != null)
            {
                latency = AudioManager.Instance.audioLatencyMs / 1000.0;
            }

            double currentTime = AudioManager.Instance != null
                ? AudioManager.Instance.currentPlaybackTime
                : (AudioSettings.dspTime - _startTime - latency);

            if (currentTime < 0) return;

            float timeInMeasure = (float)(currentTime % SecondsPerMeasure);
            BeatProgress = (timeInMeasure % SecondsPerBeat) / SecondsPerBeat;
            OnBeatProgress?.Invoke(BeatProgress);

            int beatInMeasure = Mathf.FloorToInt(timeInMeasure / SecondsPerBeat);
            int newMeasureIndex = Mathf.FloorToInt((float)(currentTime / SecondsPerMeasure));
            int newBeatIndex = newMeasureIndex * 4 + beatInMeasure;

            if (newBeatIndex != CurrentBeatIndex)
            {
                CurrentBeatIndex = newBeatIndex;
                OnBeat?.Invoke(newBeatIndex, beatInMeasure);
                AudioManager.Instance?.InvokeBeat(newBeatIndex);

                ProcessScheduledEvents(newBeatIndex);

                if (beatInMeasure == 0 && newMeasureIndex != CurrentMeasureIndex)
                {
                    CurrentMeasureIndex = newMeasureIndex;
                    OnMeasure?.Invoke(newMeasureIndex);
                }
            }
        }

        public JudgmentType JudgeTiming(double eventTime, double inputTime)
        {
            if (_settings == null)
            {
                ServiceLocator.TryGet(out _settings);
                if (_settings == null) return JudgmentType.Miss;
            }

            double diff = Math.Abs(inputTime - eventTime);

            if (diff <= _settings.perfectWindow) return JudgmentType.Perfect;
            if (diff <= _settings.greatWindow) return JudgmentType.Great;
            if (diff <= _settings.goodWindow) return JudgmentType.Good;
            if (diff <= _settings.missWindow) return JudgmentType.Miss;
            return JudgmentType.Miss;
        }

        public double GetBeatTime(int beatIndex)
        {
            return _startTime + beatIndex * SecondsPerBeat;
        }

        public double GetSubDivisionTime(int beatIndex, float subDivision)
        {
            return GetBeatTime(beatIndex) + SecondsPerBeat * subDivision;
        }

        public void ScheduleEvent(int beatIndex, Action callback)
        {
            _scheduledEvents.Add(new BeatEvent { beatIndex = beatIndex, callback = callback });
        }

        private void ProcessScheduledEvents(int currentBeat)
        {
            for (int i = _scheduledEvents.Count - 1; i >= 0; i--)
            {
                if (_scheduledEvents[i].beatIndex <= currentBeat)
                {
                    _scheduledEvents[i].callback?.Invoke();
                    _scheduledEvents.RemoveAt(i);
                }
            }
        }

        private struct BeatEvent
        {
            public int beatIndex;
            public Action callback;
        }
    }
}
