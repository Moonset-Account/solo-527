using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class SchedulePanel : UIPanel
{
    public Transform matchListContainer;
    public GameObject matchItemPrefab;
    public Button closeBtn;

    public override void OnShow()
    {
        closeBtn.onClick.RemoveAllListeners();
        closeBtn.onClick.AddListener(Close);

        foreach (Transform child in matchListContainer)
        {
            Destroy(child.gameObject);
        }

        if (GameManager.Instance != null && GameManager.Instance.currentLevel != null)
        {
            var matches = GameManager.Instance.currentLevel.scheduledMatches;
            if (matches != null)
            {
                foreach (var match in matches)
                {
                    GameObject item = Instantiate(matchItemPrefab, matchListContainer);
                    string status = match.result == MatchResult.NotPlayed ? "未开始" : match.result.ToString();
                    item.GetComponentInChildren<Text>().text = string.Format("第{0}周 vs {1} (强度:{2}) [{3}]",
                        match.matchDay, match.opponentName, match.opponentStrength, status);
                }
            }
        }
    }

    public void Close()
    {
        UIManager.Instance.ShowPanel("MainGame");
    }
}
