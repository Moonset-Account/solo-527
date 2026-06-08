using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class MissionResultPanel : MonoBehaviour
{
    [SerializeField] private TMP_Text levelNameText;
    [SerializeField] private Transform missionResultContainer;
    [SerializeField] private GameObject missionResultEntryPrefab;
    [SerializeField] private TMP_Text totalScoreText;
    [SerializeField] private TMP_Text starDisplayText;
    [SerializeField] private GameObject newRecordBadge;
    [SerializeField] private Transform collectionUnlocksContainer;
    [SerializeField] private GameObject collectionUnlockEntryPrefab;
    [SerializeField] private Button retryButton;
    [SerializeField] private Button levelSelectButton;
    [SerializeField] private Button nextLevelButton;

    private List<MissionResult> _results = new List<MissionResult>();

    private void Start()
    {
        if (retryButton != null)
            retryButton.onClick.AddListener(OnRetryClicked);

        if (levelSelectButton != null)
            levelSelectButton.onClick.AddListener(OnLevelSelectClicked);

        if (nextLevelButton != null)
            nextLevelButton.onClick.AddListener(OnNextLevelClicked);
    }

    private void OnEnable()
    {
        DisplayResults();
    }

    private void DisplayResults()
    {
        if (MissionManager.Instance == null || LevelManager.Instance == null) return;

        _results = MissionManager.Instance.GetAllResults();
        var config = LevelManager.Instance.CurrentConfig;

        if (levelNameText != null && config != null)
            levelNameText.text = config.levelName;

        DisplayMissionResults();
        DisplayTotalScore();
        DisplayStars();
        DisplayCollectionUnlocks();
        CheckNewRecord();

        if (nextLevelButton != null)
            nextLevelButton.gameObject.SetActive(config != null && HasNextLevel(config.levelId));
    }

    private void DisplayMissionResults()
    {
        if (missionResultContainer == null) return;

        foreach (Transform child in missionResultContainer)
            Destroy(child.gameObject);

        foreach (var result in _results)
        {
            if (missionResultEntryPrefab == null) continue;

            var entry = Instantiate(missionResultEntryPrefab, missionResultContainer);
            var texts = entry.GetComponentsInChildren<TMP_Text>();

            var missionData = GetMissionData(result.missionId);

            if (texts.Length >= 4)
            {
                texts[0].text = missionData != null ? missionData.missionName : result.missionId;
                texts[1].text = result.isCompleted ? "✓" : "✗";
                texts[2].text = $"{result.score}";
                texts[3].text = GetStarDisplay(result.starCount);
            }

            if (result.isCompleted)
            {
                GameEvents.TriggerAudioTriggerRequested("result_reveal", 0.6f);
            }
        }
    }

    private void DisplayTotalScore()
    {
        int total = 0;
        foreach (var r in _results)
            total += r.score;

        if (totalScoreText != null)
            totalScoreText.text = $"总分: {total}";
    }

    private void DisplayStars()
    {
        int totalStars = 0;
        foreach (var r in _results)
            totalStars += r.starCount;

        int displayStars = Mathf.Min(3, totalStars / Mathf.Max(1, _results.Count));

        if (starDisplayText != null)
            starDisplayText.text = GetStarDisplay(displayStars);
    }

    private void DisplayCollectionUnlocks()
    {
        if (collectionUnlocksContainer == null) return;

        foreach (Transform child in collectionUnlocksContainer)
            Destroy(child.gameObject);

        foreach (var result in _results)
        {
            if (string.IsNullOrEmpty(result.collectionItemId)) continue;
            if (collectionUnlockEntryPrefab == null) continue;

            var itemData = CollectionManager.Instance != null
                ? CollectionManager.Instance.GetItemData(result.collectionItemId)
                : null;

            var entry = Instantiate(collectionUnlockEntryPrefab, collectionUnlocksContainer);
            var texts = entry.GetComponentsInChildren<TMP_Text>();

            if (texts.Length >= 2)
            {
                texts[0].text = itemData != null ? itemData.displayName : result.collectionItemId;
                texts[1].text = itemData != null ? itemData.description : "新图鉴解锁!";
            }
        }
    }

    private void CheckNewRecord()
    {
        if (newRecordBadge == null) return;

        if (SaveSystem.Instance == null || LevelManager.Instance == null)
        {
            newRecordBadge.SetActive(false);
            return;
        }

        var saveData = SaveSystem.Instance.CurrentSaveData;
        if (saveData == null || saveData.levels == null)
        {
            newRecordBadge.SetActive(false);
            return;
        }

        int total = MissionManager.Instance != null ? MissionManager.Instance.GetTotalScore() : 0;
        string levelId = LevelManager.Instance.CurrentLevelId;

        foreach (var level in saveData.levels)
        {
            if (level.levelId == levelId && total > level.bestScore)
            {
                newRecordBadge.SetActive(true);
                return;
            }
        }

        newRecordBadge.SetActive(false);
    }

    private MissionData GetMissionData(string missionId)
    {
        if (MissionManager.Instance == null) return null;

        foreach (var m in MissionManager.Instance.activeMissions)
        {
            if (m.missionId == missionId) return m;
        }
        return null;
    }

    private bool HasNextLevel(string currentLevelId)
    {
        if (SaveSystem.Instance == null) return false;

        var allLevels = ResLoader.Instance.LoadAll<LevelConfig>("Levels");
        if (allLevels == null) return false;

        foreach (var level in allLevels)
        {
            if (level.requiredLevelIds != null && level.requiredLevelIds.Contains(currentLevelId))
                return true;
        }
        return false;
    }

    private string GetStarDisplay(int stars)
    {
        string display = "";
        for (int i = 0; i < 3; i++)
            display += i < stars ? "★" : "☆";
        return display;
    }

    private void OnRetryClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (LevelManager.Instance != null)
            LevelManager.Instance.RetryLevel();
    }

    private void OnLevelSelectClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.ReturnToLevelSelect();
    }

    private void OnNextLevelClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (LevelManager.Instance == null || LevelManager.Instance.CurrentConfig == null) return;

        string currentId = LevelManager.Instance.CurrentConfig.levelId;
        var allLevels = ResLoader.Instance.LoadAll<LevelConfig>("Levels");
        if (allLevels == null) return;

        foreach (var level in allLevels)
        {
            if (level.requiredLevelIds != null && level.requiredLevelIds.Contains(currentId))
            {
                if (GameFlowManager.Instance != null)
                    GameFlowManager.Instance.SelectLevel(level.levelId);
                return;
            }
        }
    }
}
