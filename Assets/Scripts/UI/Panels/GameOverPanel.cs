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

    public override void OnShow()
    {
        retryBtn.onClick.RemoveAllListeners();
        retryBtn.onClick.AddListener(OnRetry);
        menuBtn.onClick.RemoveAllListeners();
        menuBtn.onClick.AddListener(OnBackToMenu);

        if (GameManager.Instance != null && GameManager.Instance.currentLevel != null)
        {
            currentLevelId = GameManager.Instance.currentLevel.levelId;
        }

        ShowGameOver("");
    }

    public void ShowGameOver(string reason)
    {
        gameOverText.text = "游戏结束";
        reasonText.text = reason;

        if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
        {
            var team = GameManager.Instance.currentTeam;
            statsText.text = string.Format("最终成绩 - 胜:{0} 负:{1} 平:{2} | 声望:{3} | 预算:{4}",
                team.seasonWins, team.seasonLosses, team.seasonDraws, team.reputation, team.budget);
        }
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
