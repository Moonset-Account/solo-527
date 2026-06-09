using System;
using BeatRunner.Audio;
using BeatRunner.Core;
using BeatRunner.Input;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class SettingsMenu : MonoBehaviour
    {
        [SerializeField] private GameObject _settingsRoot;
        [SerializeField] private GameObject _generalTab;
        [SerializeField] private GameObject _audioTab;
        [SerializeField] private GameObject _inputTab;
        [SerializeField] private GameObject _graphicsTab;

        [SerializeField] private Button _generalTabBtn;
        [SerializeField] private Button _audioTabBtn;
        [SerializeField] private Button _inputTabBtn;
        [SerializeField] private Button _graphicsTabBtn;
        [SerializeField] private Button _closeBtn;

        [Header("General")]
        [SerializeField] private Toggle _showTutorialToggle;
        [SerializeField] private Slider _masterVolumeSlider;
        [SerializeField] private Text _masterVolumeText;

        [Header("Audio")]
        [SerializeField] private Slider _musicVolumeSlider;
        [SerializeField] private Text _musicVolumeText;
        [SerializeField] private Slider _sfxVolumeSlider;
        [SerializeField] private Text _sfxVolumeText;
        [SerializeField] private Slider _latencySlider;
        [SerializeField] private Text _latencyText;
        [SerializeField] private Button _calibrateBtn;
        [SerializeField] private Button _testLatencyBtn;

        [Header("Input")]
        [SerializeField] private InputTypeDisplay _inputTypeDisplay;
        [SerializeField] private Button _remapJumpBtn;
        [SerializeField] private Button _remapSlideBtn;
        [SerializeField] private Button _remapLeftBtn;
        [SerializeField] private Button _remapRightBtn;
        [SerializeField] private Text _remapJumpText;
        [SerializeField] private Text _remapSlideText;
        [SerializeField] private Text _remapLeftText;
        [SerializeField] private Text _remapRightText;

        [Header("Graphics")]
        [SerializeField] private Dropdown _qualityDropdown;
        [SerializeField] private Slider _targetFpsSlider;
        [SerializeField] private Text _targetFpsText;
        [SerializeField] private Toggle _vsyncToggle;
        [SerializeField] private Toggle _showPerfStatsToggle;

        public event Action OnClose;
        public event Action<float> OnLatencyChanged;

        private bool _isListeningForRemap;
        private string _remapTargetAction;

        private void OnEnable()
        {
            if (_generalTabBtn) _generalTabBtn.onClick.AddListener(() => SelectTab(0));
            if (_audioTabBtn) _audioTabBtn.onClick.AddListener(() => SelectTab(1));
            if (_inputTabBtn) _inputTabBtn.onClick.AddListener(() => SelectTab(2));
            if (_graphicsTabBtn) _graphicsTabBtn.onClick.AddListener(() => SelectTab(3));
            if (_closeBtn) _closeBtn.onClick.AddListener(Close);

            if (_masterVolumeSlider) _masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
            if (_musicVolumeSlider) _musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            if (_sfxVolumeSlider) _sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);
            if (_latencySlider)
            {
                _latencySlider.onValueChanged.AddListener(OnLatencyChangedInternal);
                _latencySlider.minValue = -500f;
                _latencySlider.maxValue = 500f;
            }
            if (_targetFpsSlider)
            {
                _targetFpsSlider.onValueChanged.AddListener(OnTargetFpsChanged);
                _targetFpsSlider.minValue = 30f;
                _targetFpsSlider.maxValue = 144f;
            }

            if (_showTutorialToggle) _showTutorialToggle.onValueChanged.AddListener(OnShowTutorialChanged);
            if (_qualityDropdown) _qualityDropdown.onValueChanged.AddListener(OnQualityChanged);
            if (_vsyncToggle) _vsyncToggle.onValueChanged.AddListener(OnVsyncChanged);
            if (_showPerfStatsToggle) _showPerfStatsToggle.onValueChanged.AddListener(OnShowPerfStatsChanged);

            if (_calibrateBtn) _calibrateBtn.onClick.AddListener(StartCalibration);
            if (_testLatencyBtn) _testLatencyBtn.onClick.AddListener(TestLatency);

            if (_remapJumpBtn) _remapJumpBtn.onClick.AddListener(() => StartRemap("jump"));
            if (_remapSlideBtn) _remapSlideBtn.onClick.AddListener(() => StartRemap("slide"));
            if (_remapLeftBtn) _remapLeftBtn.onClick.AddListener(() => StartRemap("left"));
            if (_remapRightBtn) _remapRightBtn.onClick.AddListener(() => StartRemap("right"));

            LoadSettings();
        }

        private void OnDisable()
        {
            if (_generalTabBtn) _generalTabBtn.onClick.RemoveAllListeners();
            if (_audioTabBtn) _audioTabBtn.onClick.RemoveAllListeners();
            if (_inputTabBtn) _inputTabBtn.onClick.RemoveAllListeners();
            if (_graphicsTabBtn) _graphicsTabBtn.onClick.RemoveAllListeners();
            if (_closeBtn) _closeBtn.onClick.RemoveAllListeners();

            if (_masterVolumeSlider) _masterVolumeSlider.onValueChanged.RemoveAllListeners();
            if (_musicVolumeSlider) _musicVolumeSlider.onValueChanged.RemoveAllListeners();
            if (_sfxVolumeSlider) _sfxVolumeSlider.onValueChanged.RemoveAllListeners();
            if (_latencySlider) _latencySlider.onValueChanged.RemoveAllListeners();
            if (_targetFpsSlider) _targetFpsSlider.onValueChanged.RemoveAllListeners();

            if (_showTutorialToggle) _showTutorialToggle.onValueChanged.RemoveAllListeners();
            if (_qualityDropdown) _qualityDropdown.onValueChanged.RemoveAllListeners();
            if (_vsyncToggle) _vsyncToggle.onValueChanged.RemoveAllListeners();
            if (_showPerfStatsToggle) _showPerfStatsToggle.onValueChanged.RemoveAllListeners();

            if (_calibrateBtn) _calibrateBtn.onClick.RemoveAllListeners();
            if (_testLatencyBtn) _testLatencyBtn.onClick.RemoveAllListeners();
        }

        private void Update()
        {
            if (_isListeningForRemap)
            {
                ListenForRemapInput();
            }
        }

        public void Show()
        {
            if (_settingsRoot) _settingsRoot.SetActive(true);
            LoadSettings();
            SelectTab(1);
            GameStateManager.Instance?.ChangeState(GameStateManager.GameState.Settings);
        }

        public void Hide()
        {
            if (_settingsRoot) _settingsRoot.SetActive(false);
            _isListeningForRemap = false;
        }

        public void Close()
        {
            SaveSettings();
            Hide();
            OnClose?.Invoke();
            GameStateManager.Instance?.CloseSettings();
        }

        private void SelectTab(int index)
        {
            if (_generalTab) _generalTab.SetActive(index == 0);
            if (_audioTab) _audioTab.SetActive(index == 1);
            if (_inputTab) _inputTab.SetActive(index == 2);
            if (_graphicsTab) _graphicsTab.SetActive(index == 3);

            SetTabButtonState(_generalTabBtn, index == 0);
            SetTabButtonState(_audioTabBtn, index == 1);
            SetTabButtonState(_inputTabBtn, index == 2);
            SetTabButtonState(_graphicsTabBtn, index == 3);
        }

        private void SetTabButtonState(Button btn, bool active)
        {
            if (btn == null) return;
            var colors = btn.colors;
            colors.normalColor = active ? new Color(0.3f, 0.6f, 1f) : Color.white;
            btn.colors = colors;
        }

        private void LoadSettings()
        {
            var save = SaveSystem.CurrentSave;

            if (_masterVolumeSlider)
            {
                float v = AudioListener.volume;
                _masterVolumeSlider.value = v;
                if (_masterVolumeText) _masterVolumeText.text = Mathf.RoundToInt(v * 100) + "%";
            }

            if (AudioManager.Instance != null)
            {
                if (_musicVolumeSlider)
                {
                    _musicVolumeSlider.value = AudioManager.Instance.musicVolume;
                    if (_musicVolumeText) _musicVolumeText.text = Mathf.RoundToInt(AudioManager.Instance.musicVolume * 100) + "%";
                }
                if (_sfxVolumeSlider)
                {
                    _sfxVolumeSlider.value = AudioManager.Instance.sfxVolume;
                    if (_sfxVolumeText) _sfxVolumeText.text = Mathf.RoundToInt(AudioManager.Instance.sfxVolume * 100) + "%";
                }
                if (_latencySlider)
                {
                    _latencySlider.value = save.audioLatencyMs;
                    if (_latencyText) _latencyText.text = $"{save.audioLatencyMs:F0} ms";
                }
            }

            if (_showTutorialToggle) _showTutorialToggle.isOn = save.tutorialCompleted;

            if (_targetFpsSlider)
            {
                _targetFpsSlider.value = save.targetFrameRate;
                if (_targetFpsText) _targetFpsText.text = save.targetFrameRate + " FPS";
                Application.targetFrameRate = save.targetFrameRate;
            }

            if (_qualityDropdown)
            {
                _qualityDropdown.ClearOptions();
                _qualityDropdown.AddOptions(new System.Collections.Generic.List<string>(QualitySettings.names));
                _qualityDropdown.value = QualitySettings.GetQualityLevel();
            }

            if (_vsyncToggle) _vsyncToggle.isOn = QualitySettings.vSyncCount > 0;

            if (ServiceLocator.TryGet(out GameSettings settings) && _showPerfStatsToggle)
            {
                _showPerfStatsToggle.isOn = settings.enablePerformanceStats;
            }

            RefreshRemapDisplay();
        }

        private void SaveSettings()
        {
            var save = SaveSystem.CurrentSave;
            save.targetFrameRate = Mathf.RoundToInt(_targetFpsSlider.value);
            save.audioLatencyMs = _latencySlider.value;
            SaveSystem.SaveSaveData();
        }

        private void OnMasterVolumeChanged(float v)
        {
            AudioListener.volume = v;
            if (_masterVolumeText) _masterVolumeText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void OnMusicVolumeChanged(float v)
        {
            if (AudioManager.Instance != null) AudioManager.Instance.musicVolume = v;
            if (_musicVolumeText) _musicVolumeText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void OnSfxVolumeChanged(float v)
        {
            if (AudioManager.Instance != null) AudioManager.Instance.sfxVolume = v;
            if (_sfxVolumeText) _sfxVolumeText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void OnLatencyChangedInternal(float v)
        {
            if (_latencyText) _latencyText.text = $"{v:F0} ms";
            if (AudioManager.Instance != null) AudioManager.Instance.SetLatency(v);
            OnLatencyChanged?.Invoke(v);
        }

        private void OnTargetFpsChanged(float v)
        {
            int fps = Mathf.RoundToInt(v);
            Application.targetFrameRate = fps;
            if (_targetFpsText) _targetFpsText.text = fps + " FPS";
            SaveSystem.CurrentSave.targetFrameRate = fps;
        }

        private void OnQualityChanged(int level)
        {
            QualitySettings.SetQualityLevel(level, true);
        }

        private void OnVsyncChanged(bool enable)
        {
            QualitySettings.vSyncCount = enable ? 1 : 0;
        }

        private void OnShowTutorialChanged(bool enable)
        {
            SaveSystem.CurrentSave.tutorialCompleted = enable;
        }

        private void OnShowPerfStatsChanged(bool enable)
        {
            if (ServiceLocator.TryGet(out GameSettings settings))
            {
                settings.enablePerformanceStats = enable;
            }
        }

        private void StartCalibration()
        {
            var all = Resources.FindObjectsOfTypeAll<AudioCalibration>();
            foreach (var a in all)
            {
                if (a != null && a.gameObject.scene.IsValid())
                {
                    a.StartAutoCalibration();
                    return;
                }
            }
        }

        private void TestLatency()
        {
            var all = Resources.FindObjectsOfTypeAll<AudioCalibration>();
            foreach (var a in all)
            {
                if (a != null && a.gameObject.scene.IsValid())
                {
                    a.TestLatency();
                    return;
                }
            }
        }

        private void StartRemap(string action)
        {
            _isListeningForRemap = true;
            _remapTargetAction = action;
            UpdateRemapButtonText(action, "按任意键...");
        }

        private void ListenForRemapInput()
        {
            foreach (KeyCode k in System.Enum.GetValues(typeof(KeyCode)))
            {
                if (k == KeyCode.None) continue;
                if (Input.GetKeyDown(k))
                {
                    if (k == KeyCode.Escape)
                    {
                        _isListeningForRemap = false;
                        RefreshRemapDisplay();
                        return;
                    }

                    ApplyRemap(_remapTargetAction, k);
                    _isListeningForRemap = false;
                    RefreshRemapDisplay();
                    return;
                }
            }
        }

        private void ApplyRemap(string action, KeyCode key)
        {
            if (InputManager.Instance == null) return;
            var bindings = InputManager.Instance.Bindings;
            switch (action)
            {
                case "jump": bindings.jumpKey = key; break;
                case "slide": bindings.slideKey = key; break;
                case "left": bindings.leftKey = key; break;
                case "right": bindings.rightKey = key; break;
            }
            InputManager.Instance.LoadBindingsFromSaveData();
            InputManager.Instance.SetInputBindings(bindings);
        }

        private void RefreshRemapDisplay()
        {
            if (InputManager.Instance == null) return;
            UpdateRemapButtonText("jump",
                string.Join(" / ", InputManager.Instance.GetKeyHintsForAction("jump")));
            UpdateRemapButtonText("slide",
                string.Join(" / ", InputManager.Instance.GetKeyHintsForAction("slide")));
            UpdateRemapButtonText("left",
                string.Join(" / ", InputManager.Instance.GetKeyHintsForAction("left")));
            UpdateRemapButtonText("right",
                string.Join(" / ", InputManager.Instance.GetKeyHintsForAction("right")));
        }

        private void UpdateRemapButtonText(string action, string text)
        {
            switch (action)
            {
                case "jump": if (_remapJumpText) _remapJumpText.text = text; break;
                case "slide": if (_remapSlideText) _remapSlideText.text = text; break;
                case "left": if (_remapLeftText) _remapLeftText.text = text; break;
                case "right": if (_remapRightText) _remapRightText.text = text; break;
            }
        }
    }
}
