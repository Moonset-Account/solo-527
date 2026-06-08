using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using RainAlley.Calibration;
using RainAlley.Core;
using RainAlley.GameFlow;
using RainAlley.InputSystem;

namespace RainAlley.UI
{
    public class CalibrationPageUI : MonoBehaviour
    {
        public GameObject BeatIndicator;
        public Image BeatRingImage;
        public Text ProgressText;
        public Text InstructionText;
        public Image ProgressFill;
        public GameObject ResultPanel;
        public Text RecommendedLatencyText;
        public Text StandardDeviationText;
        public Text WindowDescriptionText;
        public Text LatencyDescriptionText;
        public GameObject ManualAdjustPanel;
        public Text ManualLatencyText;
        public Slider LatencySlider;
        public Button LatencyMinusBtn;
        public Button LatencyPlusBtn;
        public Text PerfectWindowText;
        public Text GoodWindowText;
        public Slider PerfectWindowSlider;
        public Slider GoodWindowSlider;
        public Button StartCalibrationBtn;
        public Button SaveAndExitBtn;
        public Button CancelBtn;
        public Button UseRecommendedBtn;
        public Button ResetDefaultBtn;
        public Text HintText;
        public Text InputHintText;

        private CalibrationManager _calibration;
        private GameManager _game;
        private bool _inCalibration = false;
        private bool _initialized = false;
        private GameObject _calibrationRoot;
        private Color _beatRingOriginalColor;

        public void Init(GameObject root)
        {
            _calibrationRoot = root;
            _game = GameManager.Instance;
            _calibration = _game.Calibration;

            if (BeatRingImage != null) _beatRingOriginalColor = BeatRingImage.color;
            BindEvents();
            RefreshManualUI();
            if (_game != null) _game.OnStateChanged += HandleGameStateChanged;

            if (LatencySlider != null)
            {
                LatencySlider.minValue = -200;
                LatencySlider.maxValue = 200;
            }
            if (PerfectWindowSlider != null)
            {
                PerfectWindowSlider.minValue = 40;
                PerfectWindowSlider.maxValue = 150;
            }
            if (GoodWindowSlider != null)
            {
                GoodWindowSlider.minValue = 90;
                GoodWindowSlider.maxValue = 320;
            }

            SetCalibrationActive(false);
            _initialized = true;
        }

        private void OnDestroy()
        {
            if (_game != null) _game.OnStateChanged -= HandleGameStateChanged;
            if (_calibration != null)
            {
                _calibration.OnTrialProgress -= OnTrialProgress;
                _calibration.OnCalibrationComplete -= OnCalibrationComplete;
                _calibration.OnWindowsUpdated -= OnWindowsUpdated;
            }
            if (_game?.Clock != null) _game.Clock.OnBeat -= OnBeatPulse;
        }

        private void BindEvents()
        {
            if (StartCalibrationBtn != null)
                StartCalibrationBtn.onClick.AddListener(OnStartCalibration);
            if (SaveAndExitBtn != null)
                SaveAndExitBtn.onClick.AddListener(OnSaveAndExit);
            if (CancelBtn != null)
                CancelBtn.onClick.AddListener(OnCancel);
            if (UseRecommendedBtn != null)
                UseRecommendedBtn.onClick.AddListener(OnUseRecommended);
            if (ResetDefaultBtn != null)
                ResetDefaultBtn.onClick.AddListener(OnResetDefaults);
            if (LatencyMinusBtn != null)
                LatencyMinusBtn.onClick.AddListener(() => AdjustLatency(-10));
            if (LatencyPlusBtn != null)
                LatencyPlusBtn.onClick.AddListener(() => AdjustLatency(10));
            if (LatencySlider != null)
                LatencySlider.onValueChanged.AddListener(OnLatencySliderChanged);
            if (PerfectWindowSlider != null)
                PerfectWindowSlider.onValueChanged.AddListener(OnPerfectWindowChanged);
            if (GoodWindowSlider != null)
                GoodWindowSlider.onValueChanged.AddListener(OnGoodWindowChanged);
            if (_calibration != null)
            {
                _calibration.OnTrialProgress += OnTrialProgress;
                _calibration.OnCalibrationComplete += OnCalibrationComplete;
                _calibration.OnWindowsUpdated += OnWindowsUpdated;
            }
        }

        public void OpenPage()
        {
            SetCalibrationActive(true);
            if (ResultPanel != null) ResultPanel.SetActive(false);
            if (ManualAdjustPanel != null) ManualAdjustPanel.SetActive(true);
            RefreshManualUI();

            string hint = _game.Input.GetHintForAction(GameInputAction.Judge);
            if (InputHintText != null) InputHintText.text = $"操作提示：{hint}";
            ShowInstruction("根据雨声和节拍提示，在正确时刻点击判定按钮（空格）");
        }

        private void SetCalibrationActive(bool active)
        {
            if (_calibrationRoot != null) _calibrationRoot.SetActive(active);
        }

        private void OnStartCalibration()
        {
            _inCalibration = true;
            if (ResultPanel != null) ResultPanel.SetActive(false);
            if (ManualAdjustPanel != null) ManualAdjustPanel.SetActive(false);
            if (StartCalibrationBtn != null) StartCalibrationBtn.gameObject.SetActive(false);
            ShowInstruction("准备...跟随雨声的节拍点击判定键！");
            _game.StartCalibrationMode();
            if (_game.Clock != null) _game.Clock.OnBeat += OnBeatPulse;
            OnTrialProgress(0);
        }

        private void OnBeatPulse(int beatIdx)
        {
            if (BeatIndicator != null || BeatRingImage != null)
            {
                StopAllCoroutines();
                StartCoroutine(PulseBeatRing());
            }
        }

        private IEnumerator PulseBeatRing()
        {
            float t = 0;
            float duration = 0.18f;
            Vector3 origScale = BeatIndicator != null ? BeatIndicator.transform.localScale : Vector3.one;
            Color origColor = _beatRingOriginalColor;
            while (t < duration)
            {
                t += Time.deltaTime;
                float k = t / duration;
                float s = 1f + Mathf.Sin(k * Mathf.PI) * 0.3f;
                if (BeatIndicator != null)
                    BeatIndicator.transform.localScale = origScale * s;
                if (BeatRingImage != null)
                    BeatRingImage.color = Color.Lerp(
                        new Color(1f, 0.85f, 0.35f, 0.65f), origColor, k);
                yield return null;
            }
            if (BeatIndicator != null) BeatIndicator.transform.localScale = origScale;
            if (BeatRingImage != null) BeatRingImage.color = origColor;
        }

        private void OnTrialProgress(int progress)
        {
            int total = _calibration.RequiredTrials;
            if (ProgressText != null) ProgressText.text = $"{progress} / {total}";
            if (ProgressFill != null)
            {
                float f = total > 0 ? (float)progress / total : 0f;
                var rt = ProgressFill.rectTransform;
                rt.anchorMax = new Vector2(f, 1f);
            }
            if (progress == 0) ShowInstruction("跟随雨声节拍点击判定键（空格/F/回车）");
            else if (progress < total / 2) ShowInstruction("继续保持，稳定你的节奏...");
            else if (progress < total) ShowInstruction("快完成了，最后几下保持稳定");
        }

        private void OnCalibrationComplete(double recommended, double stdDev, double totalLatency)
        {
            _inCalibration = false;
            if (_game?.Clock != null) _game.Clock.OnBeat -= OnBeatPulse;
            _game.EndCalibrationMode();
            if (StartCalibrationBtn != null) StartCalibrationBtn.gameObject.SetActive(true);
            if (ResultPanel != null) ResultPanel.SetActive(true);
            if (ManualAdjustPanel != null) ManualAdjustPanel.SetActive(true);

            if (RecommendedLatencyText != null)
                RecommendedLatencyText.text = $"{recommended:F0} ms";
            if (StandardDeviationText != null)
                StandardDeviationText.text = $"稳定性（离散度）：{stdDev:F0} ms";

            RefreshManualUI();

            string verdict = stdDev < 25 ? "表现优秀！判定窗口已自动收紧"
                          : stdDev < 50 ? "表现不错，窗口适中"
                          : "稳定性一般，建议再校准一次";
            ShowInstruction($"校准完成！{verdict}");
        }

        private void OnUseRecommended()
        {
            _calibration.SetManualLatency(_calibration.Settings.RecommendedLatencyMs);
            RefreshManualUI();
            ShowHint("已应用推荐延迟值");
        }

        private void OnResetDefaults()
        {
            _calibration.ResetToDefaults();
            RefreshManualUI();
            ShowHint("已恢复默认校准设置");
        }

        private void AdjustLatency(int delta)
        {
            double nv = _calibration.Settings.InputLatencyMs + delta;
            _calibration.SetManualLatency(nv);
            RefreshManualUI();
        }

        private void OnLatencySliderChanged(float val)
        {
            if (_inCalibration) return;
            _calibration.SetManualLatency(val);
            RefreshManualUI();
        }

        private void OnPerfectWindowChanged(float val)
        {
            double good = Mathf.Max(val + 30, (float)_calibration.Settings.GoodWindowMs);
            _calibration.SetManualWindows(val, good);
            RefreshManualUI();
        }

        private void OnGoodWindowChanged(float val)
        {
            _calibration.SetManualWindows(_calibration.Settings.PerfectWindowMs, val);
            RefreshManualUI();
        }

        private void OnWindowsUpdated(double perfectMs, double goodMs)
        {
            RefreshManualUI();
        }

        private void RefreshManualUI()
        {
            var s = _calibration.Settings;
            if (ManualLatencyText != null)
                ManualLatencyText.text = $"{s.TotalLatencyMs:F0} ms";
            if (LatencySlider != null && !_inCalibration)
                LatencySlider.SetValueWithoutNotify((float)s.InputLatencyMs);
            if (PerfectWindowText != null)
                PerfectWindowText.text = $"{s.PerfectWindowMs:F0} ms";
            if (PerfectWindowSlider != null && !_inCalibration)
                PerfectWindowSlider.SetValueWithoutNotify((float)s.PerfectWindowMs);
            if (GoodWindowText != null)
                GoodWindowText.text = $"{s.GoodWindowMs:F0} ms";
            if (GoodWindowSlider != null && !_inCalibration)
                GoodWindowSlider.SetValueWithoutNotify((float)s.GoodWindowMs);
            if (WindowDescriptionText != null)
                WindowDescriptionText.text = _calibration.GetWindowDescription();
            if (LatencyDescriptionText != null)
                LatencyDescriptionText.text = _calibration.GetLatencyDescription();
        }

        private void OnSaveAndExit()
        {
            _calibration.SaveSettings();
            _game.ChangeStatePublic(GameState.Menu);
            SetCalibrationActive(false);
        }

        private void OnCancel()
        {
            if (_inCalibration)
            {
                if (_game?.Clock != null) _game.Clock.OnBeat -= OnBeatPulse;
                _game.EndCalibrationMode();
                _inCalibration = false;
            }
            _game.ChangeStatePublic(GameState.Menu);
            SetCalibrationActive(false);
        }

        private void ShowInstruction(string msg)
        {
            if (InstructionText != null) InstructionText.text = msg;
        }

        private void ShowHint(string msg)
        {
            if (HintText == null) return;
            HintText.text = msg;
            StopAllCoroutines();
            StartCoroutine(ClearHintAfter(2.5f));
        }

        private IEnumerator ClearHintAfter(float seconds)
        {
            yield return new WaitForSeconds(seconds);
            if (HintText != null) HintText.text = "";
        }

        private void HandleGameStateChanged(GameState oldState, GameState newState)
        {
            if (!_initialized) return;
            if (newState == GameState.Calibration &&
                (_calibrationRoot == null || !_calibrationRoot.activeSelf))
            {
                OpenPage();
            }
        }
    }
}
