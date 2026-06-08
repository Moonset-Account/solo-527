using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class SettingsUI : MonoBehaviour
{
    public Slider masterVolumeSlider;
    public Slider musicVolumeSlider;
    public Slider sfxVolumeSlider;
    public Toggle fullscreenToggle;
    public TMP_Dropdown resolutionDropdown;
    public Button backButton;

    private const string MasterVolumeKey = "MasterVolume";
    private const string MusicVolumeKey = "MusicVolume";
    private const string SFXVolumeKey = "SFXVolume";
    private const string FullscreenKey = "Fullscreen";
    private const string ResolutionIndexKey = "ResolutionIndex";

    private void OnEnable()
    {
        LoadSettings();

        masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
        musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
        sfxVolumeSlider.onValueChanged.AddListener(OnSFXVolumeChanged);
        fullscreenToggle.onValueChanged.AddListener(OnFullscreenChanged);
        resolutionDropdown.onValueChanged.AddListener(OnResolutionChanged);
        backButton.onClick.AddListener(OnBackClicked);
    }

    private void OnDisable()
    {
        masterVolumeSlider.onValueChanged.RemoveListener(OnMasterVolumeChanged);
        musicVolumeSlider.onValueChanged.RemoveListener(OnMusicVolumeChanged);
        sfxVolumeSlider.onValueChanged.RemoveListener(OnSFXVolumeChanged);
        fullscreenToggle.onValueChanged.RemoveListener(OnFullscreenChanged);
        resolutionDropdown.onValueChanged.RemoveListener(OnResolutionChanged);
        backButton.onClick.RemoveListener(OnBackClicked);
    }

    private void LoadSettings()
    {
        masterVolumeSlider.value = PlayerPrefs.GetFloat(MasterVolumeKey, 1f);
        musicVolumeSlider.value = PlayerPrefs.GetFloat(MusicVolumeKey, 1f);
        sfxVolumeSlider.value = PlayerPrefs.GetFloat(SFXVolumeKey, 1f);
        fullscreenToggle.isOn = PlayerPrefs.GetInt(FullscreenKey, 1) == 1;
        resolutionDropdown.value = PlayerPrefs.GetInt(ResolutionIndexKey, 0);
    }

    private void SaveSettings()
    {
        PlayerPrefs.SetFloat(MasterVolumeKey, masterVolumeSlider.value);
        PlayerPrefs.SetFloat(MusicVolumeKey, musicVolumeSlider.value);
        PlayerPrefs.SetFloat(SFXVolumeKey, sfxVolumeSlider.value);
        PlayerPrefs.SetInt(FullscreenKey, fullscreenToggle.isOn ? 1 : 0);
        PlayerPrefs.SetInt(ResolutionIndexKey, resolutionDropdown.value);
        PlayerPrefs.Save();
    }

    private void OnMasterVolumeChanged(float value)
    {
        if (AudioManager.Instance != null)
            AudioManager.Instance.SetMasterVolume(value);
        SaveSettings();
    }

    private void OnMusicVolumeChanged(float value)
    {
        if (AudioManager.Instance != null)
            AudioManager.Instance.SetMusicVolume(value);
        SaveSettings();
    }

    private void OnSFXVolumeChanged(float value)
    {
        if (AudioManager.Instance != null)
            AudioManager.Instance.SetSFXVolume(value);
        SaveSettings();
    }

    private void OnFullscreenChanged(bool isFullscreen)
    {
        Screen.fullScreen = isFullscreen;
        SaveSettings();
    }

    private void OnResolutionChanged(int index)
    {
        Resolution[] resolutions = Screen.resolutions;
        if (index >= 0 && index < resolutions.Length)
        {
            Resolution res = resolutions[index];
            Screen.SetResolution(res.width, res.height, Screen.fullScreen);
        }
        SaveSettings();
    }

    private void OnBackClicked()
    {
        SaveSettings();
        UIManager.Instance.HideCurrentPanel();
    }
}
