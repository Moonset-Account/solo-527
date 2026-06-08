using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class SchedulePanel : UIPanel
{
    public Transform matchListContent;
    public Button closeBtn;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "赛程表", 32);
        ScrollRect scroll = UIHelper.CreateScrollList(transform, "MatchList", new Vector2(0.05f, 0.15f), new Vector2(0.95f, 0.85f), out matchListContent);
        closeBtn = UIHelper.CreateButton(transform, "CloseBtn", "返回", new Vector2(0.3f, 0.03f), new Vector2(0.7f, 0.12f), 22);
    }

    public override void OnShow()
    {
        OnInit();
        closeBtn.onClick.RemoveAllListeners();
        closeBtn.onClick.AddListener(Close);

        for (int i = matchListContent.childCount - 1; i >= 0; i--)
            Destroy(matchListContent.GetChild(i).gameObject);

        if (GameManager.Instance != null && GameManager.Instance.currentLevel != null)
        {
            var matches = GameManager.Instance.currentLevel.scheduledMatches;
            if (matches != null)
            {
                foreach (var match in matches)
                {
                    string status = match.result == MatchResult.NotPlayed ? "未开始" : match.result.ToString();
                    string result = match.result != MatchResult.NotPlayed ? string.Format(" {0}:{1}", match.ourScore, match.opponentScore) : "";
                    string info = string.Format("第{0}周 vs {1} (强度:{2}) [{3}]{4}", match.matchDay, match.opponentName, match.opponentStrength, status, result);
                    Color? bg = match.result == MatchResult.Win ? (Color?)UIHelper.AccentColor : (match.result == MatchResult.Loss ? (Color?)UIHelper.DangerColor : null);
                    UIHelper.CreateListItem(matchListContent, match.matchId, info, 45);
                }
            }
        }
    }

    public void Close() { UIManager.Instance.ShowPanel("MainGame"); }
}
