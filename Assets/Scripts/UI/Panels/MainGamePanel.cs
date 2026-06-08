using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class MainGamePanel : UIPanel
{
    public Text weekText;
    public Text budgetText;
    public Text reputationText;
    public Text recordText;
    public Button advanceWeekBtn;
    public Button trainingSetupBtn;
    public Button scheduleBtn;
    public Button financeBtn;
    public Button saveBtn;
    public Button settingsBtn;
    public Transform playerListContent;
    public Transform trainingGridContent;
    private ScrollRect playerScroll;
    private ScrollRect trainingScroll;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;

        UIHelper.CreateTitle(transform, "Title", "青年队训练管理", 32);

        weekText = UIHelper.CreateText(transform, "WeekText", "", new Vector2(0f, 0.88f), new Vector2(0.5f, 0.95f), 24);
        budgetText = UIHelper.CreateText(transform, "BudgetText", "", new Vector2(0.5f, 0.88f), new Vector2(1f, 0.95f), 24);
        reputationText = UIHelper.CreateText(transform, "ReputationText", "", new Vector2(0f, 0.82f), new Vector2(0.5f, 0.88f), 20);
        recordText = UIHelper.CreateText(transform, "RecordText", "", new Vector2(0.5f, 0.82f), new Vector2(1f, 0.88f), 20);

        UIHelper.CreateText(transform, "TrainingLabel", "本周训练安排:", new Vector2(0.02f, 0.72f), new Vector2(0.98f, 0.78f), 18);
        trainingScroll = UIHelper.CreateScrollList(transform, "TrainingGrid", new Vector2(0.02f, 0.52f), new Vector2(0.98f, 0.72f), out trainingGridContent);

        UIHelper.CreateText(transform, "PlayerLabel", "球员列表:", new Vector2(0.02f, 0.47f), new Vector2(0.98f, 0.52f), 18);
        playerScroll = UIHelper.CreateScrollList(transform, "PlayerList", new Vector2(0.02f, 0.18f), new Vector2(0.98f, 0.47f), out playerListContent);

        advanceWeekBtn = UIHelper.CreateButton(transform, "AdvanceWeekBtn", "推进一周", new Vector2(0.02f, 0.05f), new Vector2(0.18f, 0.14f), 20, UIHelper.AccentColor);
        trainingSetupBtn = UIHelper.CreateButton(transform, "TrainingSetupBtn", "训练安排", new Vector2(0.2f, 0.05f), new Vector2(0.36f, 0.14f), 18);
        scheduleBtn = UIHelper.CreateButton(transform, "ScheduleBtn", "赛程", new Vector2(0.38f, 0.05f), new Vector2(0.52f, 0.14f), 18);
        financeBtn = UIHelper.CreateButton(transform, "FinanceBtn", "财务", new Vector2(0.54f, 0.05f), new Vector2(0.68f, 0.14f), 18);
        saveBtn = UIHelper.CreateButton(transform, "SaveBtn", "保存", new Vector2(0.7f, 0.05f), new Vector2(0.82f, 0.14f), 18);
        settingsBtn = UIHelper.CreateButton(transform, "SettingsBtn", "设置", new Vector2(0.84f, 0.05f), new Vector2(0.98f, 0.14f), 18);
    }

    public override void OnShow()
    {
        OnInit();
        advanceWeekBtn.onClick.RemoveAllListeners();
        advanceWeekBtn.onClick.AddListener(OnAdvanceWeek);
        trainingSetupBtn.onClick.RemoveAllListeners();
        trainingSetupBtn.onClick.AddListener(OnTrainingSetupClicked);
        scheduleBtn.onClick.RemoveAllListeners();
        scheduleBtn.onClick.AddListener(OnScheduleClicked);
        financeBtn.onClick.RemoveAllListeners();
        financeBtn.onClick.AddListener(OnFinanceClicked);
        saveBtn.onClick.RemoveAllListeners();
        saveBtn.onClick.AddListener(OnSaveClicked);
        settingsBtn.onClick.RemoveAllListeners();
        settingsBtn.onClick.AddListener(OnSettingsClicked);
        RefreshUI();
    }

    public void RefreshUI()
    {
        if (GameManager.Instance == null || GameManager.Instance.currentTeam == null) return;

        weekText.text = "第 " + GameManager.Instance.currentWeek + " 周";
        budgetText.text = "预算: " + GameManager.Instance.currentTeam.budget;
        reputationText.text = "声望: " + GameManager.Instance.currentTeam.reputation;
        recordText.text = string.Format("胜{0} 负{1} 平{2}", GameManager.Instance.currentTeam.seasonWins, GameManager.Instance.currentTeam.seasonLosses, GameManager.Instance.currentTeam.seasonDraws);

        for (int i = trainingGridContent.childCount - 1; i >= 0; i--)
            Destroy(trainingGridContent.GetChild(i).gameObject);

        if (TrainingManager.Instance != null)
        {
            string[] dayNames = { "周一", "周二", "周三", "周四", "周五", "周六", "周日" };
            string[] typeNames = { "体能", "技术", "战术", "心理", "休息" };
            for (int i = 0; i < TrainingManager.Instance.weeklySchedule.Count; i++)
            {
                var slot = TrainingManager.Instance.weeklySchedule[i];
                string playerName = "未指派";
                if (!string.IsNullOrEmpty(slot.assignedPlayerId) && GameManager.Instance.currentTeam != null)
                {
                    var p = GameManager.Instance.currentTeam.GetPlayer(slot.assignedPlayerId);
                    if (p != null) playerName = p.playerName;
                }
                int typeIdx = (int)slot.type;
                string typeName = typeIdx < typeNames.Length ? typeNames[typeIdx] : "休息";
                string info = dayNames[i] + " | " + typeName + " | " + playerName;
                UIHelper.CreateListItem(trainingGridContent, "Day" + i, info, 35);
            }
        }

        for (int i = playerListContent.childCount - 1; i >= 0; i--)
            Destroy(playerListContent.GetChild(i).gameObject);

        if (GameManager.Instance.currentTeam.players != null)
        {
            foreach (var player in GameManager.Instance.currentTeam.players)
            {
                string info = string.Format("{0} | {1} | 综合:{2:F0} | 体能:{3} | {4}", player.playerName, player.position, player.GetOverallRating(), player.stamina, player.state);
                Button item = UIHelper.CreateListItem(playerListContent, player.playerId, info, 35);
                string pid = player.playerId;
                item.onClick.AddListener(() => OnPlayerClicked(pid));
            }
        }
    }

    public void OnAdvanceWeek()
    {
        GameManager.Instance.AdvanceWeek();
        RefreshUI();
        if (GameManager.Instance.currentState == GameState.Result)
            UIManager.Instance.ShowPanel("Result");
        else if (GameManager.Instance.currentState == GameState.GameOver)
            UIManager.Instance.ShowPanel("GameOver");
    }

    public void OnPlayerClicked(string playerId)
    {
        var panel = UIManager.Instance.GetPanel<PlayerDetailPanel>("PlayerDetail");
        if (panel != null)
        {
            var player = GameManager.Instance.currentTeam.GetPlayer(playerId);
            if (player != null)
            {
                panel.SetPlayer(player);
                UIManager.Instance.ShowPanel("PlayerDetail");
            }
        }
    }

    public void OnTrainingSetupClicked() { UIManager.Instance.ShowPanel("TrainingSetup"); }
    public void OnScheduleClicked() { UIManager.Instance.ShowPanel("Schedule"); }
    public void OnFinanceClicked() { UIManager.Instance.ShowPanel("Finance"); }

    public void OnSaveClicked()
    {
        SaveData data = SaveData.CreateFromCurrent("autosave");
        SaveManager.Instance.SaveGame(data);
    }

    public void OnSettingsClicked() { UIManager.Instance.ShowPanel("Settings"); }
}
