using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Gameplay;

namespace LakeSailing.UI
{
    public class ResultPanel : UIPanelBase
    {
        [Header("结果类型")]
        [SerializeField] private bool isVictoryPanel;

        [Header("显示组件")]
        [SerializeField] private Text titleText;
        [SerializeField] private Image[] starsImages;
        [SerializeField] private Text totalScoreText;

        [Header("详细得分")]
        [SerializeField] private Text taskScoreText;
        [SerializeField] private Text timeBonusText;
        [SerializeField] private Text supplyBonusText;
        [SerializeField] private Text bonusText;

        [Header("统计")]
        [SerializeField] private Text tasksCompletedText;
        [SerializeField] private Text photosTakenText;
        [SerializeField] private Text distanceText;
        [SerializeField] private Text timeUsedText;

        [Header("奖励")]
        [SerializeField] private Text coinsText;
        [SerializeField] private Text xpText;
        [SerializeField] private Transform unlocksContainer;
        [SerializeField] private GameObject unlockItemPrefab;

        [Header("按钮")]
        [SerializeField] private Button retryButton;
        [SerializeField] private Button nextButton;
        [SerializeField] private Button backButton;
        [SerializeField] private Button submitButton;

        private int finalScore;
        private int finalStars;
        private string currentLevelId;

        private void Awake()
        {
            panelType = isVictoryPanel ? UIType.Victory : UIType.Defeat;
            UIManager.Instance?.RegisterPanel(panelType, this);
            SubscribeToEvents();
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<LevelFinishedEvent>(OnLevelFinished);
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<LevelFinishedEvent>(OnLevelFinished);
        }

        private void Start()
        {
            InitializeButtons();
        }

        private void InitializeButtons()
        {
            if (retryButton) retryButton.onClick.AddListener(OnRetryClicked);
            if (nextButton) nextButton.onClick.AddListener(OnNextClicked);
            if (backButton) backButton.onClick.AddListener(OnBackClicked);
            if (submitButton) submitButton.onClick.AddListener(OnSubmitClicked);
        }

        private void OnLevelFinished(LevelFinishedEvent e)
        {
            currentLevelId = e.LevelId;
            finalScore = e.Score;
            finalStars = e.Stars;

            bool shouldShow = (isVictoryPanel && e.Victory) || (!isVictoryPanel && !e.Victory);
            if (shouldShow)
            {
                UpdateDisplay(e.Victory);
                Open();
            }
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            if (isVictoryPanel)
            {
                GameManager.Instance?.ChangeState(GameState.Victory);
                AudioManager.Instance?.PlaySfx(SfxType.LevelComplete);
            }
            else
            {
                GameManager.Instance?.ChangeState(GameState.Defeat);
                AudioManager.Instance?.PlaySfx(SfxType.LevelFail);
            }
        }

        private void UpdateDisplay(bool victory)
        {
            var ts = TaskSystem.Instance;
            var levelConfig = ts?.CurrentLevelConfig;
            var boat = Object.FindObjectOfType<BoatController>();

            if (titleText != null)
            {
                titleText.text = victory ? "航行成功！" : "任务失败";
                titleText.color = victory ? Color.green : Color.red;
            }

            if (starsImages != null)
            {
                for (int i = 0; i < starsImages.Length; i++)
                {
                    if (starsImages[i] != null)
                    {
                        starsImages[i].color = i < finalStars ? Color.yellow : Color.gray;
                    }
                }
            }

            if (totalScoreText != null)
            {
                totalScoreText.text = $"{finalScore} 分";
            }

            int completedTasks = ts?.GetCompletedTaskCount() ?? 0;
            int totalTasks = ts?.GetTotalTaskCount() ?? 0;
            int timeLimit = levelConfig != null ? (int)levelConfig.timeLimitSeconds : 0;
            float timeUsed = timeLimit - (ts?.TimeRemaining ?? 0);
            int timeBonus = victory ? Mathf.Max(0, Mathf.RoundToInt((ts?.TimeRemaining ?? 0) * 2f)) : 0;
            int supplyBonus = victory ? Mathf.RoundToInt((boat != null ? (boat.CurrentFuel / boat.MaxFuel + boat.CurrentFood / boat.MaxFood + boat.CurrentBattery / boat.MaxBattery) / 3f : 0) * 500f) : 0;
            int extraBonus = finalStars == 3 ? 500 : 0;

            if (taskScoreText != null)
            {
                int taskScore = Mathf.Max(0, finalScore - timeBonus - supplyBonus - extraBonus);
                taskScoreText.text = $"拍摄得分: {taskScore}";
            }
            if (timeBonusText != null) timeBonusText.text = $"时间奖励: +{timeBonus}";
            if (supplyBonusText != null) supplyBonusText.text = $"补给奖励: +{supplyBonus}";
            if (bonusText != null) bonusText.text = extraBonus > 0 ? $"完美奖励: +{extraBonus}" : "";

            if (tasksCompletedText != null) tasksCompletedText.text = $"任务完成: {completedTasks}/{totalTasks}";
            if (photosTakenText != null) photosTakenText.text = $"拍摄次数: {ts?.PhotosTaken ?? 0}";
            if (distanceText != null) distanceText.text = $"航行距离: {boat?.DistanceTraveled.ToString("F0") ?? "0"}m";
            if (timeUsedText != null)
            {
                int min = Mathf.FloorToInt(timeUsed / 60f);
                int sec = Mathf.FloorToInt(timeUsed % 60f);
                timeUsedText.text = $"用时: {min:00}:{sec:00}";
            }

            int coins = finalScore / 10;
            int xp = victory ? finalScore : finalScore / 2;
            if (coinsText != null) coinsText.text = $"+{coins} 金币";
            if (xpText != null) xpText.text = $"+{xp} 经验";

            if (nextButton != null)
            {
                nextButton.gameObject.SetActive(isVictoryPanel && finalStars >= 1);
            }
            if (submitButton != null)
            {
                submitButton.gameObject.SetActive(victory);
            }
        }

        private void OnRetryClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            GameManager.Instance?.RestartLevel();
        }

        private void OnNextClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.LevelSelect, true);
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            GameManager.Instance?.ReturnToMainMenu();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }

        private void OnSubmitClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            int rank = Meta.LeaderboardSystem.Instance?.SubmitScore(currentLevelId, finalScore, finalStars) ?? -1;
            if (rank > 0)
            {
                UIManager.Instance?.ShowNotification($"排行榜提交成功！排名第 {rank} 位", 2f);
                if (submitButton != null) submitButton.interactable = false;
            }
            AudioManager.Instance?.PlaySfx(SfxType.Coin);
        }
    }
}
