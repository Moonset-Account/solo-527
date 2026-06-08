using System;
using System.Collections.Generic;
using Kitchen.Config;
using Kitchen.Core;
using Kitchen.Save;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Kitchen.UI
{
    public class ResultScreenController : MonoBehaviour
    {
        [Header("Panels")]
        public GameObject successPanel;
        public GameObject failurePanel;

        [Header("Common")]
        public TextMeshProUGUI levelNameText;
        public Image[] starImages;
        public Sprite starFilledSprite;
        public Sprite starEmptySprite;
        public TextMeshProUGUI scoreText;
        public TextMeshProUGUI coinsText;
        public TextMeshProUGUI ordersCompletedText;
        public TextMeshProUGUI ordersFailedText;
        public TextMeshProUGUI bestScoreText;
        public TextMeshProUGUI retryHintText;

        [Header("Success")]
        public TextMeshProUGUI successMessageText;
        public Button nextLevelButton;
        public Button retryButtonSuccess;
        public Button menuButtonSuccess;

        [Header("Failure")]
        public TextMeshProUGUI failureMessageText;
        public TextMeshProUGUI failureAnalysisText;
        public Transform failureStepsContainer;
        public GameObject failureStepItemPrefab;
        public Button retryButtonFailure;
        public Button menuButtonFailure;
        public Button tutorialButton;

        [Header("Runtime")]
        [SerializeField] private List<string> failureSteps = new List<string>();
        [SerializeField] private int sessionRetryCount;

        private void OnEnable()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnStateChanged += HandleStateChanged;

            if (nextLevelButton != null) nextLevelButton.onClick.AddListener(OnNextLevel);
            if (retryButtonSuccess != null) retryButtonSuccess.onClick.AddListener(OnRetry);
            if (retryButtonFailure != null) retryButtonFailure.onClick.AddListener(OnRetry);
            if (menuButtonSuccess != null) menuButtonSuccess.onClick.AddListener(OnGoMenu);
            if (menuButtonFailure != null) menuButtonFailure.onClick.AddListener(OnGoMenu);
            if (tutorialButton != null) tutorialButton.onClick.AddListener(OnReplayTutorial);
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnStateChanged -= HandleStateChanged;
        }

        private void HandleStateChanged(GameManager.GameState oldS, GameManager.GameState newS)
        {
            if (newS == GameManager.GameState.LevelComplete)
            {
                ShowResult(true);
            }
            else if (newS == GameManager.GameState.LevelFailed)
            {
                ShowResult(false);
            }
            else
            {
                if (successPanel != null) successPanel.SetActive(false);
                if (failurePanel != null) failurePanel.SetActive(false);
            }
        }

        private void ShowResult(bool success)
        {
            LevelConfig level = GameManager.Instance.currentLevelConfig;
            int score = GameManager.Instance.CurrentScore;
            int stars = GameManager.Instance.GetStarRating();
            int coins = GameManager.Instance.CoinsEarned;
            int completed = GameManager.Instance.OrdersCompleted;
            int failed = GameManager.Instance.OrdersFailed;

            if (levelNameText != null) levelNameText.text = level.displayName;
            if (scoreText != null) scoreText.text = score.ToString("N0");
            if (coinsText != null) coinsText.text = $"+{coins}";
            if (ordersCompletedText != null) ordersCompletedText.text = completed.ToString();
            if (ordersFailedText != null) ordersFailedText.text = failed.ToString();

            UpdateStars(success ? stars : 0);

            LevelSaveData levelData = SaveManager.Instance != null ? SaveManager.Instance.GetOrCreateLevelData(level) : null;
            if (bestScoreText != null && levelData != null)
            {
                bestScoreText.text = success && score > levelData.bestScore ? $"新纪录！{score:N0}" : $"最佳：{levelData.bestScore:N0}";
            }

            AnalyzeFailures(success, failed);

            if (levelData != null)
            {
                sessionRetryCount = levelData.consecutiveRetries;
                if (retryHintText != null)
                {
                    if (!success && levelData.consecutiveRetries >= 2)
                    {
                        retryHintText.text = $"已重试 {levelData.consecutiveRetries} 次，系统建议降低难度或重播教程";
                    }
                    else
                    {
                        retryHintText.text = "";
                    }
                }
            }

            if (successPanel != null) successPanel.SetActive(success);
            if (failurePanel != null) failurePanel.SetActive(!success);

            if (successMessageText != null)
            {
                successMessageText.text = stars >= 3 ? "完美通关！" : stars >= 2 ? "出色完成！" : "通过！继续加油！";
            }
            if (failureMessageText != null)
            {
                failureMessageText.text = $"未达到目标分数 ({level.targetScore:N0})，再接再厉！";
            }

            SaveManager.Instance?.RecordLevelAttempt(level, success, score, stars, failureSteps, sessionRetryCount);
            UnlockNextLevels(level, success, stars);
        }

        private void UpdateStars(int count)
        {
            if (starImages == null) return;
            for (int i = 0; i < starImages.Length; i++)
            {
                if (starImages[i] != null)
                    starImages[i].sprite = i < count ? starFilledSprite : starEmptySprite;
            }
        }

        private void AnalyzeFailures(bool success, int failedCount)
        {
            failureSteps.Clear();
            GameManager gm = GameManager.Instance;
            LevelConfig level = gm.currentLevelConfig;

            if (gm.CurrentScore < level.oneStarScore * 0.5f)
            {
                failureSteps.Add("完成订单数量不足，建议先熟悉基础流程");
                SaveManager.Instance?.RecordFailReason("LowScore");
            }
            if (failedCount > Mathf.Max(2, gm.OrdersCompleted))
            {
                failureSteps.Add("订单超时太多，建议优先处理高价值订单");
                SaveManager.Instance?.RecordFailReason("OrderTimeout");
            }
            if (gm.CurrentScore > 0 && gm.ScoreMultiplier <= 1.1f)
            {
                failureSteps.Add("连击中断频繁，避免订单失败可保持连击倍数");
                SaveManager.Instance?.RecordFailReason("ComboBreak");
            }

            if (!success)
            {
                foreach (var hazard in level.hazards)
                {
                    if (gm.LevelTimer > 0 && gm.levelDurationSeconds - gm.LevelTimer > hazard.triggerTime)
                    {
                        if (hazard.type == HazardType.Fire) failureSteps.Add("注意火灾！灶台不要长时间离人");
                        if (hazard.type == HazardType.CrowdedSpace) failureSteps.Add("空间受限，尽量避免在狭窄通道堆放");
                    }
                }
            }

            if (failureAnalysisText != null)
            {
                failureAnalysisText.text = failureSteps.Count > 0 ? "本次失败原因分析：" : "";
            }

            if (failureStepsContainer != null && failureStepItemPrefab != null)
            {
                for (int i = failureStepsContainer.childCount - 1; i >= 0; i--)
                    Destroy(failureStepsContainer.GetChild(i).gameObject);
                foreach (var step in failureSteps)
                {
                    GameObject go = Instantiate(failureStepItemPrefab, failureStepsContainer);
                    var txt = go.GetComponentInChildren<TextMeshProUGUI>();
                    if (txt != null) txt.text = $"• {step}";
                }
            }
        }

        private void UnlockNextLevels(LevelConfig current, bool success, int stars)
        {
            if (!success) return;
            LevelConfig[] allLevels = Resources.LoadAll<LevelConfig>("Config/Levels");
            foreach (var lv in allLevels)
            {
                if (lv.orderIndex == current.orderIndex + 1)
                {
                    LevelSaveData data = SaveManager.Instance?.GetOrCreateLevelData(lv);
                    if (data != null) data.isUnlocked = true;
                }
                if (stars >= 3 && lv.orderIndex == current.orderIndex + 2)
                {
                    LevelSaveData data = SaveManager.Instance?.GetOrCreateLevelData(lv);
                    if (data != null) data.isUnlocked = true;
                }
            }
            SaveManager.Instance?.SaveNow();
        }

        public void OnRetry()
        {
            GameManager.Instance?.RestartLevel();
        }

        public void OnNextLevel()
        {
            LevelConfig current = GameManager.Instance.currentLevelConfig;
            LevelConfig[] allLevels = Resources.LoadAll<LevelConfig>("Config/Levels");
            LevelConfig next = null;
            foreach (var lv in allLevels)
            {
                if (lv.orderIndex == current.orderIndex + 1) { next = lv; break; }
            }
            if (next != null) GameManager.Instance?.StartLevel(next, GameManager.Instance.IsSinglePlayerMode);
            else OnGoMenu();
        }

        public void OnGoMenu()
        {
            GameManager.Instance?.ChangeState(GameManager.GameState.MainMenu);
        }

        public void OnReplayTutorial()
        {
            if (GameManager.Instance?.currentLevelConfig != null)
            {
                var data = SaveManager.Instance?.GetOrCreateLevelData(GameManager.Instance.currentLevelConfig);
                if (data != null)
                {
                    data.tutorialCompleted = false;
                    data.tutorialSkipped = false;
                    SaveManager.Instance?.SaveNow();
                }
                GameManager.Instance.currentLevelConfig.tutorial.enableTutorial = true;
            }
            GameManager.Instance?.RestartLevel();
        }
    }
}
