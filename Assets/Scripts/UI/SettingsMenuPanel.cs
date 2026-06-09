using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class SettingsMenuPanel : UIPanelBase
    {
        [Header("音频设置")]
        [SerializeField] private Slider masterVolumeSlider;
        [SerializeField] private Text masterVolumeValue;
        [SerializeField] private Slider musicVolumeSlider;
        [SerializeField] private Text musicVolumeValue;
        [SerializeField] private Slider sfxVolumeSlider;
        [SerializeField] private Text sfxVolumeValue;
        [SerializeField] private Slider ambientVolumeSlider;
        [SerializeField] private Text ambientVolumeValue;

        [Header("画面设置")]
        [SerializeField] private Dropdown qualityDropdown;
        [SerializeField] private Dropdown resolutionDropdown;
        [SerializeField] private Toggle fullscreenToggle;
        [SerializeField] private Toggle showFPSToggle;
        [SerializeField] private Dropdown languageDropdown;

        [Header("游戏设置")]
        [SerializeField] private Toggle enableHintsToggle;
        [SerializeField] private Toggle enableWeatherWarningsToggle;
        [SerializeField] private Slider cameraShakeSlider;
        [SerializeField] private Text cameraShakeValue;

        [Header("操作按钮")]
        [SerializeField] private Button applyButton;
        [SerializeField] private Button resetButton;
        [SerializeField] private Button backButton;
        [SerializeField] private Button resetProgressButton;

        private Resolution[] availableResolutions;
        private SettingsData tempSettings;

        private Slider builtMasterVolumeSlider;
        private Text builtMasterVolumeLabel;
        private Text builtMasterVolumeValue;
        private Slider builtMusicVolumeSlider;
        private Text builtMusicVolumeLabel;
        private Text builtMusicVolumeValue;
        private Slider builtSfxVolumeSlider;
        private Text builtSfxVolumeLabel;
        private Text builtSfxVolumeValue;
        private Slider builtAmbientVolumeSlider;
        private Text builtAmbientVolumeLabel;
        private Text builtAmbientVolumeValue;

        private Toggle builtFullscreenToggle;
        private Toggle builtShowFPSToggle;
        private Toggle builtEnableHintsToggle;
        private Toggle builtEnableWeatherWarningsToggle;

        private Button builtApplyButton;
        private Button builtResetButton;
        private Button builtBackButton;

        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Vector2 ButtonSize = new Vector2(200f, 52f);

        private void Awake()
        {
            panelType = UIType.SettingsMenu;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();
            if (panelContent == null) return;

            var contentRoot = panelContent.transform;

            RuntimeUIBuilder.CreateTitle(contentRoot, "系统设置", 52, -10f);

            var mainGroup = RuntimeUIBuilder.CreateVerticalGroup(contentRoot, "MainGroup", 14f, 100f, 60f, 0f, 0f);

            var audioSection = RuntimeUIBuilder.CreateVerticalGroup(mainGroup.transform, "AudioSection", 8f, 0f, 0f, 0f, 0f);
            RuntimeUIBuilder.CreateTitle(audioSection.transform, "音频设置", 28, 0f);

            builtMasterVolumeLabel = RuntimeUIBuilder.CreateLabel(audioSection.transform, "主音量", 22,
                TextAnchor.MiddleLeft, 600, 32);
            builtMasterVolumeSlider = RuntimeUIBuilder.CreateSlider(audioSection.transform, "MasterVolume", 600f,
                0f, 1f, 1f);
            builtMasterVolumeSlider.onValueChanged.AddListener(OnBuiltMasterVolumeChanged);
            builtMasterVolumeValue = RuntimeUIBuilder.CreateLabel(audioSection.transform, "100%", 20,
                TextAnchor.MiddleRight, 600, 28);

            builtMusicVolumeLabel = RuntimeUIBuilder.CreateLabel(audioSection.transform, "音乐音量", 22,
                TextAnchor.MiddleLeft, 600, 32);
            builtMusicVolumeSlider = RuntimeUIBuilder.CreateSlider(audioSection.transform, "MusicVolume", 600f,
                0f, 1f, 0.7f);
            builtMusicVolumeSlider.onValueChanged.AddListener(OnBuiltMusicVolumeChanged);
            builtMusicVolumeValue = RuntimeUIBuilder.CreateLabel(audioSection.transform, "70%", 20,
                TextAnchor.MiddleRight, 600, 28);

            builtSfxVolumeLabel = RuntimeUIBuilder.CreateLabel(audioSection.transform, "音效音量", 22,
                TextAnchor.MiddleLeft, 600, 32);
            builtSfxVolumeSlider = RuntimeUIBuilder.CreateSlider(audioSection.transform, "SfxVolume", 600f,
                0f, 1f, 0.9f);
            builtSfxVolumeSlider.onValueChanged.AddListener(OnBuiltSfxVolumeChanged);
            builtSfxVolumeValue = RuntimeUIBuilder.CreateLabel(audioSection.transform, "90%", 20,
                TextAnchor.MiddleRight, 600, 28);

            builtAmbientVolumeLabel = RuntimeUIBuilder.CreateLabel(audioSection.transform, "环境音音量", 22,
                TextAnchor.MiddleLeft, 600, 32);
            builtAmbientVolumeSlider = RuntimeUIBuilder.CreateSlider(audioSection.transform, "AmbientVolume", 600f,
                0f, 1f, 0.6f);
            builtAmbientVolumeSlider.onValueChanged.AddListener(OnBuiltAmbientVolumeChanged);
            builtAmbientVolumeValue = RuntimeUIBuilder.CreateLabel(audioSection.transform, "60%", 20,
                TextAnchor.MiddleRight, 600, 28);

            var displaySection = RuntimeUIBuilder.CreateVerticalGroup(mainGroup.transform, "DisplaySection", 8f, 16f, 0f, 0f, 0f);
            RuntimeUIBuilder.CreateTitle(displaySection.transform, "画面设置", 28, 0f);

            var togglesHGroup1 = RuntimeUIBuilder.CreateHorizontalGroup(displaySection.transform, "TogglesRow1", 60f);
            builtFullscreenToggle = RuntimeUIBuilder.CreateToggle(togglesHGroup1.transform, "全屏模式", false,
                OnBuiltFullscreenChanged);
            builtShowFPSToggle = RuntimeUIBuilder.CreateToggle(togglesHGroup1.transform, "显示FPS", false,
                OnBuiltShowFPSChanged);

            var togglesHGroup2 = RuntimeUIBuilder.CreateHorizontalGroup(displaySection.transform, "TogglesRow2", 60f);
            builtEnableHintsToggle = RuntimeUIBuilder.CreateToggle(togglesHGroup2.transform, "启用提示", true,
                OnBuiltEnableHintsChanged);
            builtEnableWeatherWarningsToggle = RuntimeUIBuilder.CreateToggle(togglesHGroup2.transform, "启用天气警告", true,
                OnBuiltEnableWeatherWarningsChanged);

            var buttonsSection = RuntimeUIBuilder.CreateHorizontalGroup(mainGroup.transform, "ButtonsSection", 30f);
            builtApplyButton = RuntimeUIBuilder.CreateButton(buttonsSection.transform, "应用设置", ButtonSize,
                OnApplyClicked, 24, ButtonNormalColor, ButtonHoverColor);
            builtResetButton = RuntimeUIBuilder.CreateButton(buttonsSection.transform, "恢复默认", ButtonSize,
                OnResetClicked, 24, ButtonNormalColor, ButtonHoverColor);
            builtBackButton = RuntimeUIBuilder.CreateButton(buttonsSection.transform, "返回", ButtonSize,
                OnBackClicked, 24, ButtonNormalColor, ButtonHoverColor);
        }

        private void Start()
        {
            InitializeUI();
            InitializeButtons();
        }

        private void InitializeUI()
        {
            availableResolutions = Screen.resolutions;
            if (resolutionDropdown != null)
            {
                resolutionDropdown.ClearOptions();
                var options = new List<string>();
                int currentResIndex = 0;
                for (int i = 0; i < availableResolutions.Length; i++)
                {
                    var r = availableResolutions[i];
                    options.Add($"{r.width} x {r.height} @ {r.refreshRate}Hz");
                    if (r.width == Screen.currentResolution.width && r.height == Screen.currentResolution.height)
                    {
                        currentResIndex = i;
                    }
                }
                resolutionDropdown.AddOptions(options);
                resolutionDropdown.value = Mathf.Clamp(currentResIndex, 0, options.Count - 1);
            }

            if (qualityDropdown != null)
            {
                qualityDropdown.ClearOptions();
                var names = QualitySettings.names;
                qualityDropdown.AddOptions(new List<string>(names));
            }

            if (languageDropdown != null)
            {
                languageDropdown.ClearOptions();
                languageDropdown.AddOptions(new List<string> { "简体中文", "English", "日本語" });
            }

            if (masterVolumeSlider != null) masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
            if (musicVolumeSlider != null) musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            if (sfxVolumeSlider != null) sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);
            if (ambientVolumeSlider != null) ambientVolumeSlider.onValueChanged.AddListener(OnAmbientVolumeChanged);
            if (cameraShakeSlider != null) cameraShakeSlider.onValueChanged.AddListener(OnCameraShakeChanged);
        }

        private void InitializeButtons()
        {
            if (applyButton) applyButton.onClick.AddListener(OnApplyClicked);
            if (resetButton) resetButton.onClick.AddListener(OnResetClicked);
            if (backButton) backButton.onClick.AddListener(OnBackClicked);
            if (resetProgressButton) resetProgressButton.onClick.AddListener(OnResetProgressClicked);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            LoadCurrentSettings();
        }

        private void LoadCurrentSettings()
        {
            var settings = SaveSystem.Instance?.CurrentSettings;
            if (settings == null)
            {
                tempSettings = new SettingsData
                {
                    masterVolume = 1f,
                    musicVolume = 0.7f,
                    sfxVolume = 0.9f,
                    ambientVolume = 0.6f,
                    fullscreen = true,
                    showFPS = false,
                    enableHints = true,
                    enableWeatherWarnings = true
                };
            }
            else
            {
                tempSettings = new SettingsData
                {
                    masterVolume = settings.masterVolume,
                    musicVolume = settings.musicVolume,
                    sfxVolume = settings.sfxVolume,
                    ambientVolume = settings.ambientVolume,
                    qualityLevel = settings.qualityLevel,
                    targetFrameRate = settings.targetFrameRate,
                    fullscreen = settings.fullscreen,
                    resolutionWidth = settings.resolutionWidth,
                    resolutionHeight = settings.resolutionHeight,
                    language = settings.language,
                    showFPS = settings.showFPS,
                    enableHints = settings.enableHints,
                    enableWeatherWarnings = settings.enableWeatherWarnings,
                    cameraShakeIntensity = settings.cameraShakeIntensity
                };
            }

            UpdateUIFromSettings(tempSettings);
        }

        private void UpdateUIFromSettings(SettingsData s)
        {
            if (masterVolumeSlider != null) masterVolumeSlider.value = s.masterVolume;
            if (masterVolumeValue != null) masterVolumeValue.text = $"{Mathf.RoundToInt(s.masterVolume * 100)}%";
            if (musicVolumeSlider != null) musicVolumeSlider.value = s.musicVolume;
            if (musicVolumeValue != null) musicVolumeValue.text = $"{Mathf.RoundToInt(s.musicVolume * 100)}%";
            if (sfxVolumeSlider != null) sfxVolumeSlider.value = s.sfxVolume;
            if (sfxVolumeValue != null) sfxVolumeValue.text = $"{Mathf.RoundToInt(s.sfxVolume * 100)}%";
            if (ambientVolumeSlider != null) ambientVolumeSlider.value = s.ambientVolume;
            if (ambientVolumeValue != null) ambientVolumeValue.text = $"{Mathf.RoundToInt(s.ambientVolume * 100)}%";

            if (qualityDropdown != null) qualityDropdown.value = s.qualityLevel;
            if (fullscreenToggle != null) fullscreenToggle.isOn = s.fullscreen;
            if (showFPSToggle != null) showFPSToggle.isOn = s.showFPS;

            if (enableHintsToggle != null) enableHintsToggle.isOn = s.enableHints;
            if (enableWeatherWarningsToggle != null) enableWeatherWarningsToggle.isOn = s.enableWeatherWarnings;
            if (cameraShakeSlider != null) cameraShakeSlider.value = s.cameraShakeIntensity;
            if (cameraShakeValue != null) cameraShakeValue.text = $"{Mathf.RoundToInt(s.cameraShakeIntensity * 100)}%";

            if (builtMasterVolumeSlider != null) builtMasterVolumeSlider.value = s.masterVolume;
            if (builtMasterVolumeValue != null) builtMasterVolumeValue.text = $"{Mathf.RoundToInt(s.masterVolume * 100)}%";
            if (builtMusicVolumeSlider != null) builtMusicVolumeSlider.value = s.musicVolume;
            if (builtMusicVolumeValue != null) builtMusicVolumeValue.text = $"{Mathf.RoundToInt(s.musicVolume * 100)}%";
            if (builtSfxVolumeSlider != null) builtSfxVolumeSlider.value = s.sfxVolume;
            if (builtSfxVolumeValue != null) builtSfxVolumeValue.text = $"{Mathf.RoundToInt(s.sfxVolume * 100)}%";
            if (builtAmbientVolumeSlider != null) builtAmbientVolumeSlider.value = s.ambientVolume;
            if (builtAmbientVolumeValue != null) builtAmbientVolumeValue.text = $"{Mathf.RoundToInt(s.ambientVolume * 100)}%";

            if (builtFullscreenToggle != null) builtFullscreenToggle.isOn = s.fullscreen;
            if (builtShowFPSToggle != null) builtShowFPSToggle.isOn = s.showFPS;
            if (builtEnableHintsToggle != null) builtEnableHintsToggle.isOn = s.enableHints;
            if (builtEnableWeatherWarningsToggle != null) builtEnableWeatherWarningsToggle.isOn = s.enableWeatherWarnings;
        }

        private void OnBuiltMasterVolumeChanged(float value)
        {
            tempSettings.masterVolume = value;
            if (builtMasterVolumeValue != null) builtMasterVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
            AudioManager.Instance?.ApplySettings(tempSettings.masterVolume, tempSettings.musicVolume,
                tempSettings.sfxVolume, tempSettings.ambientVolume);
        }

        private void OnBuiltMusicVolumeChanged(float value)
        {
            tempSettings.musicVolume = value;
            if (builtMusicVolumeValue != null) builtMusicVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
            AudioManager.Instance?.ApplySettings(tempSettings.masterVolume, tempSettings.musicVolume,
                tempSettings.sfxVolume, tempSettings.ambientVolume);
        }

        private void OnBuiltSfxVolumeChanged(float value)
        {
            tempSettings.sfxVolume = value;
            if (builtSfxVolumeValue != null) builtSfxVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
        }

        private void OnBuiltAmbientVolumeChanged(float value)
        {
            tempSettings.ambientVolume = value;
            if (builtAmbientVolumeValue != null) builtAmbientVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
        }

        private void OnBuiltFullscreenChanged(bool value)
        {
            tempSettings.fullscreen = value;
        }

        private void OnBuiltShowFPSChanged(bool value)
        {
            tempSettings.showFPS = value;
        }

        private void OnBuiltEnableHintsChanged(bool value)
        {
            tempSettings.enableHints = value;
        }

        private void OnBuiltEnableWeatherWarningsChanged(bool value)
        {
            tempSettings.enableWeatherWarnings = value;
        }

        private void OnMasterVolumeChanged(float value)
        {
            tempSettings.masterVolume = value;
            if (masterVolumeValue != null) masterVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
            AudioManager.Instance?.ApplySettings(tempSettings.masterVolume, tempSettings.musicVolume,
                tempSettings.sfxVolume, tempSettings.ambientVolume);
        }

        private void OnMusicVolumeChanged(float value)
        {
            tempSettings.musicVolume = value;
            if (musicVolumeValue != null) musicVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
            AudioManager.Instance?.ApplySettings(tempSettings.masterVolume, tempSettings.musicVolume,
                tempSettings.sfxVolume, tempSettings.ambientVolume);
        }

        private void OnSfxVolumeChanged(float value)
        {
            tempSettings.sfxVolume = value;
            if (sfxVolumeValue != null) sfxVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
        }

        private void OnAmbientVolumeChanged(float value)
        {
            tempSettings.ambientVolume = value;
            if (ambientVolumeValue != null) ambientVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
        }

        private void OnCameraShakeChanged(float value)
        {
            tempSettings.cameraShakeIntensity = value;
            if (cameraShakeValue != null) cameraShakeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
        }

        private async void OnApplyClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);

            if (qualityDropdown != null) tempSettings.qualityLevel = qualityDropdown.value;
            if (fullscreenToggle != null) tempSettings.fullscreen = fullscreenToggle.isOn;
            if (showFPSToggle != null) tempSettings.showFPS = showFPSToggle.isOn;
            if (enableHintsToggle != null) tempSettings.enableHints = enableHintsToggle.isOn;
            if (enableWeatherWarningsToggle != null) tempSettings.enableWeatherWarnings = enableWeatherWarningsToggle.isOn;

            if (builtFullscreenToggle != null) tempSettings.fullscreen = builtFullscreenToggle.isOn;
            if (builtShowFPSToggle != null) tempSettings.showFPS = builtShowFPSToggle.isOn;
            if (builtEnableHintsToggle != null) tempSettings.enableHints = builtEnableHintsToggle.isOn;
            if (builtEnableWeatherWarningsToggle != null) tempSettings.enableWeatherWarnings = builtEnableWeatherWarningsToggle.isOn;

            if (resolutionDropdown != null && availableResolutions != null)
            {
                int idx = Mathf.Clamp(resolutionDropdown.value, 0, availableResolutions.Length - 1);
                var res = availableResolutions[idx];
                tempSettings.resolutionWidth = res.width;
                tempSettings.resolutionHeight = res.height;
                Screen.SetResolution(res.width, res.height, tempSettings.fullscreen);
            }
            else
            {
                Screen.fullScreen = tempSettings.fullscreen;
            }

            if (SaveSystem.Instance != null)
            {
                await SaveSystem.Instance.SaveSettings(tempSettings);
            }
            UIManager.Instance?.ShowNotification("设置已保存", 1.5f);
        }

        private void OnResetClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            var defaults = SaveSystem.Instance != null ? SaveSystem.Instance.CreateDefaultSettings() : new SettingsData
            {
                masterVolume = 1f,
                musicVolume = 0.7f,
                sfxVolume = 0.9f,
                ambientVolume = 0.6f,
                fullscreen = true,
                showFPS = false,
                enableHints = true,
                enableWeatherWarnings = true
            };
            if (defaults != null)
            {
                tempSettings = defaults;
                UpdateUIFromSettings(tempSettings);
            }
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();

            if (GameManager.Instance != null)
            {
                if (GameManager.Instance.CurrentState == GameState.Settings)
                {
                    if (SaveSystem.Instance?.CurrentSave?.completedLevelIds.Count > 0)
                    {
                        GameManager.Instance.ChangeState(GameState.MainMenu);
                    }
                    else if (GameManager.Instance.CurrentState == GameState.Paused)
                    {
                        GameManager.Instance.ChangeState(GameState.Paused);
                    }
                }
            }
        }

        private void OnResetProgressClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.ShowConfirmation(
                "重置游戏进度",
                "警告：这将清除所有存档数据，包括已解锁的关卡、图鉴、成就等。此操作不可撤销！",
                async () =>
                {
                    if (SaveSystem.Instance != null)
                    {
                        await SaveSystem.Instance.ResetProgress();
                    }
                    UIManager.Instance?.ShowNotification("进度已重置", 2f);
                });
        }
    }
}
