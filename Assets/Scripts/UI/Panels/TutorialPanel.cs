using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class TutorialPanel : UIPanel
{
    public List<string> tutorialPages = new List<string>
    {
        "欢迎来到青年队训练管理！\n\n你是一名青年足球队的教练，需要带领球队取得佳绩。",
        "安排每周训练计划\n\n点击【训练安排】按钮，为球员制定7天训练日程。\n训练类型：体能/技术/战术/心理/休息\n注意平衡训练强度和球员体能！",
        "比赛日派出最强阵容\n\n每隔一周会有比赛，系统自动选取状态最好的11人上场。\n比赛结果取决于球队综合实力和一定运气。",
        "注意伤病和恢复\n\n球员体能过低时伤病风险增大！\n安排休息日让球员恢复体能。\n受伤的球员无法参加训练和比赛。",
        "平衡预算和成绩\n\n每周有薪资支出，赢得比赛获得奖金。\n预算低于-10000将导致游戏结束！\n合理分配资源，在成绩和财务间取得平衡。"
    };

    public int currentPage;
    public Text pageText;
    public Button prevBtn;
    public Button nextBtn;
    public Button backBtn;
    public Text pageIndicator;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "教程", 36);
        pageText = UIHelper.CreateText(transform, "PageText", "", new Vector2(0.1f, 0.15f), new Vector2(0.9f, 0.75f), 20);
        pageText.alignment = TextAnchor.UpperLeft;
        pageText.supportRichText = true;
        prevBtn = UIHelper.CreateButton(transform, "PrevBtn", "上一页", new Vector2(0.1f, 0.05f), new Vector2(0.3f, 0.12f), 20);
        nextBtn = UIHelper.CreateButton(transform, "NextBtn", "下一页", new Vector2(0.7f, 0.05f), new Vector2(0.9f, 0.12f), 20);
        backBtn = UIHelper.CreateButton(transform, "BackBtn", "返回", new Vector2(0.4f, 0.05f), new Vector2(0.6f, 0.12f), 20);
        pageIndicator = UIHelper.CreateText(transform, "PageIndicator", "", new Vector2(0.3f, 0.05f), new Vector2(0.7f, 0.12f), 16);
    }

    public override void OnShow()
    {
        OnInit();
        currentPage = 0;
        ShowPage(currentPage);
        prevBtn.onClick.RemoveAllListeners();
        prevBtn.onClick.AddListener(PrevPage);
        nextBtn.onClick.RemoveAllListeners();
        nextBtn.onClick.AddListener(NextPage);
        backBtn.onClick.RemoveAllListeners();
        backBtn.onClick.AddListener(BackToMenu);
    }

    public void ShowPage(int index)
    {
        if (index < 0 || index >= tutorialPages.Count) return;
        currentPage = index;
        pageText.text = tutorialPages[currentPage];
        prevBtn.interactable = currentPage > 0;
        nextBtn.interactable = currentPage < tutorialPages.Count - 1;
        pageIndicator.text = (currentPage + 1) + " / " + tutorialPages.Count;
    }

    public void NextPage() { ShowPage(currentPage + 1); }
    public void PrevPage() { ShowPage(currentPage - 1); }
    public void BackToMenu() { UIManager.Instance.ShowPanel("MainMenu"); }
}
