using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class FinancePanel : UIPanel
{
    public Text budgetText;
    public Text weeklyExpenseText;
    public Text matchIncomeText;
    public Button closeBtn;

    public override void OnShow()
    {
        closeBtn.onClick.RemoveAllListeners();
        closeBtn.onClick.AddListener(Close);

        if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
        {
            budgetText.text = "当前预算: " + GameManager.Instance.currentTeam.budget;
            weeklyExpenseText.text = "每周支出: " + FinanceManager.Instance.weeklySalaryCost;
            int matchIncome = 0;
            if (GameManager.Instance.currentTeam.lastMatchResult == MatchResult.Win)
                matchIncome = FinanceManager.Instance.matchWinBonus;
            else if (GameManager.Instance.currentTeam.lastMatchResult == MatchResult.Draw)
                matchIncome = FinanceManager.Instance.matchDrawBonus;
            matchIncomeText.text = "上次比赛收入: " + matchIncome;
        }
    }

    public void Close()
    {
        UIManager.Instance.ShowPanel("MainGame");
    }
}
