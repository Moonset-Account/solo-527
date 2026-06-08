using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public class SettingsView : UIViewBase
    {
        [Header("Audio")]
        [SerializeField] private Slider masterVolumeSlider;
        [SerializeField] private Slider musicVolumeSlider;
        [SerializeField] private Slider sfxVolumeSlider;
        [SerializeField] private Toggle musicMuteToggle;
        [SerializeField] private Toggle sfxMuteToggle;
        [SerializeField] private TextMeshProUGUI masterVolumeText;
        [SerializeField] private TextMeshProUGUI musicVolumeText;
        [SerializeField] private TextMeshProUGUI sfxVolumeText;

        [Header("Display")]
        [SerializeField] private Toggle fullscreenToggle;
        [SerializeField] private TMP_Dropdown qualityDropdown;

        [Header("Gameplay")]
        [SerializeField] private Toggle tutorialToggle;
        [SerializeField] private Toggle vibrationToggle;
        [SerializeField] private Toggle autoSaveToggle;

        [Header("Buttons")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button applyButton;
        [SerializeField] private Button resetSettingsButton;
        [SerializeField] private Button resetProgressButton;
        [SerializeField] private Button confirmResetButton;
        [SerializeField] private Button cancelResetButton;

        [Header("Panels")]
        [SerializeField] private GameObject resetConfirmPanel;

        private GameSettings _tempSettings;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.Settings;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (masterVolumeSlider != null)
            {
                masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
            }
            if (musicVolumeSlider != null)
            {
                musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            }
            if (sfxVolumeSlider != null)
            {
                sfxVolumeSlider.onValueChanged.AddListener(OnSFXVolumeChanged);
            }
            if (musicMuteToggle != null)
            {
                musicMuteToggle.onValueChanged.AddListener(OnMusicMuteChanged);
            }
            if (sfxMuteToggle != null)
            {
                sfxMuteToggle.onValueChanged.AddListener(OnSFXMuteChanged);
            }

            if (fullscreenToggle != null)
            {
                fullscreenToggle.onValueChanged.AddListener(OnFullscreenChanged);
            }
            if (qualityDropdown != null)
            {
                qualityDropdown.onValueChanged.AddListener(OnQualityChanged);
            }

            if (tutorialToggle != null)
            {
                tutorialToggle.onValueChanged.AddListener(OnTutorialChanged);
            }
            if (vibrationToggle != null)
            {
                vibrationToggle.onValueChanged.AddListener(OnVibrationChanged);
            }
            if (autoSaveToggle != null)
            {
                autoSaveToggle.onValueChanged.AddListener(OnAutoSaveChanged);
            }

            if (backButton != null)
                backButton.onClick.AddListener(OnBackClicked);
            if (applyButton != null)
                applyButton.onClick.AddListener(OnApplyClicked);
            if (resetSettingsButton != null)
                resetSettingsButton.onClick.AddListener(OnResetSettingsClicked);
            if (resetProgressButton != null)
                resetProgressButton.onClick.AddListener(OnResetProgressClicked);
            if (confirmResetButton != null)
                confirmResetButton.onClick.AddListener(OnConfirmResetClicked);
            if (cancelResetButton != null)
                cancelResetButton.onClick.AddListener(OnCancelResetClicked);
        }

        public override void Open()
        {
            base.Open();
            LoadCurrentSettings();
            if (resetConfirmPanel != null)
            {
                resetConfirmPanel.SetActive(false);
            }
        }

        private void LoadCurrentSettings()
        {
            _tempSettings = SaveManager.Instance != null
                ? JsonUtility.FromJson<GameSettings>(JsonUtility.ToJson(SaveManager.Instance.CurrentSave.Settings))
                : new GameSettings();

            if (masterVolumeSlider != null)
                masterVolumeSlider.value = _tempSettings.Audio.MasterVolume;
            if (musicVolumeSlider != null)
                musicVolumeSlider.value = _tempSettings.Audio.MusicVolume;
            if (sfxVolumeSlider != null)
                sfxVolumeSlider.value = _tempSettings.Audio.SFXVolume;
            if (musicMuteToggle != null)
                musicMuteToggle.isOn = _tempSettings.Audio.MusicMuted;
            if (sfxMuteToggle != null)
                sfxMuteToggle.isOn = _tempSettings.Audio.SFXMuted;

            UpdateVolumeTexts();

            if (fullscreenToggle != null)
                fullscreenToggle.isOn = _tempSettings.Fullscreen;
            if (qualityDropdown != null)
            {
                qualityDropdown.ClearOptions();
                qualityDropdown.AddOptions(new System.Collections.Generic.List<string>
                {
                    "非常低", "低", "中", "高", "非常高", "极致"
                });
                qualityDropdown.value = _tempSettings.QualityLevel;
            }

            if (tutorialToggle != null)
                tutorialToggle.isOn = _tempSettings.ShowTutorials;
            if (vibrationToggle != null)
                vibrationToggle.isOn = _tempSettings.VibrationEnabled;
            if (autoSaveToggle != null)
                autoSaveToggle.isOn = _tempSettings.AutoSaveEnabled;
        }

        private void UpdateVolumeTexts()
        {
            if (masterVolumeText != null)
                masterVolumeText.text = $"{Mathf.RoundToInt(masterVolumeSlider.value * 100)}%";
            if (musicVolumeText != null)
                musicVolumeText.text = $"{Mathf.RoundToInt(musicVolumeSlider.value * 100)}%";
            if (sfxVolumeText != null)
                sfxVolumeText.text = $"{Mathf.RoundToInt(sfxVolumeSlider.value * 100)}%";
        }

        private void OnMasterVolumeChanged(float value)
        {
            _tempSettings.Audio.MasterVolume = value;
            UpdateVolumeTexts();
            AudioManager.Instance?.SetMasterVolume(value);
        }

        private void OnMusicVolumeChanged(float value)
        {
            _tempSettings.Audio.MusicVolume = value;
            UpdateVolumeTexts();
            AudioManager.Instance?.SetMusicVolume(value);
        }

        private void OnSFXVolumeChanged(float value)
        {
            _tempSettings.Audio.SFXVolume = value;
            UpdateVolumeTexts();
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick, 0.3f);
            AudioManager.Instance?.SetSFXVolume(value);
        }

        private void OnMusicMuteChanged(bool muted)
        {
            _tempSettings.Audio.MusicMuted = muted;
            AudioManager.Instance?.SetMusicMuted(muted);
        }

        private void OnSFXMuteChanged(bool muted)
        {
            _tempSettings.Audio.SFXMuted = muted;
            AudioManager.Instance?.SetSFXMuted(muted);
        }

        private void OnFullscreenChanged(bool fullscreen)
        {
            _tempSettings.Fullscreen = fullscreen;
            Screen.fullScreen = fullscreen;
        }

        private void OnQualityChanged(int level)
        {
            _tempSettings.QualityLevel = level;
            QualitySettings.SetQualityLevel(level);
        }

        private void OnTutorialChanged(bool show)
        {
            _tempSettings.ShowTutorials = show;
        }

        private void OnVibrationChanged(bool enabled)
        {
            _tempSettings.VibrationEnabled = enabled;
        }

        private void OnAutoSaveChanged(bool enabled)
        {
            _tempSettings.AutoSaveEnabled = enabled;
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            ApplySettings();
            Close();
            UIManager.Instance.GoBack();

            if (GameStateManager.Instance.CurrentState == GameState.Settings)
            {
                if (GameStateManager.Instance.PreviousState == GameState.PausedMatch3)
                {
                    GameStateManager.Instance.ChangeState(GameState.PausedMatch3);
                    UIManager.Instance.OpenView(UIView.PauseMenu);
                }
                else
                {
                    GameStateManager.Instance.ChangeState(GameState.MainMenu);
                    UIManager.Instance.OpenView(UIView.MainMenu);
                }
            }
        }

        private void OnApplyClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            ApplySettings();
        }

        private void ApplySettings()
        {
            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.UpdateSettings(_tempSettings);
            }
        }

        private void OnResetSettingsClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            _tempSettings = new GameSettings();
            LoadCurrentSettingsFromTemp();
        }

        private void LoadCurrentSettingsFromTemp()
        {
            if (masterVolumeSlider != null)
                masterVolumeSlider.value = _tempSettings.Audio.MasterVolume;
            if (musicVolumeSlider != null)
                musicVolumeSlider.value = _tempSettings.Audio.MusicVolume;
            if (sfxVolumeSlider != null)
                sfxVolumeSlider.value = _tempSettings.Audio.SFXVolume;
            if (musicMuteToggle != null)
                musicMuteToggle.isOn = _tempSettings.Audio.MusicMuted;
            if (sfxMuteToggle != null)
                sfxMuteToggle.isOn = _tempSettings.Audio.SFXMuted;
            if (fullscreenToggle != null)
                fullscreenToggle.isOn = _tempSettings.Fullscreen;
            if (qualityDropdown != null)
                qualityDropdown.value = _tempSettings.QualityLevel;
            if (tutorialToggle != null)
                tutorialToggle.isOn = _tempSettings.ShowTutorials;
            if (vibrationToggle != null)
                vibrationToggle.isOn = _tempSettings.VibrationEnabled;
            if (autoSaveToggle != null)
                autoSaveToggle.isOn = _tempSettings.AutoSaveEnabled;

            UpdateVolumeTexts();
        }

        private void OnResetProgressClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            if (resetConfirmPanel != null)
            {
                resetConfirmPanel.SetActive(true);
            }
        }

        private void OnConfirmResetClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            SaveManager.Instance?.ResetProgress();
            if (resetConfirmPanel != null)
            {
                resetConfirmPanel.SetActive(false);
            }
            Close();
            UIManager.Instance.OpenView(UIView.MainMenu);
        }

        private void OnCancelResetClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            if (resetConfirmPanel != null)
            {
                resetConfirmPanel.SetActive(false);
            }
        }

        private void OnDestroy()
        {
            if (masterVolumeSlider != null)
                masterVolumeSlider.onValueChanged.RemoveListener(OnMasterVolumeChanged);
            if (musicVolumeSlider != null)
                musicVolumeSlider.onValueChanged.RemoveListener(OnMusicVolumeChanged);
            if (sfxVolumeSlider != null)
                sfxVolumeSlider.onValueChanged.RemoveListener(OnSFXVolumeChanged);
            if (musicMuteToggle != null)
                musicMuteToggle.onValueChanged.RemoveListener(OnMusicMuteChanged);
            if (sfxMuteToggle != null)
                sfxMuteToggle.onValueChanged.RemoveListener(OnSFXMuteChanged);
            if (fullscreenToggle != null)
                fullscreenToggle.onValueChanged.RemoveListener(OnFullscreenChanged);
            if (qualityDropdown != null)
                qualityDropdown.onValueChanged.RemoveListener(OnQualityChanged);
            if (tutorialToggle != null)
                tutorialToggle.onValueChanged.RemoveListener(OnTutorialChanged);
            if (vibrationToggle != null)
                vibrationToggle.onValueChanged.RemoveListener(OnVibrationChanged);
            if (autoSaveToggle != null)
                autoSaveToggle.onValueChanged.RemoveListener(OnAutoSaveChanged);
            if (backButton != null)
                backButton.onClick.RemoveListener(OnBackClicked);
            if (applyButton != null)
                applyButton.onClick.RemoveListener(OnApplyClicked);
            if (resetSettingsButton != null)
                resetSettingsButton.onClick.RemoveListener(OnResetSettingsClicked);
            if (resetProgressButton != null)
                resetProgressButton.onClick.RemoveListener(OnResetProgressClicked);
            if (confirmResetButton != null)
                confirmResetButton.onClick.RemoveListener(OnConfirmResetClicked);
            if (cancelResetButton != null)
                cancelResetButton.onClick.RemoveListener(OnCancelResetClicked);
        }
    }
}
