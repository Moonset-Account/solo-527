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

        private void Awake()
        {
            panelType = UIType.SettingsMenu;
            UIManager.Instance?.RegisterPanel(panelType, this);
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
            if (settings == null) return;

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
            if (resolutionDropdown != null && availableResolutions != null)
            {
                int idx = Mathf.Clamp(resolutionDropdown.value, 0, availableResolutions.Length - 1);
                var res = availableResolutions[idx];
                tempSettings.resolutionWidth = res.width;
                tempSettings.resolutionHeight = res.height;
                Screen.SetResolution(res.width, res.height, tempSettings.fullscreen);
            }

            await SaveSystem.Instance.SaveSettings(tempSettings);
            UIManager.Instance?.ShowNotification("设置已保存", 1.5f);
        }

        private void OnResetClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            var defaults = SaveSystem.Instance?.CreateDefaultSettings();
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
                    await SaveSystem.Instance.ResetProgress();
                    UIManager.Instance?.ShowNotification("进度已重置", 2f);
                });
        }
    }
}
