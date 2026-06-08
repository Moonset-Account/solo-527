using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class LevelSelectUI : MonoBehaviour
{
    public List<Button> levelButtons = new List<Button>();
    public GameObject levelInfoPanel;
    public TMPro.TextMeshProUGUI levelNameText;
    public List<Image> starImages = new List<Image>();
    public int selectedLevelIndex = -1;

    private void OnEnable()
    {
        RefreshLevelStars();
    }

    public void SelectLevel(int index)
    {
        selectedLevelIndex = index;

        LevelData data = Resources.Load<LevelData>($"Data/Levels/Level_{index}");
        if (data == null) return;

        levelInfoPanel.SetActive(true);
        levelNameText.text = data.levelName;

        int stars = 0;
        if (ScoringManager.Instance != null && ScoringManager.Instance.totalStars.ContainsKey(index))
            stars = ScoringManager.Instance.totalStars[index];

        for (int i = 0; i < starImages.Count; i++)
        {
            starImages[i].color = i < stars ? Color.yellow : Color.gray;
        }
    }

    public void StartSelectedLevel()
    {
        if (selectedLevelIndex < 0) return;

        LevelData data = Resources.Load<LevelData>($"Data/Levels/Level_{selectedLevelIndex}");
        if (data == null) return;

        LevelManager.Instance.LoadLevel(data);
        GameManager.Instance.StartLevel(selectedLevelIndex);
    }

    public void RefreshLevelStars()
    {
        for (int i = 0; i < levelButtons.Count; i++)
        {
            int levelIndex = i;
            levelButtons[i].onClick.RemoveAllListeners();
            levelButtons[i].onClick.AddListener(() => SelectLevel(levelIndex));

            bool unlocked = IsLevelUnlocked(i);
            levelButtons[i].interactable = unlocked;
        }
    }

    private bool IsLevelUnlocked(int index)
    {
        if (index == 0) return true;

        if (ScoringManager.Instance != null && ScoringManager.Instance.totalStars.ContainsKey(index - 1))
            return ScoringManager.Instance.totalStars[index - 1] > 0;

        return false;
    }
}
