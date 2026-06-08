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
    private bool _uiBuilt;

    private void OnEnable()
    {
        RefreshLevels();
    }

    private void Start()
    {
        if (!_uiBuilt) BuildUI();

        if (backButton != null)
            backButton.onClick.AddListener(OnBackClicked);

        if (collectionButton != null)
            collectionButton.onClick.AddListener(OnCollectionClicked);

        if (settingsButton != null)
            settingsButton.onClick.AddListener(OnSettingsClicked);

        LoadLevelList();
    }

    private void BuildUI()
    {
        _uiBuilt = true;

        var panel = UIFactory.CreatePanel(transform, "LevelSelectPanel", false);
        var panelRt = panel.GetComponent<RectTransform>();
        panelRt.anchorMin = Vector2.zero;
        panelRt.anchorMax = Vector2.one;
        panelRt.sizeDelta = Vector2.zero;

        var topArea = new GameObject("TopArea");
        topArea.transform.SetParent(panel.transform, false);
        var topRt = topArea.AddComponent<RectTransform>();
        topRt.anchorMin = new Vector2(0.5f, 1f);
        topRt.anchorMax = new Vector2(1f, 1f);
        topRt.pivot = new Vector2(1f, 1f);
        topRt.sizeDelta = new Vector2(0f, 60f);
        topRt.anchoredPosition = new Vector2(-20f, -20f);

        totalStarsText = UIFactory.CreateLabel(topArea.transform, "TotalStars", "★ 0", 28, new Color(1f, 0.85f, 0.2f));
        var starsLabelRt = totalStarsText.GetComponent<RectTransform>();
        starsLabelRt.anchorMin = Vector2.zero;
        starsLabelRt.anchorMax = Vector2.one;
        starsLabelRt.sizeDelta = Vector2.zero;

        var centerArea = new GameObject("CenterArea");
        centerArea.transform.SetParent(panel.transform, false);
        var centerRt = centerArea.AddComponent<RectTransform>();
        centerRt.anchorMin = new Vector2(0f, 0.15f);
        centerRt.anchorMax = new Vector2(1f, 0.85f);
        centerRt.sizeDelta = new Vector2(-40f, 0f);

        var gridRt = UIFactory.CreateGridContainer(centerArea.transform, "LevelGrid", 3, 200f, 100f);
        levelGridContainer = gridRt;

        var bottomArea = new GameObject("BottomArea");
        bottomArea.transform.SetParent(panel.transform, false);
        var bottomRt = bottomArea.AddComponent<RectTransform>();
        bottomRt.anchorMin = new Vector2(0f, 0f);
        bottomRt.anchorMax = new Vector2(1f, 0.12f);
        bottomRt.sizeDelta = new Vector2(-40f, 0f);
        bottomRt.anchoredPosition = new Vector2(0f, 10f);

        var bottomLayout = bottomArea.AddComponent<HorizontalLayoutGroup>();
        bottomLayout.spacing = 20f;
        bottomLayout.childAlignment = TextAnchor.MiddleCenter;
        bottomLayout.childControlWidth = false;
        bottomLayout.childControlHeight = false;
        bottomLayout.childForceExpandWidth = false;
        bottomLayout.childForceExpandHeight = false;

        backButton = UIFactory.CreateSmallButton(bottomArea.transform, "BackButton", "返回", 120f, 40f);
        collectionButton = UIFactory.CreateSmallButton(bottomArea.transform, "CollectionButton", "图鉴", 120f, 40f);
        settingsButton = UIFactory.CreateSmallButton(bottomArea.transform, "SettingsButton", "设置", 120f, 40f);
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
            bool unlocked = LevelManager.Instance != null && LevelManager.Instance.IsLevelUnlocked(level.levelId);
            int stars = GetLevelStars(level.levelId);
            totalStars += stars;

            var btnObj = UIFactory.CreateLevelButton(levelGridContainer, level.levelName, GetStarDisplay(stars), unlocked);
            var btn = btnObj.GetComponent<Button>();

            if (btn != null)
            {
                string levelId = level.levelId;
                btn.onClick.AddListener(() => OnLevelClicked(levelId));
                btn.interactable = unlocked;
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
