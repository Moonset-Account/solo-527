using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class SettingsPanel : UIPanel
{
    public Slider musicVolumeSlider;
    public Slider sfxVolumeSlider;
    public Toggle debugLogToggle;
    public Button backButton;

    public override void OnShow()
    {
        if (AudioManager.Instance != null)
        {
            musicVolumeSlider.value = AudioManager.Instance.GetMusicVolume();
            sfxVolumeSlider.value = AudioManager.Instance.GetSFXVolume();
        }

        if (DebugLogger.Instance != null)
        {
            debugLogToggle.isOn = DebugLogger.Instance.isEnabled;
        }

        musicVolumeSlider.onValueChanged.RemoveAllListeners();
        musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);

        sfxVolumeSlider.onValueChanged.RemoveAllListeners();
        sfxVolumeSlider.onValueChanged.AddListener(OnSFXVolumeChanged);

        debugLogToggle.onValueChanged.RemoveAllListeners();
        debugLogToggle.onValueChanged.AddListener(OnDebugLogToggled);

        backButton.onClick.RemoveAllListeners();
        backButton.onClick.AddListener(Close);
    }

    public void OnMusicVolumeChanged(float val)
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.SetMusicVolume(val);
            AudioManager.Instance.SaveVolumeSettings();
        }
    }

    public void OnSFXVolumeChanged(float val)
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.SetSFXVolume(val);
            AudioManager.Instance.SaveVolumeSettings();
        }
    }

    public void OnDebugLogToggled(bool val)
    {
        if (DebugLogger.Instance != null)
        {
            DebugLogger.Instance.Toggle(val);
        }
    }

    public void Close()
    {
        if (GameManager.Instance != null && GameManager.Instance.currentState == GameState.Playing)
        {
            UIManager.Instance.ShowPanel("MainGame");
        }
        else
        {
            UIManager.Instance.ShowPanel("MainMenu");
        }
    }
}
