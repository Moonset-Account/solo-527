using System;
using UnityEngine;
using RainAlley.Core;

namespace RainAlley.BeatSystem
{
    public class BeatClock
    {
        public double BPM { get; private set; }
        public double MsPerBeat { get; private set; }
        public double ElapsedMs { get; private set; }
        public int CurrentBeatIndex { get; private set; }
        public int TotalBeats { get; private set; }
        public int BeatsPerMeasure { get; private set; }

        public double BeatProgress => (ElapsedMs % MsPerBeat) / MsPerBeat;
        public bool IsRunning { get; private set; }
        public bool IsFinished => CurrentBeatIndex >= TotalBeats;

        public event Action<int> OnBeat;
        public event Action<int> OnMeasure;
        public event Action OnFinished;

        private double _startTimeMs;
        private double _pauseOffsetMs;

        public BeatClock(double bpm, int totalBeats, int beatsPerMeasure = 4)
        {
            BPM = bpm;
            TotalBeats = totalBeats;
            BeatsPerMeasure = beatsPerMeasure;
            MsPerBeat = 60000.0 / bpm;
        }

        public void UpdateBPM(double bpm)
        {
            BPM = bpm;
            MsPerBeat = 60000.0 / bpm;
        }

        public void Start()
        {
            _startTimeMs = (DateTime.Now.Ticks / TimeSpan.TicksPerMillisecond) - _pauseOffsetMs;
            ElapsedMs = _pauseOffsetMs;
            IsRunning = true;
            CurrentBeatIndex = (int)(ElapsedMs / MsPerBeat);
        }

        public void Pause()
        {
            if (!IsRunning) return;
            _pauseOffsetMs = ElapsedMs;
            IsRunning = false;
        }

        public void Stop()
        {
            IsRunning = false;
            _pauseOffsetMs = 0;
            ElapsedMs = 0;
            CurrentBeatIndex = 0;
        }

        public void Reset()
        {
            Stop();
        }

        public void SeekToBeat(int beatIndex)
        {
            beatIndex = Mathf.Clamp(beatIndex, 0, TotalBeats - 1);
            _pauseOffsetMs = beatIndex * MsPerBeat;
            ElapsedMs = _pauseOffsetMs;
            CurrentBeatIndex = beatIndex;
            if (IsRunning)
            {
                _startTimeMs = (DateTime.Now.Ticks / TimeSpan.TicksPerMillisecond) - _pauseOffsetMs;
            }
        }

        public void Tick()
        {
            if (!IsRunning) return;

            double nowMs = DateTime.Now.Ticks / TimeSpan.TicksPerMillisecond;
            ElapsedMs = nowMs - _startTimeMs;

            int newBeatIndex = (int)(ElapsedMs / MsPerBeat);
            if (newBeatIndex > CurrentBeatIndex)
            {
                int startBeat = CurrentBeatIndex + 1;
                int endBeat = Math.Min(newBeatIndex, TotalBeats - 1);

                for (int b = startBeat; b <= endBeat; b++)
                {
                    OnBeat?.Invoke(b);
                    if (b % BeatsPerMeasure == 0)
                    {
                        OnMeasure?.Invoke(b / BeatsPerMeasure);
                    }
                }

                CurrentBeatIndex = newBeatIndex;

                if (CurrentBeatIndex >= TotalBeats - 1)
                {
                    IsRunning = false;
                    OnFinished?.Invoke();
                }
            }
        }

        public double GetBeatTimeMs(int beatIndex)
        {
            return beatIndex * MsPerBeat;
        }
    }
}
