using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class TrainingSetupPanel : UIPanel
{
    public Transform dayListContent;
    public Transform playerSelectContent;
    public Button confirmBtn;
    public Button cancelBtn;
    private ScrollRect dayScroll;
    private ScrollRect playerScroll;
    private int selectedDayIndex = -1;
    private List<TrainingSlot> editSchedule;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "训练安排", 32);
        UIHelper.CreateText(transform, "DayLabel", "点击日程项切换训练类型，点击球员指派:", new Vector2(0.05f, 0.78f), new Vector2(0.95f, 0.84f), 16);
        dayScroll = UIHelper.CreateScrollList(transform, "DayList", new Vector2(0.05f, 0.45f), new Vector2(0.95f, 0.78f), out dayListContent);
        UIHelper.CreateText(transform, "PlayerLabel", "可选球员:", new Vector2(0.05f, 0.39f), new Vector2(0.95f, 0.45f), 16);
        playerScroll = UIHelper.CreateScrollList(transform, "PlayerList", new Vector2(0.05f, 0.12f), new Vector2(0.95f, 0.39f), out playerSelectContent);
        confirmBtn = UIHelper.CreateButton(transform, "ConfirmBtn", "确认", new Vector2(0.55f, 0.03f), new Vector2(0.75f, 0.1f), 22, UIHelper.AccentColor);
        cancelBtn = UIHelper.CreateButton(transform, "CancelBtn", "取消", new Vector2(0.8f, 0.03f), new Vector2(0.95f, 0.1f), 22);
    }

    public override void OnShow()
    {
        OnInit();
        confirmBtn.onClick.RemoveAllListeners();
        confirmBtn.onClick.AddListener(OnConfirm);
        cancelBtn.onClick.RemoveAllListeners();
        cancelBtn.onClick.AddListener(OnCancel);

        editSchedule = new List<TrainingSlot>();
        if (TrainingManager.Instance != null)
        {
            foreach (var slot in TrainingManager.Instance.weeklySchedule)
                editSchedule.Add(new TrainingSlot { type = slot.type, assignedPlayerId = slot.assignedPlayerId });
        }
        else
        {
            for (int i = 0; i < 7; i++)
                editSchedule.Add(new TrainingSlot { type = TrainingType.Rest, assignedPlayerId = "" });
        }
        selectedDayIndex = -1;
        RefreshDayList();
        RefreshPlayerList();
    }

    void RefreshDayList()
    {
        for (int i = dayListContent.childCount - 1; i >= 0; i--)
            Destroy(dayListContent.GetChild(i).gameObject);

        string[] dayNames = { "周一", "周二", "周三", "周四", "周五", "周六", "周日" };
        string[] typeNames = { "体能", "技术", "战术", "心理", "休息" };

        for (int i = 0; i < editSchedule.Count; i++)
        {
            var slot = editSchedule[i];
            string playerName = "未指派";
            if (GameManager.Instance != null && GameManager.Instance.currentTeam != null)
            {
                var p = GameManager.Instance.currentTeam.GetPlayer(slot.assignedPlayerId);
                if (p != null) playerName = p.playerName;
            }
            string typeName = ((int)slot.type < typeNames.Length) ? typeNames[(int)slot.type] : "休息";
            string selected = (i == selectedDayIndex) ? " [选中]" : "";
            Button item = UIHelper.CreateListItem(dayListContent, "Day" + i, dayNames[i] + " | " + typeName + " | " + playerName + selected, 40);
            int dayIdx = i;
            item.onClick.AddListener(() => SelectDay(dayIdx));
        }
    }

    void RefreshPlayerList()
    {
        for (int i = playerSelectContent.childCount - 1; i >= 0; i--)
            Destroy(playerSelectContent.GetChild(i).gameObject);

        if (GameManager.Instance == null || GameManager.Instance.currentTeam == null) return;
        foreach (var player in GameManager.Instance.currentTeam.players)
        {
            string info = string.Format("{0} ({1}) 体能:{2} {3}", player.playerName, player.position, player.stamina, player.state);
            Button item = UIHelper.CreateListItem(playerSelectContent, player.playerId, info, 35);
            string pid = player.playerId;
            item.onClick.AddListener(() => AssignPlayer(pid));
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
                editSchedule[selectedDayIndex].assignedPlayerId = "";
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
                TrainingManager.Instance.SetDayTraining(i, editSchedule[i].type, editSchedule[i].assignedPlayerId);
        }
        UIManager.Instance.ShowPanel("MainGame");
    }

    void OnCancel() { UIManager.Instance.ShowPanel("MainGame"); }
}
