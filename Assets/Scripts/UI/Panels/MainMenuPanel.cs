using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class MainMenuPanel : UIPanel
{
    public Button startBtn;
    public Button tutorialBtn;
    public Button settingsBtn;
    public Button quitBtn;

    public override void OnShow()
    {
        startBtn.onClick.RemoveAllListeners();
        startBtn.onClick.AddListener(() => UIManager.Instance.ShowPanel("LevelSelect"));

        tutorialBtn.onClick.RemoveAllListeners();
        tutorialBtn.onClick.AddListener(() => UIManager.Instance.ShowPanel("Tutorial"));

        settingsBtn.onClick.RemoveAllListeners();
        settingsBtn.onClick.AddListener(() => UIManager.Instance.ShowPanel("Settings"));

        quitBtn.onClick.RemoveAllListeners();
        quitBtn.onClick.AddListener(() => Application.Quit());
    }
}
