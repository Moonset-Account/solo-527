using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class GameOverPanel : UIPanel
{
    public Text gameOverText;
    public Text reasonText;
    public Text statsText;
    public Button retryBtn;
    public Button menuBtn;
    private string currentLevelId;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        gameOverText = UIHelper.CreateTitle(transform, "GameOverTitle", "游戏结束", 42);
        gameOverText.color = UIHelper.DangerColor;
        reasonText = UIHelper.CreateText(transform, "ReasonText", "", new Vector2(0.1f, 0.6f), new Vector2(0.9f, 0.72f), 22);
        statsText = UIHelper.CreateText(transform, "StatsText", "", new Vector2(0.1f, 0.4f), new Vector2(0.9f, 0.58f), 20);
        retryBtn = UIHelper.CreateButton(transform, "RetryBtn", "重试本关", new Vector2(0.1f, 0.05f), new Vector2(0.45f, 0.14f), 22, UIHelper.AccentColor);
        menuBtn = UIHelper.CreateButton(transform, "MenuBtn", "返回主菜单", new Vector2(0.55f, 0.05f), new Vector2(0.9f, 0.14f), 22);
    }

    public override void OnShow()
    {
        OnInit();
        if (GameManager.Instance != null && GameManager.Instance.currentLevel != null)
            currentLevelId = GameManager.Instance.currentLevel.levelId;

        string reason = "";
        if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
        {
            var team = GameManager.Instance.currentTeam;
            var level = GameManager.Instance.currentLevel;
            if (level != null && level.IsLevelComplete(team))
                reason = "恭喜通关！你达成了所有目标！";
            else if (team.budget < -10000)
                reason = "预算耗尽，球队破产！";
            else if (level != null && level.IsLevelFailed(team, GameManager.Instance.currentWeek))
                reason = "无法达成目标，赛季失败！";
            else if (level != null && GameManager.Instance.currentWeek >= level.totalWeeks)
                reason = "赛季结束，未达成目标！";
            statsText.text = string.Format("最终成绩 - 胜:{0} 负:{1} 平:{2} | 声望:{3} | 预算:{4}", team.seasonWins, team.seasonLosses, team.seasonDraws, team.reputation, team.budget);
        }

        gameOverText.text = (reason.Contains("通关")) ? "通关！" : "游戏结束";
        gameOverText.color = (reason.Contains("通关")) ? UIHelper.AccentColor : UIHelper.DangerColor;
        reasonText.text = reason;

        retryBtn.onClick.RemoveAllListeners();
        retryBtn.onClick.AddListener(OnRetry);
        menuBtn.onClick.RemoveAllListeners();
        menuBtn.onClick.AddListener(OnBackToMenu);
    }

    void OnRetry()
    {
        if (!string.IsNullOrEmpty(currentLevelId))
        {
            GameManager.Instance.StartNewGame(currentLevelId);
            UIManager.Instance.ShowPanel("MainGame");
        }
    }

    void OnBackToMenu()
    {
        GameManager.Instance.currentState = GameState.Menu;
        UIManager.Instance.ShowPanel("MainMenu");
    }
}
