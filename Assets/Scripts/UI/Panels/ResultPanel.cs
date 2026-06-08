using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class ResultPanel : UIPanel
{
    public Text resultTitleText;
    public Text scoreText;
    public Text rewardsText;
    public Text detailText;
    public Button continueBtn;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        resultTitleText = UIHelper.CreateTitle(transform, "ResultTitle", "", 42);
        scoreText = UIHelper.CreateText(transform, "ScoreText", "", new Vector2(0.2f, 0.55f), new Vector2(0.8f, 0.7f), 48);
        rewardsText = UIHelper.CreateText(transform, "RewardsText", "", new Vector2(0.2f, 0.42f), new Vector2(0.8f, 0.52f), 22);
        detailText = UIHelper.CreateText(transform, "DetailText", "", new Vector2(0.1f, 0.25f), new Vector2(0.9f, 0.4f), 18);
        continueBtn = UIHelper.CreateButton(transform, "ContinueBtn", "继续", new Vector2(0.3f, 0.05f), new Vector2(0.7f, 0.14f), 24, UIHelper.AccentColor);
    }

    public override void OnShow()
    {
        OnInit();
        continueBtn.onClick.RemoveAllListeners();
        continueBtn.onClick.AddListener(() =>
        {
            GameManager.Instance.currentState = GameState.Playing;
            GameManager.Instance.CheckGameEnd();
            if (GameManager.Instance.currentState == GameState.GameOver)
                UIManager.Instance.ShowPanel("GameOver");
            else
                UIManager.Instance.ShowPanel("MainGame");
        });

        if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
        {
            var team = GameManager.Instance.currentTeam;
            int ourScore = team.lastMatchOurScore;
            int oppScore = team.lastMatchOpponentScore;

            if (team.lastMatchResult == MatchResult.Win)
            {
                resultTitleText.text = "胜利!";
                resultTitleText.color = UIHelper.AccentColor;
                rewardsText.text = "奖金: +" + FinanceManager.Instance.matchWinBonus;
            }
            else if (team.lastMatchResult == MatchResult.Loss)
            {
                resultTitleText.text = "失败";
                resultTitleText.color = UIHelper.DangerColor;
                rewardsText.text = "奖金: 0";
            }
            else
            {
                resultTitleText.text = "平局";
                resultTitleText.color = UIHelper.WarningColor;
                rewardsText.text = "奖金: +" + FinanceManager.Instance.matchDrawBonus;
            }

            scoreText.text = ourScore + " : " + oppScore;
            detailText.text = string.Format("赛季战绩 - 胜:{0} 负:{1} 平:{2}\n声望:{3} 预算:{4}", team.seasonWins, team.seasonLosses, team.seasonDraws, team.reputation, team.budget);
        }
    }
}
