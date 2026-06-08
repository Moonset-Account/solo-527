using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class LevelSelectPanel : MonoBehaviour
{
    [SerializeField] private Transform levelGridContainer;
    [SerializeField] private GameObject levelButtonPrefab;
    [SerializeField] private TMP_Text totalStarsText;
    [SerializeField] private Button backButton;
    [SerializeField] private Button collectionButton;
    [SerializeField] private Button settingsButton;

    private List<LevelConfig> _levels = new List<LevelConfig>();

    private void OnEnable()
    {
        RefreshLevels();
    }

    private void Start()
    {
        if (backButton != null)
            backButton.onClick.AddListener(OnBackClicked);

        if (collectionButton != null)
            collectionButton.onClick.AddListener(OnCollectionClicked);

        if (settingsButton != null)
            settingsButton.onClick.AddListener(OnSettingsClicked);

        LoadLevelList();
    }

    private void LoadLevelList()
    {
        _levels.Clear();
        var allLevels = ResLoader.Instance.LoadAll<LevelConfig>("Levels");
        if (allLevels != null)
        {
            foreach (var level in allLevels)
            {
                if (level != null)
                    _levels.Add(level);
            }
        }

        _levels.Sort((a, b) => string.Compare(a.levelId, b.levelId, System.StringComparison.Ordinal));
    }

    private void RefreshLevels()
    {
        if (levelGridContainer == null) return;

        foreach (Transform child in levelGridContainer)
        {
            Destroy(child.gameObject);
        }

        int totalStars = 0;

        foreach (var level in _levels)
        {
            if (levelButtonPrefab == null) continue;

            var btnObj = Instantiate(levelButtonPrefab, levelGridContainer);
            var btn = btnObj.GetComponent<Button>();

            bool unlocked = LevelManager.Instance != null && LevelManager.Instance.IsLevelUnlocked(level.levelId);
            int stars = GetLevelStars(level.levelId);
            totalStars += stars;

            var texts = btnObj.GetComponentsInChildren<TMP_Text>();
            if (texts.Length >= 3)
            {
                texts[0].text = level.levelName;
                texts[1].text = GetStarDisplay(stars);
                texts[2].text = unlocked ? "" : "🔒";
            }

            if (btn != null)
            {
                string levelId = level.levelId;
                btn.onClick.AddListener(() => OnLevelClicked(levelId));
                btn.interactable = unlocked;
            }

            var images = btnObj.GetComponentsInChildren<Image>();
            if (!unlocked && images.Length > 0)
            {
                images[0].color = new Color(0.5f, 0.5f, 0.5f, 0.8f);
            }
        }

        if (totalStarsText != null)
            totalStarsText.text = $"★ {totalStars}";
    }

    private int GetLevelStars(string levelId)
    {
        if (SaveSystem.Instance == null || SaveSystem.Instance.CurrentSaveData == null) return 0;

        var saveData = SaveSystem.Instance.CurrentSaveData;
        if (saveData.levels == null) return 0;

        foreach (var level in saveData.levels)
        {
            if (level.levelId == levelId)
                return level.starCount;
        }
        return 0;
    }

    private string GetStarDisplay(int stars)
    {
        string display = "";
        for (int i = 0; i < 3; i++)
        {
            display += i < stars ? "★" : "☆";
        }
        return display;
    }

    private void OnLevelClicked(string levelId)
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (GameFlowManager.Instance != null)
        {
            GameFlowManager.Instance.SelectLevel(levelId);
        }
    }

    private void OnBackClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_back", 0.5f);

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.GoToMainMenu();
    }

    private void OnCollectionClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.OpenCollection();
    }

    private void OnSettingsClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.OpenSettings();
    }
}
