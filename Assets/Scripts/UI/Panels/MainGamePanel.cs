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
    public Transform trainingGrid;
    public Transform playerListContainer;
    public GameObject trainingSlotPrefab;
    public GameObject playerItemPrefab;

    public override void OnShow()
    {
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
        recordText.text = string.Format("胜{0} 负{1} 平{2}",
            GameManager.Instance.currentTeam.seasonWins,
            GameManager.Instance.currentTeam.seasonLosses,
            GameManager.Instance.currentTeam.seasonDraws);

        foreach (Transform child in trainingGrid)
        {
            Destroy(child.gameObject);
        }
        if (TrainingManager.Instance != null)
        {
            string[] dayNames = { "周一", "周二", "周三", "周四", "周五", "周六", "周日" };
            for (int i = 0; i < TrainingManager.Instance.weeklySchedule.Count; i++)
            {
                var slot = TrainingManager.Instance.weeklySchedule[i];
                GameObject item = Instantiate(trainingSlotPrefab, trainingGrid);
                item.GetComponentInChildren<Text>().text = dayNames[i] + ": " + slot.type.ToString();
            }
        }

        foreach (Transform child in playerListContainer)
        {
            Destroy(child.gameObject);
        }
        if (GameManager.Instance.currentTeam.players != null)
        {
            foreach (var player in GameManager.Instance.currentTeam.players)
            {
                GameObject item = Instantiate(playerItemPrefab, playerListContainer);
                item.GetComponentInChildren<Text>().text = string.Format("{0} | {1} | 综合:{2:F0} | 体能:{3}",
                    player.playerName, player.position, player.GetOverallRating(), player.stamina);
                string pid = player.playerId;
                item.GetComponent<Button>().onClick.AddListener(() => OnPlayerClicked(pid));
            }
        }
    }

    public void OnAdvanceWeek()
    {
        GameManager.Instance.AdvanceWeek();
        RefreshUI();
        if (GameManager.Instance.currentState == GameState.Result)
        {
            UIManager.Instance.ShowPanel("Result");
        }
        else if (GameManager.Instance.currentState == GameState.GameOver)
        {
            UIManager.Instance.ShowPanel("GameOver");
        }
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

    public void OnScheduleClicked()
    {
        UIManager.Instance.ShowPanel("Schedule");
    }

    public void OnTrainingSetupClicked()
    {
        UIManager.Instance.ShowPanel("TrainingSetup");
    }

    public void OnFinanceClicked()
    {
        UIManager.Instance.ShowPanel("Finance");
    }

    public void OnSaveClicked()
    {
        SaveData data = SaveData.CreateFromCurrent("autosave");
        SaveManager.Instance.SaveGame(data);
    }

    public void OnSettingsClicked()
    {
        UIManager.Instance.ShowPanel("Settings");
    }
}
