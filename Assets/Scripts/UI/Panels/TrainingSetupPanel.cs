using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class TrainingSetupPanel : UIPanel
{
    public Transform dayListContainer;
    public GameObject dayItemPrefab;
    public Transform playerSelectContainer;
    public GameObject playerSelectItemPrefab;
    public Button confirmBtn;
    public Button cancelBtn;

    private int selectedDayIndex = -1;
    private List<TrainingSlot> editSchedule;

    public override void OnShow()
    {
        confirmBtn.onClick.RemoveAllListeners();
        confirmBtn.onClick.AddListener(OnConfirm);
        cancelBtn.onClick.RemoveAllListeners();
        cancelBtn.onClick.AddListener(OnCancel);

        editSchedule = new List<TrainingSlot>();
        if (TrainingManager.Instance != null)
        {
            foreach (var slot in TrainingManager.Instance.weeklySchedule)
            {
                editSchedule.Add(new TrainingSlot { type = slot.type, assignedPlayerId = slot.assignedPlayerId });
            }
        }
        else
        {
            for (int i = 0; i < 7; i++)
            {
                editSchedule.Add(new TrainingSlot { type = TrainingType.Rest, assignedPlayerId = "" });
            }
        }

        RefreshDayList();
        RefreshPlayerList();
    }

    void RefreshDayList()
    {
        foreach (Transform child in dayListContainer)
        {
            Destroy(child.gameObject);
        }

        string[] dayNames = { "周一", "周二", "周三", "周四", "周五", "周六", "周日" };
        string[] typeNames = { "体能", "技术", "战术", "心理", "休息" };
        TrainingType[] types = { TrainingType.Physical, TrainingType.Technical, TrainingType.Tactical, TrainingType.Mental, TrainingType.Rest };

        for (int i = 0; i < editSchedule.Count; i++)
        {
            GameObject item = Instantiate(dayItemPrefab, dayListContainer);
            int dayIdx = i;
            var slot = editSchedule[i];
            string playerName = "未指派";
            if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
            {
                var p = GameManager.Instance.currentTeam.GetPlayer(slot.assignedPlayerId);
                if (p != null) playerName = p.playerName;
            }
            int typeIdx = Array.IndexOf(types, slot.type);
            string typeName = typeIdx >= 0 ? typeNames[typeIdx] : "休息";
            item.GetComponentInChildren<Text>().text = dayNames[i] + ": " + typeName + " - " + playerName;
            item.GetComponent<Button>().onClick.AddListener(() => SelectDay(dayIdx));
        }
    }

    void RefreshPlayerList()
    {
        foreach (Transform child in playerSelectContainer)
        {
            Destroy(child.gameObject);
        }

        if (GameManager.Instance == null || GameManager.Instance.currentTeam == null) return;

        foreach (var player in GameManager.Instance.currentTeam.players)
        {
            GameObject item = Instantiate(playerSelectItemPrefab, playerSelectContainer);
            item.GetComponentInChildren<Text>().text = string.Format("{0} ({1}) 体能:{2}", player.playerName, player.position, player.stamina);
            string pid = player.playerId;
            item.GetComponent<Button>().onClick.AddListener(() => AssignPlayer(pid));
        }
    }

    void SelectDay(int dayIndex)
    {
        selectedDayIndex = dayIndex;
        if (selectedDayIndex >= 0 && selectedDayIndex < editSchedule.Count)
        {
            int nextType = ((int)editSchedule[selectedDayIndex].type + 1) % 5;
            editSchedule[selectedDayIndex].type = (TrainingType)nextType;
            if (editSchedule[selectedDayIndex].type == TrainingType.Rest)
            {
                editSchedule[selectedDayIndex].assignedPlayerId = "";
            }
            RefreshDayList();
        }
    }

    void AssignPlayer(string playerId)
    {
        if (selectedDayIndex < 0 || selectedDayIndex >= editSchedule.Count) return;
        if (editSchedule[selectedDayIndex].type == TrainingType.Rest) return;
        editSchedule[selectedDayIndex].assignedPlayerId = playerId;
        RefreshDayList();
    }

    void OnConfirm()
    {
        if (TrainingManager.Instance != null)
        {
            for (int i = 0; i < editSchedule.Count && i < TrainingManager.Instance.weeklySchedule.Count; i++)
            {
                TrainingManager.Instance.SetDayTraining(i, editSchedule[i].type, editSchedule[i].assignedPlayerId);
            }
        }
        UIManager.Instance.ShowPanel("MainGame");
    }

    void OnCancel()
    {
        UIManager.Instance.ShowPanel("MainGame");
    }
}
