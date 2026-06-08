using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.UI
{
    public class SettingsMenuController : MonoBehaviour
    {
        [Header("Audio")]
        public Slider masterVolumeSlider;
        public Slider musicVolumeSlider;
        public Slider sfxVolumeSlider;
        public Slider uiVolumeSlider;
        public TMP_Text masterValueText;
        public TMP_Text musicValueText;
        public TMP_Text sfxValueText;
        public TMP_Text uiValueText;

        [Header("Display")]
        public TMP_Dropdown qualityDropdown;
        public TMP_Dropdown resolutionDropdown;
        public Toggle fullscreenToggle;
        public TMP_Dropdown vsyncDropdown;

        [Header("Gameplay")]
        public Toggle tutorialToggle;
        public Slider cameraShakeSlider;
        public TMP_Text cameraShakeValueText;

        [Header("Controls")]
        public Button moveLeftButton;
        public Button moveRightButton;
        public Button jumpButton;
        public Button switchLightButton;
        public Button interactButton;
        public Button pauseButton;
        public TMP_Text moveLeftText;
        public TMP_Text moveRightText;
        public TMP_Text jumpText;
        public TMP_Text switchLightText;
        public TMP_Text interactText;
        public TMP_Text pauseText;

        [Header("Bottom")]
        public Button applyButton;
        public Button resetButton;
        public Button backButton;

        [Header("Rebinding")]
        public GameObject rebindOverlay;
        public TMP_Text rebindPromptText;

        private Button _currentRebindingButton;

        private void Start()
        {
            SetupListeners();
            RefreshUI();
        }

        private void OnEnable()
        {
            RefreshUI();
        }

        private void SetupListeners()
        {
            if (masterVolumeSlider != null)
                masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
            if (musicVolumeSlider != null)
                musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            if (sfxVolumeSlider != null)
                sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);
            if (uiVolumeSlider != null)
                uiVolumeSlider.onValueChanged.AddListener(OnUIVolumeChanged);

            if (qualityDropdown != null)
                qualityDropdown.onValueChanged.AddListener(OnQualityChanged);
            if (resolutionDropdown != null)
                resolutionDropdown.onValueChanged.AddListener(OnResolutionChanged);
            if (fullscreenToggle != null)
                fullscreenToggle.onValueChanged.AddListener(OnFullscreenChanged);
            if (vsyncDropdown != null)
                vsyncDropdown.onValueChanged.AddListener(OnVsyncChanged);

            if (tutorialToggle != null)
                tutorialToggle.onValueChanged.AddListener(OnTutorialChanged);
            if (cameraShakeSlider != null)
                cameraShakeSlider.onValueChanged.AddListener(OnCameraShakeChanged);

            if (moveLeftButton != null)
                moveLeftButton.onClick.AddListener(() => StartRebinding(moveLeftButton, "moveLeft"));
            if (moveRightButton != null)
                moveRightButton.onClick.AddListener(() => StartRebinding(moveRightButton, "moveRight"));
            if (jumpButton != null)
                jumpButton.onClick.AddListener(() => StartRebinding(jumpButton, "jump"));
            if (switchLightButton != null)
                switchLightButton.onClick.AddListener(() => StartRebinding(switchLightButton, "switchLight"));
            if (interactButton != null)
                interactButton.onClick.AddListener(() => StartRebinding(interactButton, "interact"));
            if (pauseButton != null)
                pauseButton.onClick.AddListener(() => StartRebinding(pauseButton, "pause"));

            if (applyButton != null)
                applyButton.onClick.AddListener(OnApplyClicked);
            if (resetButton != null)
                resetButton.onClick.AddListener(OnResetClicked);
            if (backButton != null)
                backButton.onClick.AddListener(OnBackClicked);
        }

        public void RefreshUI()
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            var settings = s.CurrentSettings;

            if (masterVolumeSlider != null) masterVolumeSlider.value = settings.masterVolume;
            if (musicVolumeSlider != null) musicVolumeSlider.value = settings.musicVolume;
            if (sfxVolumeSlider != null) sfxVolumeSlider.value = settings.sfxVolume;
            if (uiVolumeSlider != null) uiVolumeSlider.value = settings.uiVolume;
            UpdateVolumeTexts();

            if (qualityDropdown != null)
            {
                qualityDropdown.ClearOptions();
                qualityDropdown.AddOptions(new System.Collections.Generic.List<string>(QualitySettings.names));
                qualityDropdown.value = settings.qualityLevel;
            }

            if (fullscreenToggle != null)
                fullscreenToggle.isOn = settings.fullscreen;
            if (vsyncDropdown != null)
                vsyncDropdown.value = Mathf.Clamp(settings.vsyncCount, 0, 2);

            if (tutorialToggle != null)
                tutorialToggle.isOn = settings.tutorialEnabled;
            if (cameraShakeSlider != null)
                cameraShakeSlider.value = settings.cameraShakeIntensity;
            if (cameraShakeValueText != null)
                cameraShakeValueText.text = Mathf.RoundToInt(settings.cameraShakeIntensity * 100) + "%";

            UpdateControlTexts();
        }

        private void UpdateVolumeTexts()
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            var settings = s.CurrentSettings;
            if (masterValueText != null) masterValueText.text = Mathf.RoundToInt(settings.masterVolume * 100) + "%";
            if (musicValueText != null) musicValueText.text = Mathf.RoundToInt(settings.musicVolume * 100) + "%";
            if (sfxValueText != null) sfxValueText.text = Mathf.RoundToInt(settings.sfxVolume * 100) + "%";
            if (uiValueText != null) uiValueText.text = Mathf.RoundToInt(settings.uiVolume * 100) + "%";
        }

        private void UpdateControlTexts()
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            var settings = s.CurrentSettings;
            if (moveLeftText != null) moveLeftText.text = settings.moveLeftKey;
            if (moveRightText != null) moveRightText.text = settings.moveRightKey;
            if (jumpText != null) jumpText.text = settings.jumpKey;
            if (switchLightText != null) switchLightText.text = settings.switchLightKey;
            if (interactText != null) interactText.text = settings.interactKey;
            if (pauseText != null) pauseText.text = settings.pauseKey;
        }

        private void OnMasterVolumeChanged(float v)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.SetMasterVolume(v);
            if (masterValueText != null) masterValueText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void OnMusicVolumeChanged(float v)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.SetMusicVolume(v);
            if (musicValueText != null) musicValueText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void OnSfxVolumeChanged(float v)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.SetSfxVolume(v);
            if (sfxValueText != null) sfxValueText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void OnUIVolumeChanged(float v)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.SetUIVolume(v);
            if (uiValueText != null) uiValueText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void OnQualityChanged(int idx)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.SetQualityLevel(idx);
        }

        private void OnResolutionChanged(int idx)
        {
        }

        private void OnFullscreenChanged(bool v)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.SetFullscreen(v);
        }

        private void OnVsyncChanged(int idx)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.CurrentSettings.vsyncCount = idx;
        }

        private void OnTutorialChanged(bool v)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.CurrentSettings.tutorialEnabled = v;
        }

        private void OnCameraShakeChanged(float v)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) return;
            s.CurrentSettings.cameraShakeIntensity = v;
            if (cameraShakeValueText != null)
                cameraShakeValueText.text = Mathf.RoundToInt(v * 100) + "%";
        }

        private void StartRebinding(Button button, string control)
        {
            UIManager.Instance?.PlayButtonClick();
            _currentRebindingButton = button;
            if (rebindOverlay != null)
            {
                rebindOverlay.SetActive(true);
                if (rebindPromptText != null)
                    rebindPromptText.text = "按下任意按键...  (Esc取消)";
            }
        }

        private void Update()
        {
            if (rebindOverlay != null && rebindOverlay.activeSelf)
            {
                if (Input.GetKeyDown(KeyCode.Escape))
                {
                    CancelRebinding();
                    return;
                }

                foreach (KeyCode k in System.Enum.GetValues(typeof(KeyCode)))
                {
                    if (Input.GetKeyDown(k) && k != KeyCode.None)
                    {
                        ApplyRebinding(k);
                        break;
                    }
                }
            }
        }

        private void ApplyRebinding(KeyCode key)
        {
            var s = LightShadowPlatformer.Core.SettingsManager.Instance;
            if (s == null) { CancelRebinding(); return; }

            string keyStr = key.ToString();
            string control = "";
            if (_currentRebindingButton == moveLeftButton) { s.CurrentSettings.moveLeftKey = keyStr; control = "moveLeft"; }
            else if (_currentRebindingButton == moveRightButton) { s.CurrentSettings.moveRightKey = keyStr; control = "moveRight"; }
            else if (_currentRebindingButton == jumpButton) { s.CurrentSettings.jumpKey = keyStr; control = "jump"; }
            else if (_currentRebindingButton == switchLightButton) { s.CurrentSettings.switchLightKey = keyStr; control = "switchLight"; }
            else if (_currentRebindingButton == interactButton) { s.CurrentSettings.interactKey = keyStr; control = "interact"; }
            else if (_currentRebindingButton == pauseButton) { s.CurrentSettings.pauseKey = keyStr; control = "pause"; }

            UpdateControlTexts();
            CancelRebinding();
        }

        private void CancelRebinding()
        {
            if (rebindOverlay != null) rebindOverlay.SetActive(false);
            _currentRebindingButton = null;
        }

        private void OnApplyClicked()
        {
            UIManager.Instance?.PlayUIConfirm();
            LightShadowPlatformer.Core.SettingsManager.Instance?.SaveSettings();
        }

        private void OnResetClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            LightShadowPlatformer.Core.SettingsManager.Instance?.ResetToDefaults();
            RefreshUI();
        }

        private void OnBackClicked()
        {
            UIManager.Instance?.PlayUICancel();
            LightShadowPlatformer.Core.SettingsManager.Instance?.SaveSettings();
            UIManager.Instance?.HideSettingsMenu();
        }
    }
}
