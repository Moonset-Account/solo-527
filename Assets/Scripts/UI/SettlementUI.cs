using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class SettlementUI : MonoBehaviour
{
    public TMPro.TextMeshProUGUI levelNameText;
    public TMPro.TextMeshProUGUI scoreText;
    public List<Image> starImages = new List<Image>();
    public TMPro.TextMeshProUGUI statsText;
    public Button nextLevelButton;
    public Button retryButton;
    public Button menuButton;

    private int earnedStars;

    private void OnEnable()
    {
        nextLevelButton.onClick.AddListener(OnNextLevelClicked);
        retryButton.onClick.AddListener(OnRetryClicked);
        menuButton.onClick.AddListener(OnMenuClicked);

        PopulateData();
        StartCoroutine(AnimateStarsRoutine());
    }

    private void OnDisable()
    {
        nextLevelButton.onClick.RemoveListener(OnNextLevelClicked);
        retryButton.onClick.RemoveListener(OnRetryClicked);
        menuButton.onClick.RemoveListener(OnMenuClicked);
    }

    private void PopulateData()
    {
        if (LevelManager.Instance == null || LevelManager.Instance.currentLevelData == null) return;

        LevelData data = LevelManager.Instance.currentLevelData;
        levelNameText.text = data.levelName;

        int score = ScoringManager.Instance != null ? ScoringManager.Instance.currentScore : 0;
        scoreText.text = score.ToString();

        earnedStars = ScoringManager.Instance != null ? ScoringManager.Instance.CalculateStars(score, data) : 0;

        int completed = OrderManager.Instance != null ? OrderManager.Instance.completedOrders.Count : 0;
        int failed = OrderManager.Instance != null ? OrderManager.Instance.failedOrders.Count : 0;
        int bestCombo = ScoringManager.Instance != null ? ScoringManager.Instance.comboCount : 0;
        float timeUsed = data.timeLimit;
        if (LevelManager.Instance != null && LevelManager.Instance.levelTimer != null)
            timeUsed = data.timeLimit - LevelManager.Instance.levelTimer.RemainingTime;

        statsText.text = $"Orders Completed: {completed}\nOrders Failed: {failed}\nBest Combo: {bestCombo}\nTime Used: {timeUsed:F1}s";

        foreach (Image star in starImages)
            star.color = Color.gray;

        nextLevelButton.gameObject.SetActive(earnedStars > 0);
    }

    private IEnumerator AnimateStarsRoutine()
    {
        for (int i = 0; i < starImages.Count && i < earnedStars; i++)
        {
            starImages[i].color = Color.gray;
            starImages[i].transform.localScale = Vector3.zero;
        }

        for (int i = 0; i < starImages.Count && i < earnedStars; i++)
        {
            yield return StartCoroutine(ScaleStarRoutine(starImages[i]));
        }
    }

    private IEnumerator ScaleStarRoutine(Image star)
    {
        star.color = Color.yellow;
        float duration = 0.4f;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.unscaledDeltaTime;
            float t = elapsed / duration;
            star.transform.localScale = Vector3.Lerp(Vector3.zero, Vector3.one, t);
            yield return null;
        }

        star.transform.localScale = Vector3.one;
    }

    private void OnNextLevelClicked()
    {
        int nextIndex = GameManager.Instance.CurrentLevelIndex + 1;
        LevelData nextData = Resources.Load<LevelData>($"Data/Levels/Level_{nextIndex}");
        if (nextData != null)
        {
            LevelManager.Instance.LoadLevel(nextData);
            GameManager.Instance.StartLevel(nextIndex);
        }
    }

    private void OnRetryClicked()
    {
        GameManager.Instance.StartLevel(GameManager.Instance.CurrentLevelIndex);
    }

    private void OnMenuClicked()
    {
        GameManager.Instance.ReturnToMenu();
    }
}
