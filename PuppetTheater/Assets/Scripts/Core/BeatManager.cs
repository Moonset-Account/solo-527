using UnityEngine;
using System;
using System.Collections.Generic;
using PuppetTheater.Data;

namespace PuppetTheater.Core
{
    [Serializable]
    public struct BeatInfo
    {
        public double timeMs;
        public LightColor expectedColor;
        public PuppetActionType? actionType;
    }

    public class BeatManager : MonoBehaviour
    {
        [SerializeField] private double bpm = 120.0;
        [SerializeField] private double calibrationOffsetMs = 0.0;
        [SerializeField] private double perfectWindowMs = 40.0;
        [SerializeField] private double greatWindowMs = 80.0;
        [SerializeField] private double goodWindowMs = 120.0;
        [SerializeField] private double earlyLateWindowMs = 180.0;
        [SerializeField] private double approachNotificationMs = 500.0;

        private double _songStartTimeDsp;
        private List<BeatInfo> _beatMap = new List<BeatInfo>();
        private readonly HashSet<int> _judgedBeats = new HashSet<int>();
        private readonly HashSet<int> _approachedBeats = new HashSet<int>();
        private int _currentCombo;
        private int _maxCombo;
        private int _score;

        public int CurrentCombo => _currentCombo;
        public int MaxCombo => _maxCombo;
        public int Score => _score;
        public double Bpm => bpm;
        public double CalibrationOffsetMs => calibrationOffsetMs;

        public void SetCalibrationOffset(double offsetMs)
        {
            calibrationOffsetMs = offsetMs;
        }
        public double MsPerBeat => 60000.0 / bpm;

        public double SongPositionMs => (AudioSettings.dspTime - _songStartTimeDsp) * 1000.0;

        public IReadOnlyList<BeatInfo> BeatMap => _beatMap.AsReadOnly();

        public event Action<JudgmentResult> OnBeatHit;
        public event Action<int> OnBeatMissed;
        public event Action<int, double> OnBeatApproaching;

        public void SetBeatMap(List<BeatInfo> beats)
        {
            _beatMap = beats ?? new List<BeatInfo>();
            ResetState();
        }

        public void StartSong(double dspStartTime = -1)
        {
            _songStartTimeDsp = dspStartTime < 0 ? AudioSettings.dspTime : dspStartTime;
            ResetState();
        }

        private void ResetState()
        {
            _judgedBeats.Clear();
            _approachedBeats.Clear();
            _currentCombo = 0;
            _maxCombo = 0;
            _score = 0;
        }

        public JudgmentResult JudgeInput(LightColor inputColor, double inputTimeMs)
        {
            int closestBeat = FindClosestUnjudgedBeat(inputTimeMs);

            if (closestBeat < 0)
            {
                return new JudgmentResult
                {
                    Grade = JudgmentGrade.Miss,
                    BeatIndex = -1,
                    OffsetMs = 0,
                    ExpectedColor = LightColor.White,
                    ActualColor = inputColor
                };
            }

            double rawDiff = inputTimeMs - _beatMap[closestBeat].timeMs;
            double adjustedDiff = rawDiff - calibrationOffsetMs;
            double absAdjusted = Math.Abs(adjustedDiff);

            JudgmentGrade grade = DetermineGrade(adjustedDiff, absAdjusted);

            if (grade == JudgmentGrade.Miss)
            {
                return new JudgmentResult
                {
                    Grade = JudgmentGrade.Miss,
                    BeatIndex = closestBeat,
                    OffsetMs = rawDiff,
                    ExpectedColor = _beatMap[closestBeat].expectedColor,
                    ActualColor = inputColor
                };
            }

            _judgedBeats.Add(closestBeat);

            bool colorMatch = inputColor == _beatMap[closestBeat].expectedColor;

            if (!colorMatch)
            {
                grade = DowngradeForWrongColor(grade);
            }

            ApplyScoreAndCombo(grade);

            var result = new JudgmentResult
            {
                Grade = grade,
                BeatIndex = closestBeat,
                OffsetMs = rawDiff,
                ExpectedColor = _beatMap[closestBeat].expectedColor,
                ActualColor = inputColor
            };

            OnBeatHit?.Invoke(result);
            return result;
        }

        private int FindClosestUnjudgedBeat(double inputTimeMs)
        {
            int closest = -1;
            double closestAbsDiff = double.MaxValue;

            for (int i = 0; i < _beatMap.Count; i++)
            {
                if (_judgedBeats.Contains(i)) continue;
                double absDiff = Math.Abs(inputTimeMs - _beatMap[i].timeMs);
                if (absDiff < closestAbsDiff)
                {
                    closestAbsDiff = absDiff;
                    closest = i;
                }
            }

            return closest;
        }

        private JudgmentGrade DetermineGrade(double adjustedDiff, double absAdjusted)
        {
            if (absAdjusted <= perfectWindowMs) return JudgmentGrade.Perfect;
            if (absAdjusted <= greatWindowMs) return JudgmentGrade.Great;
            if (absAdjusted <= goodWindowMs) return JudgmentGrade.Good;
            if (adjustedDiff < 0 && adjustedDiff >= -earlyLateWindowMs) return JudgmentGrade.Early;
            if (adjustedDiff > 0 && adjustedDiff <= earlyLateWindowMs) return JudgmentGrade.Late;
            return JudgmentGrade.Miss;
        }

        private JudgmentGrade DowngradeForWrongColor(JudgmentGrade grade)
        {
            return JudgmentGrade.Miss;
        }

        private void ApplyScoreAndCombo(JudgmentGrade grade)
        {
            int scoreValue = grade switch
            {
                JudgmentGrade.Perfect => 300,
                JudgmentGrade.Great => 200,
                JudgmentGrade.Good => 100,
                _ => 0
            };

            _score += scoreValue;

            if (grade == JudgmentGrade.Early || grade == JudgmentGrade.Late)
            {
                _currentCombo = 0;
            }
            else
            {
                _currentCombo++;
                if (_currentCombo > _maxCombo)
                    _maxCombo = _currentCombo;
            }
        }

        private void Update()
        {
            double currentMs = SongPositionMs;

            for (int i = 0; i < _beatMap.Count; i++)
            {
                if (_judgedBeats.Contains(i)) continue;

                double timeUntilBeat = _beatMap[i].timeMs - currentMs;

                if (timeUntilBeat <= approachNotificationMs && timeUntilBeat > 0 && !_approachedBeats.Contains(i))
                {
                    _approachedBeats.Add(i);
                    OnBeatApproaching?.Invoke(i, timeUntilBeat);
                }

                double rawDiff = currentMs - _beatMap[i].timeMs;
                double adjustedDiff = rawDiff - calibrationOffsetMs;

                if (adjustedDiff > earlyLateWindowMs)
                {
                    _judgedBeats.Add(i);
                    _currentCombo = 0;
                    OnBeatMissed?.Invoke(i);
                }
            }
        }

        public double GetBeatTimeMs(int beatIndex)
        {
            if (beatIndex < 0 || beatIndex >= _beatMap.Count) return -1;
            return _beatMap[beatIndex].timeMs;
        }

        public bool IsBeatJudged(int beatIndex)
        {
            return _judgedBeats.Contains(beatIndex);
        }
    }
}
