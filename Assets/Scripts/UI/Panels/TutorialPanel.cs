using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class TutorialPanel : UIPanel
{
    public List<string> tutorialPages = new List<string>
    {
        "欢迎来到青年队训练管理",
        "安排每周训练计划",
        "比赛日派出最强阵容",
        "注意伤病和恢复",
        "平衡预算和成绩"
    };

    public int currentPage;
    public Text pageText;
    public Button prevBtn;
    public Button nextBtn;
    public Button backBtn;

    public override void OnShow()
    {
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
    }

    public void NextPage()
    {
        ShowPage(currentPage + 1);
    }

    public void PrevPage()
    {
        ShowPage(currentPage - 1);
    }

    public void BackToMenu()
    {
        UIManager.Instance.ShowPanel("MainMenu");
    }
}
