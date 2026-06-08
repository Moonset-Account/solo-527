using System;
using System.Collections.Generic;
using UnityEngine;
using RainAlley.Core;

namespace RainAlley.Calibration
{
    [Serializable]
    public class CalibrationSettings
    {
        public double AudioLatencyMs = 0;
        public double InputLatencyMs = 0;
        public double TotalLatencyMs = 0;
        public double PerfectWindowMs = 80;
        public double GoodWindowMs = 160;
        public double RecommendedLatencyMs = 0;

        public void RecalculateTotal()
        {
            TotalLatencyMs = AudioLatencyMs + InputLatencyMs;
        }
    }

    public class CalibrationTrialResult
    {
        public double ExpectedBeatTimeMs;
        public double ActualInputTimeMs;
        public double OffsetMs;
    }

    public class CalibrationManager
    {
        public CalibrationSettings Settings { get; private set; }

        public int CurrentTrialIndex => _trialResults.Count;
        public int RequiredTrials = 8;
        public bool IsCalibrationComplete => _trialResults.Count >= RequiredTrials;

        private List<CalibrationTrialResult> _trialResults = new List<CalibrationTrialResult>();
        private double _bpm;
        private double _msPerBeat;
        private int _nextTrialBeat;
        private double _trialStartTimeMs;
        private bool _isRunning;

        public event Action<int> OnTrialProgress;
        public event Action<double, double, double> OnCalibrationComplete;
        public event Action<double, double> OnWindowsUpdated;

        public CalibrationManager()
        {
            Settings = new CalibrationSettings();
            LoadSettings();
        }

        public void StartCalibration(double bpm, int startBeat = 4)
        {
            _bpm = bpm;
            _msPerBeat = 60000.0 / bpm;
            _nextTrialBeat = startBeat;
            _trialResults.Clear();
            _trialStartTimeMs = DateTime.Now.Ticks / TimeSpan.TicksPerMillisecond;
            _isRunning = true;
            OnTrialProgress?.Invoke(0);
        }

        public void StopCalibration()
        {
            _isRunning = false;
        }

        public double GetExpectedTrialTimeMs(int beatOffset = 0)
        {
            return (_nextTrialBeat + beatOffset) * _msPerBeat;
        }

        public void RecordInput(double currentSongTimeMs)
        {
            if (!_isRunning) return;

            double expectedTime = _nextTrialBeat * _msPerBeat;
            double offset = currentSongTimeMs - expectedTime;

            _trialResults.Add(new CalibrationTrialResult
            {
                ExpectedBeatTimeMs = expectedTime,
                ActualInputTimeMs = currentSongTimeMs,
                OffsetMs = offset
            });

            _nextTrialBeat += 2;

            OnTrialProgress?.Invoke(_trialResults.Count);

            if (_trialResults.Count >= RequiredTrials)
            {
                FinalizeCalibration();
            }
        }

        private void FinalizeCalibration()
        {
            _isRunning = false;

            var offsets = new List<double>();
            foreach (var r in _trialResults) offsets.Add(r.OffsetMs);
            offsets.Sort();

            double median;
            int count = offsets.Count;
            if (count % 2 == 0)
                median = (offsets[count / 2 - 1] + offsets[count / 2]) / 2.0;
            else
                median = offsets[count / 2];

            double sumOfSquares = 0;
            foreach (var o in offsets) sumOfSquares += (o - median) * (o - median);
            double stdDev = Math.Sqrt(sumOfSquares / count);

            double recommended = median;
            recommended = Math.Clamp(recommended, -300, 300);

            Settings.RecommendedLatencyMs = recommended;
            Settings.InputLatencyMs = recommended;
            Settings.RecalculateTotal();

            AdjustWindowsBasedOnStdDev(stdDev);

            SaveSettings();

            OnCalibrationComplete?.Invoke(recommended, stdDev, Settings.TotalLatencyMs);
            OnWindowsUpdated?.Invoke(Settings.PerfectWindowMs, Settings.GoodWindowMs);
        }

        private void AdjustWindowsBasedOnStdDev(double stdDevMs)
        {
            double perfectBase = 80;
            double goodBase = 160;

            double spreadFactor = Math.Clamp(stdDevMs / 50.0, 0.6, 2.0);

            Settings.PerfectWindowMs = perfectBase * spreadFactor;
            Settings.GoodWindowMs = goodBase * spreadFactor;

            Settings.PerfectWindowMs = Math.Clamp(Settings.PerfectWindowMs, 45, 150);
            Settings.GoodWindowMs = Math.Clamp(Settings.GoodWindowMs, 100, 300);
        }

        public void SetManualLatency(double latencyMs)
        {
            Settings.InputLatencyMs = Math.Clamp(latencyMs, -300, 300);
            Settings.RecalculateTotal();
            SaveSettings();
        }

        public void SetAudioLatency(double latencyMs)
        {
            Settings.AudioLatencyMs = Math.Clamp(latencyMs, 0, 200);
            Settings.RecalculateTotal();
            SaveSettings();
        }

        public void SetManualWindows(double perfectMs, double goodMs)
        {
            Settings.PerfectWindowMs = Math.Clamp(perfectMs, 30, 200);
            Settings.GoodWindowMs = Math.Max(Settings.PerfectWindowMs + 20, Math.Clamp(goodMs, 80, 400));
            SaveSettings();
            OnWindowsUpdated?.Invoke(Settings.PerfectWindowMs, Settings.GoodWindowMs);
        }

        public void ResetToDefaults()
        {
            Settings = new CalibrationSettings();
            SaveSettings();
            OnWindowsUpdated?.Invoke(Settings.PerfectWindowMs, Settings.GoodWindowMs);
        }

        public string GetWindowDescription()
        {
            double p = Settings.PerfectWindowMs;
            double g = Settings.GoodWindowMs;

            string level;
            if (p <= 60) level = "极严";
            else if (p <= 85) level = "严格";
            else if (p <= 110) level = "标准";
            else level = "宽松";

            return $"判定等级：{level}\n完美窗口：±{p:F0}ms\n良好窗口：±{g:F0}ms";
        }

        public string GetLatencyDescription()
        {
            double total = Settings.TotalLatencyMs;
            string desc = Math.Abs(total) < 10 ? "几乎无延迟" :
                         total > 0 ? $"画面滞后 {total:F0}ms" :
                                     $"输入提前 {Math.Abs(total):F0}ms";

            return $"总延迟：{total:F0}ms ({desc})\n推荐延迟：{Settings.RecommendedLatencyMs:F0}ms";
        }

        private const string PlayerPrefsKey = "RainAlley_Calibration_v1";

        public void SaveSettings()
        {
            try
            {
                string json = JsonUtility.ToJson(Settings);
                PlayerPrefs.SetString(PlayerPrefsKey, json);
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"保存校准设置失败: {e.Message}");
            }
        }

        public void LoadSettings()
        {
            try
            {
                if (PlayerPrefs.HasKey(PlayerPrefsKey))
                {
                    string json = PlayerPrefs.GetString(PlayerPrefsKey);
                    Settings = JsonUtility.FromJson<CalibrationSettings>(json) ?? new CalibrationSettings();
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"加载校准设置失败: {e.Message}");
                Settings = new CalibrationSettings();
            }
        }

        public CalibrationTrialResult[] GetTrialResults()
        {
            return _trialResults.ToArray();
        }
    }
}
