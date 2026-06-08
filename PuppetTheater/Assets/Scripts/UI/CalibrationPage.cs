using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using PuppetTheater.Core;

namespace PuppetTheater.UI
{
    public class CalibrationPage : MonoBehaviour
    {
        [Header("Audio")]
        [SerializeField] private AudioSource _audioSource;
        [SerializeField] private float _beatInterval = 0.5f;
        [SerializeField] private float _beepFrequency = 880f;
        [SerializeField] private float _beepDuration = 0.05f;

        [Header("UI References")]
        [SerializeField] private Text _offsetDisplayText;
        [SerializeField] private Text _averageDisplayText;
        [SerializeField] private Text _resultDisplayText;
        [SerializeField] private Text _countdownText;

        [Header("BeatManager")]
        [SerializeField] private BeatManager _beatManager;

        [Header("Calibration")]
        [SerializeField] private int _requiredSamples = 8;
        [SerializeField] private float _goodThresholdMs = 10f;

        private readonly List<float> _samples = new List<float>();
        private readonly List<float> _beatTimes = new List<float>();
        private float _calibrationOffsetMs;
        private bool _isCalibrating;
        private Coroutine _calibrationCoroutine;

        public bool IsCalibrating => _isCalibrating;

        public event Action<float> OnCalibrationComplete;
        public event Action<float, float> OnCalibrationSampleTaken;

        private const string PREFS_KEY = "CalibrationOffsetMs";

        private void Awake()
        {
            LoadSavedCalibration();
        }

        private void Update()
        {
            if (!_isCalibrating) return;

            if (Input.GetKeyDown(KeyCode.Space) ||
                (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began))
            {
                RegisterTap();
            }
        }

        public void StartCalibration()
        {
            if (_isCalibrating) return;
            _calibrationCoroutine = StartCoroutine(CalibrationSequence());
        }

        public void StopCalibration()
        {
            if (!_isCalibrating) return;

            if (_calibrationCoroutine != null)
            {
                StopCoroutine(_calibrationCoroutine);
                _calibrationCoroutine = null;
            }

            _isCalibrating = false;
            ComputeResult();
        }

        public float GetCalibrationOffsetMs()
        {
            return _calibrationOffsetMs;
        }

        public void ApplyCalibration()
        {
            PlayerPrefs.SetFloat(PREFS_KEY, _calibrationOffsetMs);
            PlayerPrefs.Save();

            if (_beatManager != null)
            {
                _beatManager.SetCalibrationOffset(_calibrationOffsetMs / 1000f);
            }
        }

        public void ResetCalibration()
        {
            _calibrationOffsetMs = 0f;
            PlayerPrefs.SetFloat(PREFS_KEY, 0f);
            PlayerPrefs.Save();

            if (_beatManager != null)
            {
                _beatManager.SetCalibrationOffset(0f);
            }

            if (_resultDisplayText != null)
                _resultDisplayText.text = "";
            if (_offsetDisplayText != null)
                _offsetDisplayText.text = "";
            if (_averageDisplayText != null)
                _averageDisplayText.text = "";
        }

        private void LoadSavedCalibration()
        {
            _calibrationOffsetMs = PlayerPrefs.GetFloat(PREFS_KEY, 0f);
        }

        private IEnumerator CalibrationSequence()
        {
            _isCalibrating = true;
            _samples.Clear();
            _beatTimes.Clear();

            EnsureAudioSource();

            if (_resultDisplayText != null)
                _resultDisplayText.text = "";
            if (_offsetDisplayText != null)
                _offsetDisplayText.text = "";
            if (_averageDisplayText != null)
                _averageDisplayText.text = "";

            for (int i = 3; i >= 1; i--)
            {
                if (_countdownText != null)
                    _countdownText.text = i.ToString();
                yield return new WaitForSecondsRealtime(1f);
            }

            if (_countdownText != null)
                _countdownText.text = "";

            bool clearedGo = false;
            while (_isCalibrating)
            {
                float beatTime = Time.time;
                _beatTimes.Add(beatTime);
                _audioSource.PlayOneShot(_audioSource.clip);

                if (!clearedGo)
                    clearedGo = true;

                yield return new WaitForSecondsRealtime(_beatInterval);
            }
        }

        private void RegisterTap()
        {
            if (_beatTimes.Count == 0) return;

            float tapTime = Time.time;
            float nearestOffset = FindNearestBeatOffset(tapTime);

            _samples.Add(nearestOffset);

            float runningAverage = ComputeRunningAverage();
            float sampleOffsetMs = nearestOffset * 1000f;
            float runningAverageMs = runningAverage * 1000f;

            UpdateOffsetDisplay(sampleOffsetMs);
            UpdateAverageDisplay(runningAverageMs);

            OnCalibrationSampleTaken?.Invoke(sampleOffsetMs, runningAverageMs);

            if (_samples.Count >= _requiredSamples)
            {
                StopCalibration();
            }
        }

        private float FindNearestBeatOffset(float tapTime)
        {
            float nearestOffset = float.MaxValue;

            for (int i = 0; i < _beatTimes.Count; i++)
            {
                float offset = tapTime - _beatTimes[i];
                if (Mathf.Abs(offset) < Mathf.Abs(nearestOffset))
                    nearestOffset = offset;
            }

            if (_beatTimes.Count > 0)
            {
                float lastBeat = _beatTimes[_beatTimes.Count - 1];
                float nextBeat = lastBeat + _beatInterval;
                float nextOffset = tapTime - nextBeat;
                if (Mathf.Abs(nextOffset) < Mathf.Abs(nearestOffset))
                    nearestOffset = nextOffset;
            }

            return nearestOffset;
        }

        private float ComputeRunningAverage()
        {
            if (_samples.Count == 0) return 0f;

            float sum = 0f;
            for (int i = 0; i < _samples.Count; i++)
                sum += _samples[i];

            return sum / _samples.Count;
        }

        private void ComputeResult()
        {
            if (_samples.Count < _requiredSamples)
            {
                if (_resultDisplayText != null)
                    _resultDisplayText.text = $"样本不足 (需{_requiredSamples}次，已{_samples.Count}次)";
                return;
            }

            List<float> sorted = new List<float>(_samples);
            sorted.Sort((a, b) => Mathf.Abs(a).CompareTo(Mathf.Abs(b)));

            int midStart = 2;
            int midCount = sorted.Count - 4;

            float sum = 0f;
            for (int i = midStart; i < midStart + midCount; i++)
                sum += sorted[i];

            float averageOffsetSec = sum / midCount;
            _calibrationOffsetMs = averageOffsetSec * 1000f;

            ShowFinalResult();
            OnCalibrationComplete?.Invoke(_calibrationOffsetMs);
        }

        private void ShowFinalResult()
        {
            if (_resultDisplayText == null) return;

            float absOffset = Mathf.Abs(_calibrationOffsetMs);

            if (absOffset < _goodThresholdMs)
            {
                _resultDisplayText.text = "校准良好，无需调整";
                _resultDisplayText.color = Color.green;
            }
            else
            {
                string sign = _calibrationOffsetMs >= 0 ? "+" : "";
                _resultDisplayText.text = $"建议偏移: {sign}{_calibrationOffsetMs:F0}ms";
                _resultDisplayText.color = Color.yellow;
            }
        }

        private void UpdateOffsetDisplay(float offsetMs)
        {
            if (_offsetDisplayText == null) return;

            string sign = offsetMs >= 0 ? "+" : "";
            _offsetDisplayText.text = $"{sign}{offsetMs:F0}ms";
            _offsetDisplayText.color = offsetMs >= 0 ? Color.green : Color.red;
        }

        private void UpdateAverageDisplay(float averageMs)
        {
            if (_averageDisplayText == null) return;

            string sign = averageMs >= 0 ? "+" : "";
            _averageDisplayText.text = $"平均: {sign}{averageMs:F0}ms";
        }

        private void EnsureAudioSource()
        {
            if (_audioSource == null)
            {
                _audioSource = GetComponent<AudioSource>();
                if (_audioSource == null)
                    _audioSource = gameObject.AddComponent<AudioSource>();
            }

            if (_audioSource.clip == null)
                _audioSource.clip = GenerateBeepClip();
        }

        private AudioClip GenerateBeepClip()
        {
            int sampleRate = 44100;
            int sampleCount = (int)(sampleRate * _beepDuration);
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = 1f;

                if (i < sampleCount * 0.1f)
                    envelope = (float)i / (sampleCount * 0.1f);
                else if (i > sampleCount * 0.7f)
                    envelope = (float)(sampleCount - i) / (sampleCount * 0.3f);

                samples[i] = Mathf.Sin(2f * Mathf.PI * _beepFrequency * t) * 0.5f * envelope;
            }

            AudioClip clip = AudioClip.Create("CalibrationBeep", sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }
    }
}
