using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class SettingsPanel : MonoBehaviour
{
    [SerializeField] private Slider musicVolumeSlider;
    [SerializeField] private Slider sfxVolumeSlider;
    [SerializeField] private TMP_Dropdown qualityDropdown;
    [SerializeField] private TMP_Dropdown languageDropdown;
    [SerializeField] private Toggle weatherWarningToggle;
    [SerializeField] private Slider weatherTimeScaleSlider;
    [SerializeField] private Transform keyBindingContainer;
    [SerializeField] private GameObject keyBindingEntryPrefab;
    [SerializeField] private Button backButton;
    [SerializeField] private Button applyButton;

    private Dictionary<string, KeyCode> _pendingBindings = new Dictionary<string, KeyCode>();
    private string _listeningAction;
    private bool _isListening;

    private static readonly string[] ActionLabels = new string[]
    {
        "移动", "确认", "取消", "暂停", "缩放", "拍照", "地图", "补给", "图鉴"
    };

    private static readonly string[] ActionNames = new string[]
    {
        "Move", "Confirm", "Cancel", "Pause", "Zoom", "Photo", "OpenMap", "OpenSupply", "OpenCollection"
    };

    private void Start()
    {
        if (backButton != null)
            backButton.onClick.AddListener(OnBackClicked);

        if (applyButton != null)
            applyButton.onClick.AddListener(OnApplyClicked);

        if (musicVolumeSlider != null)
            musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);

        if (sfxVolumeSlider != null)
            sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);

        if (qualityDropdown != null)
            qualityDropdown.onValueChanged.AddListener(OnQualityChanged);

        if (languageDropdown != null)
            languageDropdown.onValueChanged.AddListener(OnLanguageChanged);

        if (weatherWarningToggle != null)
            weatherWarningToggle.onValueChanged.AddListener(OnWeatherWarningChanged);

        if (weatherTimeScaleSlider != null)
            weatherTimeScaleSlider.onValueChanged.AddListener(OnWeatherTimeScaleChanged);

        LoadCurrentSettings();
        PopulateKeyBindings();
    }

    private void Update()
    {
        if (_isListening)
        {
            ListenForKey();
        }
    }

    private void LoadCurrentSettings()
    {
        if (SaveSystem.Instance == null || SaveSystem.Instance.CurrentSaveData == null) return;

        var settings = SaveSystem.Instance.CurrentSaveData.settings;

        if (musicVolumeSlider != null)
            musicVolumeSlider.value = settings.musicVolume;

        if (sfxVolumeSlider != null)
            sfxVolumeSlider.value = settings.sfxVolume;

        if (qualityDropdown != null && qualityDropdown.options.Count > 0)
            qualityDropdown.value = Mathf.Clamp(settings.qualityLevel, 0, qualityDropdown.options.Count - 1);

        if (weatherWarningToggle != null)
            weatherWarningToggle.isOn = settings.showWeatherWarnings;

        if (weatherTimeScaleSlider != null)
            weatherTimeScaleSlider.value = settings.weatherTimeScale;

        LoadPendingBindings(settings);
    }

    private void LoadPendingBindings(SettingsSaveData settings)
    {
        _pendingBindings.Clear();
        var bindingsDict = settings.GetInputBindingsDict();

        for (int i = 0; i < ActionNames.Length; i++)
        {
            string action = ActionNames[i];
            if (bindingsDict.ContainsKey(action))
            {
                if (System.Enum.IsDefined(typeof(KeyCode), bindingsDict[action]))
                    _pendingBindings[action] = (KeyCode)System.Enum.Parse(typeof(KeyCode), bindingsDict[action]);
                else
                    _pendingBindings[action] = InputMapper.Instance != null ? InputMapper.Instance.GetBinding(action) : KeyCode.None;
            }
            else
            {
                _pendingBindings[action] = InputMapper.Instance != null ? InputMapper.Instance.GetBinding(action) : KeyCode.None;
            }
        }
    }

    private void PopulateKeyBindings()
    {
        if (keyBindingContainer == null || keyBindingEntryPrefab == null) return;

        foreach (Transform child in keyBindingContainer)
            Destroy(child.gameObject);

        for (int i = 0; i < ActionNames.Length; i++)
        {
            var entry = Instantiate(keyBindingEntryPrefab, keyBindingContainer);
            var texts = entry.GetComponentsInChildren<TMP_Text>();
            var buttons = entry.GetComponentsInChildren<Button>();

            if (texts.Length >= 2)
            {
                texts[0].text = ActionLabels[i];
                texts[1].text = _pendingBindings.ContainsKey(ActionNames[i]) ? _pendingBindings[ActionNames[i]].ToString() : "";
                texts[1].name = "KeyText_" + ActionNames[i];
            }

            if (buttons.Length > 0)
            {
                string action = ActionNames[i];
                buttons[0].onClick.AddListener(() => StartListening(action));
            }
        }
    }

    private void StartListening(string action)
    {
        _listeningAction = action;
        _isListening = true;
    }

    private void ListenForKey()
    {
        foreach (KeyCode key in System.Enum.GetValues(typeof(KeyCode)))
        {
            if (key == KeyCode.None) continue;
            if (key == KeyCode.Escape) continue;
            if (key == KeyCode.Mouse0 || key == KeyCode.Mouse1 || key == KeyCode.Mouse2) continue;

            if (Input.GetKeyDown(key))
            {
                _pendingBindings[_listeningAction] = key;
                _isListening = false;
                UpdateKeyBindingDisplay(_listeningAction, key);
                GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);
                break;
            }
        }

        if (Input.GetKeyDown(KeyCode.Escape))
        {
            _isListening = false;
        }
    }

    private void UpdateKeyBindingDisplay(string action, KeyCode key)
    {
        if (keyBindingContainer == null) return;

        string textName = "KeyText_" + action;
        foreach (var txt in keyBindingContainer.GetComponentsInChildren<TMP_Text>())
        {
            if (txt.name == textName)
            {
                txt.text = _isListening ? "..." : key.ToString();
                break;
            }
        }
    }

    private void OnMusicVolumeChanged(float value)
    {
        if (AudioTrigger.Instance != null)
            AudioTrigger.Instance.SetMusicVolume(value);
    }

    private void OnSfxVolumeChanged(float value)
    {
        if (AudioTrigger.Instance != null)
            AudioTrigger.Instance.SetSFXVolume(value);
    }

    private void OnQualityChanged(int level)
    {
        QualitySettings.SetQualityLevel(level, true);
    }

    private void OnLanguageChanged(int index)
    {
    }

    private void OnWeatherWarningChanged(bool enabled)
    {
    }

    private void OnWeatherTimeScaleChanged(float value)
    {
        if (WeatherSystem.Instance != null)
            WeatherSystem.Instance.weatherTimeScale = value;
    }

    private void OnApplyClicked()
    {
        ApplySettings();
        GameEvents.TriggerAudioTriggerRequested("ui_apply", 0.5f);

        if (UIStateManager.Instance != null)
            UIStateManager.Instance.PopState();
    }

    private void OnBackClicked()
    {
        LoadCurrentSettings();
        GameEvents.TriggerAudioTriggerRequested("ui_back", 0.5f);

        if (UIStateManager.Instance != null)
            UIStateManager.Instance.PopState();
    }

    private void ApplySettings()
    {
        if (SaveSystem.Instance == null) return;

        float musicVol = musicVolumeSlider != null ? musicVolumeSlider.value : 1f;
        float sfxVol = sfxVolumeSlider != null ? sfxVolumeSlider.value : 1f;
        int quality = qualityDropdown != null ? qualityDropdown.value : 0;
        string lang = languageDropdown != null && languageDropdown.options.Count > 0
            ? languageDropdown.options[languageDropdown.value].text
            : "en";
        bool showWarnings = weatherWarningToggle != null && weatherWarningToggle.isOn;
        float timeScale = weatherTimeScaleSlider != null ? weatherTimeScaleSlider.value : 1f;

        SaveSystem.Instance.UpdateSettings(musicVol, sfxVol, quality, lang, showWarnings, timeScale);

        var bindingsDict = new Dictionary<string, string>();
        foreach (var kvp in _pendingBindings)
        {
            bindingsDict[kvp.Key] = kvp.Value.ToString();

            if (InputMapper.Instance != null)
                InputMapper.Instance.RebindAction(kvp.Key, kvp.Value);
        }

        SettingsSaveData.SetInputBindingsFromDict(SaveSystem.Instance.CurrentSaveData.settings, bindingsDict);

        SaveSystem.Instance.AutoSave();
    }
}
