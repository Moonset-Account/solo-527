using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.Audio
{
    public class AudioCalibration : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _calibrationRoot;
        [SerializeField] private Button _startBtn;
        [SerializeField] private Button _tapBtn;
        [SerializeField] private Button _applyBtn;
        [SerializeField] private Button _cancelBtn;
        [SerializeField] private Slider _manualSlider;
        [SerializeField] private Text _latencyValueText;
        [SerializeField] private Text _statusText;
        [SerializeField] private Text _tapCountText;
        [SerializeField] private AudioClip _metronomeClip;

        [Header("Calibration Settings")]
        [SerializeField] private float _calibrationBpm = 100f;
        [SerializeField] private int _minTaps = 8;
        [SerializeField] private int _maxTaps = 32;

        private Coroutine _calibrationCoroutine;
        private readonly System.Collections.Generic.List<double> _tapOffsets = new System.Collections.Generic.List<double>();
        private double _lastBeatTime;
        private int _currentBeat;
        private bool _isCalibrating;
        private float _computedLatencyMs;
        private float _currentLatencyMs;

        public event Action<float> OnCalibrationComplete;
        public event Action OnCalibrationCancelled;

        private void OnEnable()
        {
            if (_startBtn) _startBtn.onClick.AddListener(StartAutoCalibration);
            if (_tapBtn) _tapBtn.onClick.AddListener(RegisterTap);
            if (_applyBtn) _applyBtn.onClick.AddListener(ApplyLatency);
            if (_cancelBtn) _cancelBtn.onClick.AddListener(CancelCalibration);
            if (_manualSlider)
            {
                _manualSlider.onValueChanged.AddListener(OnManualSliderChanged);
                _manualSlider.minValue = -500f;
                _manualSlider.maxValue = 500f;
            }

            _currentLatencyMs = AudioManager.Instance != null
                ? AudioManager.Instance.audioLatencyMs
                : 0f;

            if (_manualSlider) _manualSlider.value = _currentLatencyMs;
            UpdateLatencyDisplay(_currentLatencyMs);
        }

        public void Show()
        {
            if (_calibrationRoot) _calibrationRoot.SetActive(true);
            if (_manualSlider)
            {
                _currentLatencyMs = AudioManager.Instance != null
                    ? AudioManager.Instance.audioLatencyMs
                    : 0f;
                _manualSlider.value = _currentLatencyMs;
                UpdateLatencyDisplay(_currentLatencyMs);
            }
            if (_statusText) _statusText.text = "点击「开始校准」后跟随节拍点击按钮";
            if (_tapCountText) _tapCountText.text = $"0 / {_minTaps}";
        }

        public void Hide()
        {
            if (_calibrationRoot) _calibrationRoot.SetActive(false);
        }

        private void OnDisable()
        {
            if (_startBtn) _startBtn.onClick.RemoveListener(StartAutoCalibration);
            if (_tapBtn) _tapBtn.onClick.RemoveListener(RegisterTap);
            if (_applyBtn) _applyBtn.onClick.RemoveListener(ApplyLatency);
            if (_cancelBtn) _cancelBtn.onClick.RemoveListener(CancelCalibration);
            if (_manualSlider) _manualSlider.onValueChanged.RemoveListener(OnManualSliderChanged);
        }

        public void StartAutoCalibration()
        {
            Show();
            if (_isCalibrating) return;
            _isCalibrating = true;
            _tapOffsets.Clear();
            _currentBeat = 0;

            if (_statusText) _statusText.text = "跟随节拍点击按钮";
            if (_tapCountText) _tapCountText.text = $"0 / {_minTaps}";

            _calibrationCoroutine = StartCoroutine(RunMetronome());
        }

        private IEnumerator RunMetronome()
        {
            float secondsPerBeat = 60f / _calibrationBpm;
            int totalBeats = _maxTaps + 4;
            int startDelayBeats = 2;

            _lastBeatTime = AudioSettings.dspTime + 0.5;

            for (int i = 0; i < totalBeats; i++)
            {
                double scheduledTime = _lastBeatTime + i * secondsPerBeat;

                while (AudioSettings.dspTime < scheduledTime - 0.01)
                {
                    yield return null;
                }

                AudioManager.Instance?.PlaySfx(_metronomeClip);

                if (i >= startDelayBeats)
                {
                    _lastBeatTime = scheduledTime;
                }
            }

            if (_tapOffsets.Count >= _minTaps)
            {
                CompleteCalibration();
            }
            else
            {
                if (_statusText) _statusText.text = "点击次数不足，请重试";
                _isCalibrating = false;
            }
        }

        public void RegisterTap()
        {
            if (!_isCalibrating) return;
            if (_currentBeat < _minTaps)
            {
                double currentDsp = AudioSettings.dspTime;
                double offset = currentDsp - _lastBeatTime;
                _tapOffsets.Add(offset);
                _currentBeat++;

                if (_tapCountText) _tapCountText.text = $"{_currentBeat} / {_minTaps}";

                if (_currentBeat >= _maxTaps)
                {
                    CompleteCalibration();
                }
            }
        }

        private void CompleteCalibration()
        {
            _isCalibrating = false;
            if (_calibrationCoroutine != null)
            {
                StopCoroutine(_calibrationCoroutine);
                _calibrationCoroutine = null;
            }

            if (_tapOffsets.Count == 0)
            {
                if (_statusText) _statusText.text = "校准失败，请重试";
                return;
            }

            double sum = 0;
            foreach (var offset in _tapOffsets)
            {
                sum += offset;
            }
            double avg = sum / _tapOffsets.Count;
            _computedLatencyMs = (float)(avg * 1000.0);

            _currentLatencyMs = _computedLatencyMs;
            if (_manualSlider) _manualSlider.value = _computedLatencyMs;
            UpdateLatencyDisplay(_computedLatencyMs);

            if (_statusText) _statusText.text = $"校准完成: {_computedLatencyMs:F0}ms";
        }

        private void OnManualSliderChanged(float value)
        {
            _currentLatencyMs = value;
            UpdateLatencyDisplay(value);
        }

        private void UpdateLatencyDisplay(float ms)
        {
            if (_latencyValueText)
            {
                _latencyValueText.text = $"{ms:F0} ms";
            }
        }

        public void ApplyLatency()
        {
            AudioManager.Instance?.SetLatency(_currentLatencyMs);
            if (Core.SaveSystem.CurrentSave != null)
            {
                Core.SaveSystem.CurrentSave.audioLatencyMs = _currentLatencyMs;
                Core.SaveSystem.SaveSaveData();
            }
            Hide();
            OnCalibrationComplete?.Invoke(_currentLatencyMs);
        }

        public void CancelCalibration()
        {
            if (_isCalibrating && _calibrationCoroutine != null)
            {
                StopCoroutine(_calibrationCoroutine);
                _calibrationCoroutine = null;
            }
            _isCalibrating = false;
            Hide();
            OnCalibrationCancelled?.Invoke();
        }

        public void TestLatency()
        {
            AudioManager.Instance?.PlaySfx(_metronomeClip);
        }
    }
}
