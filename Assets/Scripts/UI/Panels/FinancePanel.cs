using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class FinancePanel : UIPanel
{
    public Text budgetText;
    public Text weeklyExpenseText;
    public Text matchIncomeText;
    public Text summaryText;
    public Button closeBtn;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "财务概览", 32);
        budgetText = UIHelper.CreateText(transform, "BudgetText", "", new Vector2(0.1f, 0.7f), new Vector2(0.9f, 0.8f), 28);
        weeklyExpenseText = UIHelper.CreateText(transform, "WeeklyExpense", "", new Vector2(0.1f, 0.58f), new Vector2(0.9f, 0.68f), 22);
        matchIncomeText = UIHelper.CreateText(transform, "MatchIncome", "", new Vector2(0.1f, 0.46f), new Vector2(0.9f, 0.56f), 22);
        summaryText = UIHelper.CreateText(transform, "SummaryText", "", new Vector2(0.1f, 0.3f), new Vector2(0.9f, 0.44f), 18);
        closeBtn = UIHelper.CreateButton(transform, "CloseBtn", "返回", new Vector2(0.3f, 0.05f), new Vector2(0.7f, 0.14f), 22);
    }

    public override void OnShow()
    {
        OnInit();
        closeBtn.onClick.RemoveAllListeners();
        closeBtn.onClick.AddListener(Close);

        if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
        {
            var team = GameManager.Instance.currentTeam;
            budgetText.text = "当前预算: " + team.budget;
            weeklyExpenseText.text = "每周薪资支出: -" + FinanceManager.Instance.weeklySalaryCost;
            int matchIncome = 0;
            if (team.lastMatchResult == MatchResult.Win)
                matchIncome = FinanceManager.Instance.matchWinBonus;
            else if (team.lastMatchResult == MatchResult.Draw)
                matchIncome = FinanceManager.Instance.matchDrawBonus;
            matchIncomeText.text = "上次比赛奖金: +" + matchIncome;
            int projectedWeeks = 0;
            if (GameManager.Instance.currentLevel != null)
                projectedWeeks = GameManager.Instance.currentLevel.totalWeeks - GameManager.Instance.currentWeek;
            int projected = team.budget - FinanceManager.Instance.weeklySalaryCost * projectedWeeks;
            summaryText.text = string.Format("预计赛季结束预算: {0}\n(剩余{1}周 x 周薪{2})", projected, projectedWeeks, FinanceManager.Instance.weeklySalaryCost);
        }
    }

    public void Close() { UIManager.Instance.ShowPanel("MainGame"); }
}
