using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SpaceCourier.Core;
using SpaceCourier.SaveSystem;

namespace SpaceCourier.UI
{
    public class SettingsPanel : UIPanelBase
    {
        [Header("Audio Settings")]
        public Slider masterVolumeSlider;
        public TextMeshProUGUI masterVolumeValue;
        public Slider musicVolumeSlider;
        public TextMeshProUGUI musicVolumeValue;
        public Slider sfxVolumeSlider;
        public TextMeshProUGUI sfxVolumeValue;
        public Toggle muteToggle;

        [Header("Display Settings")]
        public Toggle fullscreenToggle;
        public TMP_Dropdown resolutionDropdown;
        public TMP_Dropdown qualityDropdown;

        [Header("Gameplay Settings")]
        public Toggle eventAnimationsToggle;
        public Toggle routePreviewToggle;
        public Slider textSpeedSlider;
        public TextMeshProUGUI textSpeedValue;

        [Header("Buttons")]
        public Button applyButton;
        public Button resetButton;
        public Button deleteSaveButton;
        public Button exportDataButton;

        public event Action<SettingsData> OnSettingsApplied;

        private SettingsData currentSettings;
        private SaveManager saveManager;

        protected override void Awake()
        {
            base.Awake();
        }

        public override void BindEvents()
        {
            base.BindEvents();

            if (masterVolumeSlider != null) masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
            if (musicVolumeSlider != null) musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            if (sfxVolumeSlider != null) sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);
            if (muteToggle != null) muteToggle.onValueChanged.AddListener(OnMuteChanged);
            if (fullscreenToggle != null) fullscreenToggle.onValueChanged.AddListener(OnFullscreenChanged);
            if (resolutionDropdown != null) resolutionDropdown.onValueChanged.AddListener(OnResolutionChanged);
            if (qualityDropdown != null) qualityDropdown.onValueChanged.AddListener(OnQualityChanged);
            if (eventAnimationsToggle != null) eventAnimationsToggle.onValueChanged.AddListener(OnAnimationsChanged);
            if (routePreviewToggle != null) routePreviewToggle.onValueChanged.AddListener(OnRoutePreviewChanged);
            if (textSpeedSlider != null) textSpeedSlider.onValueChanged.AddListener(OnTextSpeedChanged);
            if (applyButton != null) applyButton.onClick.AddListener(ApplySettings);
            if (resetButton != null) resetButton.onClick.AddListener(ResetToDefaults);
            if (deleteSaveButton != null) deleteSaveButton.onClick.AddListener(DeleteSaveData);
            if (exportDataButton != null) exportDataButton.onClick.AddListener(ExportPlayData);
        }

        protected override void OnOpened()
        {
            base.OnOpened();

            saveManager = GameManager.Instance?.GetModule<SaveManager>(ModuleType.SaveManager);

            currentSettings = saveManager != null
                ? saveManager.LoadSettings()
                : SettingsData.GetDefault();

            PopulateUI(currentSettings);
        }

        private void PopulateUI(SettingsData settings)
        {
            if (masterVolumeSlider != null) masterVolumeSlider.value = settings.MasterVolume;
            if (masterVolumeValue != null) masterVolumeValue.text = $"{Mathf.RoundToInt(settings.MasterVolume * 100)}%";

            if (musicVolumeSlider != null) musicVolumeSlider.value = settings.MusicVolume;
            if (musicVolumeValue != null) musicVolumeValue.text = $"{Mathf.RoundToInt(settings.MusicVolume * 100)}%";

            if (sfxVolumeSlider != null) sfxVolumeSlider.value = settings.SfxVolume;
            if (sfxVolumeValue != null) sfxVolumeValue.text = $"{Mathf.RoundToInt(settings.SfxVolume * 100)}%";

            if (muteToggle != null) muteToggle.isOn = settings.Muted;

            if (fullscreenToggle != null) fullscreenToggle.isOn = settings.Fullscreen;

            if (qualityDropdown != null && qualityDropdown.options.Count > 0)
            {
                qualityDropdown.value = Mathf.Clamp(settings.QualityLevel, 0, qualityDropdown.options.Count - 1);
            }

            if (eventAnimationsToggle != null) eventAnimationsToggle.isOn = settings.EnableEventAnimations;
            if (routePreviewToggle != null) routePreviewToggle.isOn = settings.EnableRoutePreview;

            if (textSpeedSlider != null) textSpeedSlider.value = settings.TextSpeed;
            if (textSpeedValue != null) textSpeedValue.text = $"{Mathf.RoundToInt(settings.TextSpeed * 100)}%";

            PopulateResolutions();
        }

        private void PopulateResolutions()
        {
            if (resolutionDropdown == null) return;

            resolutionDropdown.ClearOptions();
            var options = new System.Collections.Generic.List<string>
            {
                "1280 x 720",
                "1920 x 1080",
                "2560 x 1440",
                "3840 x 2160"
            };
            resolutionDropdown.AddOptions(options);

            int currentIndex = 1;
            var currentRes = Screen.currentResolution;
            if (currentRes.width >= 3840) currentIndex = 3;
            else if (currentRes.width >= 2560) currentIndex = 2;
            else if (currentRes.width >= 1920) currentIndex = 1;
            else currentIndex = 0;

            if (currentSettings != null)
            {
                resolutionDropdown.value = currentSettings.ResolutionIndex;
            }
            else
            {
                resolutionDropdown.value = currentIndex;
            }
        }

        private void OnMasterVolumeChanged(float value)
        {
            if (currentSettings == null) return;
            currentSettings.MasterVolume = value;
            if (masterVolumeValue != null) masterVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
        }

        private void OnMusicVolumeChanged(float value)
        {
            if (currentSettings == null) return;
            currentSettings.MusicVolume = value;
            if (musicVolumeValue != null) musicVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
        }

        private void OnSfxVolumeChanged(float value)
        {
            if (currentSettings == null) return;
            currentSettings.SfxVolume = value;
            if (sfxVolumeValue != null) sfxVolumeValue.text = $"{Mathf.RoundToInt(value * 100)}%";
        }

        private void OnMuteChanged(bool muted)
        {
            if (currentSettings == null) return;
            currentSettings.Muted = muted;
        }

        private void OnFullscreenChanged(bool isFullscreen)
        {
            if (currentSettings == null) return;
            currentSettings.Fullscreen = isFullscreen;
        }

        private void OnResolutionChanged(int index)
        {
            if (currentSettings == null) return;
            currentSettings.ResolutionIndex = index;
        }

        private void OnQualityChanged(int index)
        {
            if (currentSettings == null) return;
            currentSettings.QualityLevel = index;
        }

        private void OnAnimationsChanged(bool enabled)
        {
            if (currentSettings == null) return;
            currentSettings.EnableEventAnimations = enabled;
        }

        private void OnRoutePreviewChanged(bool enabled)
        {
            if (currentSettings == null) return;
            currentSettings.EnableRoutePreview = enabled;
        }

        private void OnTextSpeedChanged(float value)
        {
            if (currentSettings == null) return;
            currentSettings.TextSpeed = value;
            if (textSpeedValue != null) textSpeedValue.text = $"{Mathf.RoundToInt(value * 100)}%";
        }

        private void ApplySettings()
        {
            if (currentSettings == null) return;

            Screen.fullScreen = currentSettings.Fullscreen;
            QualitySettings.SetQualityLevel(currentSettings.QualityLevel, true);

            if (!currentSettings.Fullscreen)
            {
                ApplyResolution(currentSettings.ResolutionIndex);
            }

            saveManager?.SaveSettings(currentSettings);

            EventBus.Publish(new GameEvents.SettingsChanged
            {
                MasterVolume = currentSettings.Muted ? 0f : currentSettings.MasterVolume,
                MusicVolume = currentSettings.Muted ? 0f : currentSettings.MusicVolume,
                SfxVolume = currentSettings.Muted ? 0f : currentSettings.SfxVolume
            });

            OnSettingsApplied?.Invoke(currentSettings);

            var ui = GameManager.Instance?.GetModule<UIManager>(ModuleType.UIManager);
            ui?.ShowNotification("设置已保存", true);
            PlayClick();
        }

        private void ApplyResolution(int index)
        {
            int[] widths = { 1280, 1920, 2560, 3840 };
            int[] heights = { 720, 1080, 1440, 2160 };

            index = Mathf.Clamp(index, 0, widths.Length - 1);
            Screen.SetResolution(widths[index], heights[index], false);
        }

        private void ResetToDefaults()
        {
            currentSettings = SettingsData.GetDefault();
            PopulateUI(currentSettings);
            PlayClick();
        }

        private void DeleteSaveData()
        {
            saveManager?.DeleteAllSaves();
            var ui = GameManager.Instance?.GetModule<UIManager>(ModuleType.UIManager);
            ui?.ShowNotification("存档数据已清除", true);
            PlayClick();
        }

        private void ExportPlayData()
        {
            var recorder = GameManager.Instance?.GetModule<PlayRecorder>(ModuleType.PlayRecorder);
            string path = recorder?.ExportPlayDataToFile();
            var ui = GameManager.Instance?.GetModule<UIManager>(ModuleType.UIManager);
            if (!string.IsNullOrEmpty(path))
            {
                ui?.ShowNotification($"数据已导出到: {System.IO.Path.GetFileName(path)}", true);
            }
            PlayClick();
        }

        private void PlayClick()
        {
            var audioManager = GameManager.Instance?.GetModule<Audio.AudioManager>(ModuleType.AudioManager);
            audioManager?.PlaySfx(Audio.SfxType.UI_ButtonClick);
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();
            if (masterVolumeSlider != null) masterVolumeSlider.onValueChanged.RemoveAllListeners();
            if (musicVolumeSlider != null) musicVolumeSlider.onValueChanged.RemoveAllListeners();
            if (sfxVolumeSlider != null) sfxVolumeSlider.onValueChanged.RemoveAllListeners();
            if (muteToggle != null) muteToggle.onValueChanged.RemoveAllListeners();
            if (fullscreenToggle != null) fullscreenToggle.onValueChanged.RemoveAllListeners();
            if (resolutionDropdown != null) resolutionDropdown.onValueChanged.RemoveAllListeners();
            if (qualityDropdown != null) qualityDropdown.onValueChanged.RemoveAllListeners();
            if (eventAnimationsToggle != null) eventAnimationsToggle.onValueChanged.RemoveAllListeners();
            if (routePreviewToggle != null) routePreviewToggle.onValueChanged.RemoveAllListeners();
            if (textSpeedSlider != null) textSpeedSlider.onValueChanged.RemoveAllListeners();
            if (applyButton != null) applyButton.onClick.RemoveListener(ApplySettings);
            if (resetButton != null) resetButton.onClick.RemoveListener(ResetToDefaults);
            if (deleteSaveButton != null) deleteSaveButton.onClick.RemoveListener(DeleteSaveData);
            if (exportDataButton != null) exportDataButton.onClick.RemoveListener(ExportPlayData);
        }
    }
}
