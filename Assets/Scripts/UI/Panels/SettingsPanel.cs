using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class SettingsPanel : UIPanel
{
    public Slider musicVolumeSlider;
    public Slider sfxVolumeSlider;
    public Toggle debugLogToggle;
    public Text musicLabel;
    public Text sfxLabel;
    public Button exportLogBtn;
    public Button backButton;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "设置", 32);

        UIHelper.CreateText(transform, "MusicLabel2", "音乐音量:", new Vector2(0.1f, 0.75f), new Vector2(0.3f, 0.82f), 20);
        musicLabel = UIHelper.CreateText(transform, "MusicVal", "70%", new Vector2(0.85f, 0.75f), new Vector2(0.95f, 0.82f), 20);
        musicVolumeSlider = UIHelper.CreateSlider(transform, "MusicSlider", new Vector2(0.3f, 0.75f), new Vector2(0.83f, 0.82f), 0.7f);

        UIHelper.CreateText(transform, "SFXLabel2", "音效音量:", new Vector2(0.1f, 0.62f), new Vector2(0.3f, 0.69f), 20);
        sfxLabel = UIHelper.CreateText(transform, "SFXVal", "80%", new Vector2(0.85f, 0.62f), new Vector2(0.95f, 0.69f), 20);
        sfxVolumeSlider = UIHelper.CreateSlider(transform, "SFXSlider", new Vector2(0.3f, 0.62f), new Vector2(0.83f, 0.69f), 0.8f);

        debugLogToggle = UIHelper.CreateToggle(transform, "DebugToggle", "启用调试日志", new Vector2(0.1f, 0.48f), new Vector2(0.9f, 0.58f), true);
        exportLogBtn = UIHelper.CreateButton(transform, "ExportLogBtn", "导出调试日志", new Vector2(0.1f, 0.35f), new Vector2(0.5f, 0.44f), 18);
        backButton = UIHelper.CreateButton(transform, "BackBtn", "返回", new Vector2(0.3f, 0.05f), new Vector2(0.7f, 0.14f), 22);
    }

    public override void OnShow()
    {
        OnInit();
        if (AudioManager.Instance != null)
        {
            musicVolumeSlider.value = AudioManager.Instance.GetMusicVolume();
            sfxVolumeSlider.value = AudioManager.Instance.GetSFXVolume();
        }
        if (DebugLogger.Instance != null)
            debugLogToggle.isOn = DebugLogger.Instance.isEnabled;

        musicVolumeSlider.onValueChanged.RemoveAllListeners();
        musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
        sfxVolumeSlider.onValueChanged.RemoveAllListeners();
        sfxVolumeSlider.onValueChanged.AddListener(OnSFXVolumeChanged);
        debugLogToggle.onValueChanged.RemoveAllListeners();
        debugLogToggle.onValueChanged.AddListener(OnDebugLogToggled);
        exportLogBtn.onClick.RemoveAllListeners();
        exportLogBtn.onClick.AddListener(OnExportLog);
        backButton.onClick.RemoveAllListeners();
        backButton.onClick.AddListener(Close);

        UpdateLabels();
    }

    void OnMusicVolumeChanged(float val)
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.SetMusicVolume(val);
            AudioManager.Instance.SaveVolumeSettings();
        }
        UpdateLabels();
    }

    void OnSFXVolumeChanged(float val)
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.SetSFXVolume(val);
            AudioManager.Instance.SaveVolumeSettings();
        }
        UpdateLabels();
    }

    void UpdateLabels()
    {
        if (musicLabel != null) musicLabel.text = (musicVolumeSlider.value * 100).ToString("F0") + "%";
        if (sfxLabel != null) sfxLabel.text = (sfxVolumeSlider.value * 100).ToString("F0") + "%";
    }

    void OnDebugLogToggled(bool val)
    {
        if (DebugLogger.Instance != null)
            DebugLogger.Instance.Toggle(val);
    }

    void OnExportLog()
    {
        if (DebugLogger.Instance != null)
            DebugLogger.Instance.ExportToFile(System.IO.Path.Combine(Application.persistentDataPath, "debug_log.txt"));
    }

    public void Close()
    {
        if (GameManager.Instance != null && GameManager.Instance.currentState == GameState.Playing)
            UIManager.Instance.ShowPanel("MainGame");
        else
            UIManager.Instance.ShowPanel("MainMenu");
    }
}
