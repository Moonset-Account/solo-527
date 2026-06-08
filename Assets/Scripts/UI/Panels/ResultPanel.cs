using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class ResultPanel : UIPanel
{
    public Text resultTitleText;
    public Text scoreText;
    public Text rewardsText;
    public Button continueBtn;

    public override void OnShow()
    {
        continueBtn.onClick.RemoveAllListeners();
        continueBtn.onClick.AddListener(() =>
        {
            GameManager.Instance.CheckGameEnd();
            if (GameManager.Instance.currentState == GameState.GameOver)
            {
                UIManager.Instance.ShowPanel("GameOver");
            }
            else
            {
                UIManager.Instance.ShowPanel("MainGame");
            }
        });

        if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
        {
            var team = GameManager.Instance.currentTeam;
            int ourScore = team.lastMatchOurScore;
            int oppScore = team.lastMatchOpponentScore;

            if (team.lastMatchResult == MatchResult.Win)
            {
                resultTitleText.text = "胜利!";
                rewardsText.text = "奖金: " + FinanceManager.Instance.matchWinBonus;
            }
            else if (team.lastMatchResult == MatchResult.Loss)
            {
                resultTitleText.text = "失败";
                rewardsText.text = "奖金: 0";
            }
            else
            {
                resultTitleText.text = "平局";
                rewardsText.text = "奖金: " + FinanceManager.Instance.matchDrawBonus;
            }

            scoreText.text = ourScore + " : " + oppScore;
        }
    }
}
