using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class LevelSelectPanel : UIPanel
{
    public List<LevelConfig> availableLevels = new List<LevelConfig>();
    public Transform levelListContainer;
    public GameObject levelItemPrefab;
    public Button backBtn;

    public override void OnShow()
    {
        backBtn.onClick.RemoveAllListeners();
        backBtn.onClick.AddListener(BackToMenu);

        foreach (Transform child in levelListContainer)
        {
            Destroy(child.gameObject);
        }

        availableLevels = LevelConfigLoader.LoadAllLevels();

        foreach (var level in availableLevels)
        {
            GameObject item = Instantiate(levelItemPrefab, levelListContainer);
            item.GetComponentInChildren<Text>().text = string.Format("{0} (难度:{1})", level.levelName, level.difficulty);
            string id = level.levelId;
            item.GetComponent<Button>().onClick.AddListener(() => OnLevelSelected(id));
        }
    }

    public void OnLevelSelected(string levelId)
    {
        GameManager.Instance.StartNewGame(levelId);
        UIManager.Instance.ShowPanel("MainGame");
    }

    public void BackToMenu()
    {
        UIManager.Instance.ShowPanel("MainMenu");
    }
}
