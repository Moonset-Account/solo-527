using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Audio;
using TMPro;
using ShadowPlatformer.Save;

namespace ShadowPlatformer.UI
{
    public class SettingsPanel : MonoBehaviour
    {
        [Header("Audio")]
        public AudioMixer audioMixer;
        public Slider masterVolumeSlider;
        public Slider musicVolumeSlider;
        public Slider sfxVolumeSlider;

        [Header("Video")]
        public TMP_Dropdown resolutionDropdown;
        public Toggle fullscreenToggle;
        public TMP_Dropdown qualityDropdown;

        [Header("Buttons")]
        public Button applyButton;
        public Button backButton;

        private Resolution[] _resolutions;

        private void OnEnable()
        {
            if (masterVolumeSlider != null) masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
            if (musicVolumeSlider != null) musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            if (sfxVolumeSlider != null) sfxVolumeSlider.onValueChanged.AddListener(OnSFXVolumeChanged);
            if (fullscreenToggle != null) fullscreenToggle.onValueChanged.AddListener(OnFullscreenChanged);
            if (applyButton != null) applyButton.onClick.AddListener(ApplyAndSave);
            if (backButton != null) backButton.onClick.AddListener(Close);

            InitializeResolutions();
            LoadCurrentSettings();
        }

        private void OnDisable()
        {
            if (masterVolumeSlider != null) masterVolumeSlider.onValueChanged.RemoveListener(OnMasterVolumeChanged);
            if (musicVolumeSlider != null) musicVolumeSlider.onValueChanged.RemoveListener(OnMusicVolumeChanged);
            if (sfxVolumeSlider != null) sfxVolumeSlider.onValueChanged.RemoveListener(OnSFXVolumeChanged);
            if (fullscreenToggle != null) fullscreenToggle.onValueChanged.RemoveListener(OnFullscreenChanged);
            if (applyButton != null) applyButton.onClick.RemoveListener(ApplyAndSave);
            if (backButton != null) backButton.onClick.RemoveListener(Close);
        }

        private void InitializeResolutions()
        {
            if (resolutionDropdown == null) return;
            _resolutions = Screen.resolutions;
            resolutionDropdown.ClearOptions();
            var options = new System.Collections.Generic.List<string>();
            int currentIdx = 0;
            for (int i = 0; i < _resolutions.Length; i++)
            {
                string opt = $"{_resolutions[i].width} x {_resolutions[i].height}";
                options.Add(opt);
                if (_resolutions[i].width == Screen.currentResolution.width &&
                    _resolutions[i].height == Screen.currentResolution.height)
                    currentIdx = i;
            }
            resolutionDropdown.AddOptions(options);
            resolutionDropdown.value = currentIdx;
            resolutionDropdown.RefreshShownValue();
        }

        private void LoadCurrentSettings()
        {
            var settings = SaveManager.Instance?.CurrentSave?.settings;
            if (settings == null) return;

            if (masterVolumeSlider != null) masterVolumeSlider.value = settings.masterVolume;
            if (musicVolumeSlider != null) musicVolumeSlider.value = settings.musicVolume;
            if (sfxVolumeSlider != null) sfxVolumeSlider.value = settings.sfxVolume;
            if (fullscreenToggle != null) fullscreenToggle.isOn = settings.fullscreen;
            if (qualityDropdown != null) qualityDropdown.value = settings.qualityLevel;
        }

        private void OnMasterVolumeChanged(float v)
        {
            if (audioMixer != null) audioMixer.SetFloat("MasterVolume", Mathf.Log10(v) * 20f);
        }

        private void OnMusicVolumeChanged(float v)
        {
            if (audioMixer != null) audioMixer.SetFloat("MusicVolume", Mathf.Log10(v) * 20f);
        }

        private void OnSFXVolumeChanged(float v)
        {
            if (audioMixer != null) audioMixer.SetFloat("SFXVolume", Mathf.Log10(v) * 20f);
        }

        private void OnFullscreenChanged(bool isFull)
        {
            Screen.fullScreen = isFull;
        }

        public void ApplyAndSave()
        {
            var settings = new SettingsData
            {
                masterVolume = masterVolumeSlider != null ? masterVolumeSlider.value : 1f,
                musicVolume = musicVolumeSlider != null ? musicVolumeSlider.value : 0.8f,
                sfxVolume = sfxVolumeSlider != null ? sfxVolumeSlider.value : 1f,
                fullscreen = fullscreenToggle != null ? fullscreenToggle.isOn : true,
                qualityLevel = qualityDropdown != null ? qualityDropdown.value : 2
            };

            if (resolutionDropdown != null && _resolutions != null &&
                resolutionDropdown.value < _resolutions.Length)
            {
                settings.resolutionWidth = _resolutions[resolutionDropdown.value].width;
                settings.resolutionHeight = _resolutions[resolutionDropdown.value].height;
            }

            SaveManager.Instance?.SaveSettings(settings);
        }

        public void Close()
        {
            gameObject.SetActive(false);
        }
    }
}
