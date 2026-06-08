using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3
{
    public class SettingsUI : MonoBehaviour
    {
        [SerializeField] private Slider _musicVolumeSlider;
        [SerializeField] private Slider _sfxVolumeSlider;
        [SerializeField] private Toggle _musicToggle;
        [SerializeField] private Toggle _sfxToggle;
        [SerializeField] private Dropdown _frameRateDropdown;
        [SerializeField] private Dropdown _languageDropdown;
        [SerializeField] private Text _performanceText;
        [SerializeField] private Button _remapButton;
        [SerializeField] private Button _resetButton;
        [SerializeField] private Button _backButton;
        [SerializeField] private Transform _remapPanel;

        private void Start()
        {
            _musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            _sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);
            _musicToggle.onValueChanged.AddListener(OnMusicToggleChanged);
            _sfxToggle.onValueChanged.AddListener(OnSfxToggleChanged);
            _frameRateDropdown.onValueChanged.AddListener(OnFrameRateChanged);
            _languageDropdown.onValueChanged.AddListener(OnLanguageChanged);
            _remapButton.onClick.AddListener(ShowRemapPanel);
            _resetButton.onClick.AddListener(OnReset);
            _backButton.onClick.AddListener(OnBack);

            Initialize();
        }

        public void Initialize()
        {
            if (SaveManager.Instance == null || SaveManager.Instance.CurrentSave == null) return;

            var settings = SaveManager.Instance.CurrentSave.settings;

            _musicVolumeSlider.value = settings.musicVolume;
            _sfxVolumeSlider.value = settings.sfxVolume;
            _musicToggle.isOn = settings.musicEnabled;
            _sfxToggle.isOn = settings.sfxEnabled;

            int[] frameRates = { 30, 60, 120 };
            int frIndex = 1;
            for (int i = 0; i < frameRates.Length; i++)
            {
                if (frameRates[i] == settings.targetFrameRate) frIndex = i;
            }
            _frameRateDropdown.value = frIndex;

            string[] languages = { "zh-CN", "en-US", "ja-JP" };
            int langIndex = 0;
            for (int i = 0; i < languages.Length; i++)
            {
                if (languages[i] == settings.language) langIndex = i;
            }
            _languageDropdown.value = langIndex;

            if (_remapPanel != null) _remapPanel.gameObject.SetActive(false);
        }

        public void OnMusicVolumeChanged(float v)
        {
            if (AudioManager.Instance != null) AudioManager.Instance.SetMusicVolume(v);
            if (SaveManager.Instance != null) SaveManager.Instance.CurrentSave.settings.musicVolume = v;
        }

        public void OnSfxVolumeChanged(float v)
        {
            if (AudioManager.Instance != null) AudioManager.Instance.SetSFXVolume(v);
            if (SaveManager.Instance != null) SaveManager.Instance.CurrentSave.settings.sfxVolume = v;
        }

        public void OnMusicToggleChanged(bool on)
        {
            if (AudioManager.Instance != null) AudioManager.Instance.SetMusicVolume(on ? SaveManager.Instance.CurrentSave.settings.musicVolume : 0f);
            if (SaveManager.Instance != null) SaveManager.Instance.CurrentSave.settings.musicEnabled = on;
        }

        public void OnSfxToggleChanged(bool on)
        {
            if (AudioManager.Instance != null) AudioManager.Instance.SetSFXVolume(on ? SaveManager.Instance.CurrentSave.settings.sfxVolume : 0f);
            if (SaveManager.Instance != null) SaveManager.Instance.CurrentSave.settings.sfxEnabled = on;
        }

        public void OnFrameRateChanged(int index)
        {
            int[] frameRates = { 30, 60, 120 };
            int target = frameRates[Mathf.Clamp(index, 0, frameRates.Length - 1)];
            Application.targetFrameRate = target;
            if (SaveManager.Instance != null) SaveManager.Instance.CurrentSave.settings.targetFrameRate = target;
        }

        public void OnLanguageChanged(int index)
        {
            string[] languages = { "zh-CN", "en-US", "ja-JP" };
            string lang = languages[Mathf.Clamp(index, 0, languages.Length - 1)];
            if (SaveManager.Instance != null) SaveManager.Instance.CurrentSave.settings.language = lang;
        }

        public void ShowRemapPanel()
        {
            if (_remapPanel != null) _remapPanel.gameObject.SetActive(true);
        }

        public void OnBack()
        {
            if (AudioManager.Instance != null) AudioManager.Instance.PlaySFX("button_click");
            if (SaveManager.Instance != null) SaveManager.Instance.Save();
            GameManager.Instance.ChangeState(GameState.MainMenu);
        }

        public void OnReset()
        {
            _musicVolumeSlider.value = 0.7f;
            _sfxVolumeSlider.value = 0.8f;
            _musicToggle.isOn = true;
            _sfxToggle.isOn = true;
            _frameRateDropdown.value = 1;
            _languageDropdown.value = 0;

            OnMusicVolumeChanged(0.7f);
            OnSfxVolumeChanged(0.8f);
            OnMusicToggleChanged(true);
            OnSfxToggleChanged(true);
            OnFrameRateChanged(1);
            OnLanguageChanged(0);
        }

        private void Update()
        {
            if (_performanceText != null && PerformanceMonitor.Instance != null)
            {
                _performanceText.text = PerformanceMonitor.Instance.GetStatsReport();
            }
        }
    }
}
