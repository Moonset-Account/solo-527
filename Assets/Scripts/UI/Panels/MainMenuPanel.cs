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
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "青年队训练管理", 48);
        startBtn = UIHelper.CreateWideButton(transform, "StartBtn", "开始游戏", 0.1f);
        tutorialBtn = UIHelper.CreateWideButton(transform, "TutorialBtn", "教程", -0.05f);
        settingsBtn = UIHelper.CreateWideButton(transform, "SettingsBtn", "设置", -0.2f);
        quitBtn = UIHelper.CreateWideButton(transform, "QuitBtn", "退出", -0.35f);
        UIHelper.CreateText(transform, "Version", "v0.1 Prototype", new Vector2(0.5f, 0f), new Vector2(0.5f, 0.05f), 14);
    }

    public override void OnShow()
    {
        OnInit();
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
