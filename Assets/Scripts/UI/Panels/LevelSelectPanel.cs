using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class LevelSelectPanel : UIPanel
{
    public List<LevelConfig> availableLevels = new List<LevelConfig>();
    public Transform levelListContent;
    public Button backBtn;
    private ScrollRect scrollRect;
    private bool uiCreated;

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "选择关卡", 36);
        scrollRect = UIHelper.CreateScrollList(transform, "LevelList", new Vector2(0.1f, 0.15f), new Vector2(0.9f, 0.8f), out levelListContent);
        backBtn = UIHelper.CreateButton(transform, "BackBtn", "返回", new Vector2(0.1f, 0.03f), new Vector2(0.3f, 0.1f), 20);
    }

    public override void OnShow()
    {
        OnInit();
        backBtn.onClick.RemoveAllListeners();
        backBtn.onClick.AddListener(BackToMenu);

        for (int i = levelListContent.childCount - 1; i >= 0; i--)
            Destroy(levelListContent.GetChild(i).gameObject);

        availableLevels = LevelConfigLoader.LoadAllLevels();

        foreach (var level in availableLevels)
        {
            string info = string.Format("{0}  |  难度:{1}  |  {2}周  |  目标胜场:{3}", level.levelName, level.difficulty, level.totalWeeks, level.targetWins);
            Button item = UIHelper.CreateListItem(levelListContent, level.levelId, info, 55);
            string id = level.levelId;
            item.onClick.AddListener(() => OnLevelSelected(id));
        }
    }

    public void OnLevelSelected(string levelId)
    {
        GameManager.Instance.StartNewGame(levelId);
        UIManager.Instance.ShowPanel("MainGame");
    }

    public void BackToMenu() { UIManager.Instance.ShowPanel("MainMenu"); }
}
