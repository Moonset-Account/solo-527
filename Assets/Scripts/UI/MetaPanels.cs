using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Meta;

namespace LakeSailing.UI
{
    public class LeaderboardPanel : UIPanelBase
    {
        [Header("标签页")]
        [SerializeField] private Button globalTabButton;
        [SerializeField] private Button perLevelTabButton;
        [SerializeField] private GameObject globalPanel;
        [SerializeField] private GameObject perLevelPanel;
        [SerializeField] private Image globalTabSelected;
        [SerializeField] private Image perLevelTabSelected;

        [Header("全局排行榜")]
        [SerializeField] private Transform globalListContainer;
        [SerializeField] private GameObject globalEntryPrefab;

        [Header("关卡排行榜")]
        [SerializeField] private Dropdown levelDropdown;
        [SerializeField] private Transform levelListContainer;
        [SerializeField] private GameObject levelEntryPrefab;
        [SerializeField] private Text playerRankText;

        [Header("按钮")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button refreshButton;

        [Header("玩家状态")]
        [SerializeField] private Text playerTotalScoreText;
        [SerializeField] private Text playerTotalStarsText;
        [SerializeField] private Text playerRankGlobalText;

        private bool isGlobalTab = true;

        private void Awake()
        {
            panelType = UIType.Leaderboard;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start()
        {
            InitializeUI();
            InitializeButtons();
        }

        private void InitializeUI()
        {
            if (levelDropdown != null)
            {
                levelDropdown.ClearOptions();
                levelDropdown.AddOptions(new List<string>
                {
                    "新手教程：平静之湖", "翠湖春晓", "迷雾仙踪", "风暴航线",
                    "金秋秘境", "极寒挑战", "终极试炼"
                });
                levelDropdown.onValueChanged.AddListener(_ => RefreshLevelBoard());
            }
        }

        private void InitializeButtons()
        {
            if (globalTabButton != null) globalTabButton.onClick.AddListener(() => SwitchTab(true));
            if (perLevelTabButton != null) perLevelTabButton.onClick.AddListener(() => SwitchTab(false));
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
            if (refreshButton != null) refreshButton.onClick.AddListener(OnRefreshClicked);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.Leaderboard);
            LeaderboardSystem.Instance?.Initialize();
            SwitchTab(true);
            UpdatePlayerStats();
        }

        private void SwitchTab(bool global)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            isGlobalTab = global;

            if (globalPanel != null) globalPanel.SetActive(global);
            if (perLevelPanel != null) perLevelPanel.SetActive(!global);
            if (globalTabSelected != null) globalTabSelected.enabled = global;
            if (perLevelTabSelected != null) perLevelTabSelected.enabled = !global;

            if (global) RefreshGlobalBoard();
            else RefreshLevelBoard();
        }

        private void RefreshGlobalBoard()
        {
            if (globalListContainer == null || LeaderboardSystem.Instance == null) return;
            foreach (Transform child in globalListContainer) Destroy(child.gameObject);

            var entries = LeaderboardSystem.Instance.GetGlobalLeaderboard();
            for (int i = 0; i < Mathf.Min(50, entries.Count); i++)
            {
                if (globalEntryPrefab == null) continue;
                var go = Instantiate(globalEntryPrefab, globalListContainer);
                var ui = go.GetComponent<LeaderboardEntryUI>();
                if (ui != null) ui.InitializeGlobal(entries[i]);
            }
        }

        private void RefreshLevelBoard()
        {
            if (levelListContainer == null || LeaderboardSystem.Instance == null || levelDropdown == null) return;
            foreach (Transform child in levelListContainer) Destroy(child.gameObject);

            string[] levelIds = { "tutorial_01", "level_01", "level_02", "level_03", "level_04", "level_05", "level_06" };
            int idx = Mathf.Clamp(levelDropdown.value, 0, levelIds.Length - 1);
            string levelId = levelIds[idx];

            var entries = LeaderboardSystem.Instance.GetLevelLeaderboard(levelId);
            for (int i = 0; i < Mathf.Min(50, entries.Count); i++)
            {
                if (levelEntryPrefab == null) continue;
                var go = Instantiate(levelEntryPrefab, levelListContainer);
                var ui = go.GetComponent<LeaderboardEntryUI>();
                if (ui != null) ui.InitializeLevel(entries[i]);
            }

            int rank = LeaderboardSystem.Instance.GetPlayerRankOnLevel(levelId);
            if (playerRankText != null)
            {
                playerRankText.text = rank > 0 ? $"我的排名: 第 {rank} 位" : "暂无排名";
            }
        }

        private void UpdatePlayerStats()
        {
            var save = SaveSystem.Instance?.CurrentSave;
            if (save == null) return;

            if (playerTotalScoreText != null)
            {
                int total = 0;
                if (save.levelBestScores != null)
                {
                    foreach (var kvp in save.levelBestScores) total += kvp.Value.score;
                }
                playerTotalScoreText.text = $"总分数: {total}";
            }
            if (playerTotalStarsText != null)
            {
                int stars = 0;
                if (save.levelBestScores != null)
                {
                    foreach (var kvp in save.levelBestScores) stars += kvp.Value.stars;
                }
                playerTotalStarsText.text = $"总星数: {stars} ★";
            }
            if (playerRankGlobalText != null)
            {
                playerRankGlobalText.text = "全球排名: 第 1,234 位";
            }
        }

        private void OnRefreshClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            LeaderboardSystem.Instance?.Initialize();
            if (isGlobalTab) RefreshGlobalBoard();
            else RefreshLevelBoard();
            UIManager.Instance?.ShowNotification("排行榜已刷新", 1f);
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }
    }

    public class DailyChallengePanel : UIPanelBase
    {
        [Header("挑战信息")]
        [SerializeField] private Text dateText;
        [SerializeField] private Text levelNameText;
        [SerializeField] private Text targetScoreText;
        [SerializeField] private Text modifierNameText;
        [SerializeField] private Text modifierDescText;
        [SerializeField] private Text bonusCoinText;
        [SerializeField] private Text bonusXPText;

        [Header("状态")]
        [SerializeField] private Text statusText;
        [SerializeField] private Text streakText;
        [SerializeField] private Button startButton;
        [SerializeField] private GameObject completedOverlay;

        [Header("天气预报")]
        [SerializeField] private Transform forecastContainer;
        [SerializeField] private GameObject forecastItemPrefab;

        [Header("按钮")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button shareButton;

        private void Awake()
        {
            panelType = UIType.DailyChallenge;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start()
        {
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
            if (startButton != null) startButton.onClick.AddListener(OnStartClicked);
            if (shareButton != null) shareButton.onClick.AddListener(OnShareClicked);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.DailyChallenge);
            LeaderboardSystem.Instance?.Initialize();
            UpdateDisplay();
        }

        private void UpdateDisplay()
        {
            var challenge = LeaderboardSystem.Instance?.TodayChallenge;
            if (challenge == null) return;
            var save = SaveSystem.Instance?.CurrentSave;

            if (dateText != null) dateText.text = $"日期: {challenge.dateKey}";
            if (levelNameText != null)
            {
                string[] names = { "新手教程", "翠湖春晓", "迷雾仙踪", "风暴航线", "金秋秘境", "极寒挑战", "终极试炼" };
                int idx = int.Parse(challenge.levelId.Split('_')[1]);
                levelNameText.text = $"关卡: {names[Mathf.Clamp(idx, 0, names.Length - 1)]}";
            }
            if (targetScoreText != null) targetScoreText.text = $"目标分数: {challenge.targetScore}";
            if (modifierNameText != null) modifierNameText.text = $"特殊规则: {challenge.modifierName}";
            if (modifierDescText != null) modifierDescText.text = GetModifierDescription(challenge.modifierName, challenge.modifierValue);
            if (bonusCoinText != null) bonusCoinText.text = $"奖励金币: +{challenge.bonusCoins}";
            if (bonusXPText != null) bonusXPText.text = $"奖励经验: +{challenge.bonusXP}";

            if (streakText != null && save != null)
            {
                streakText.text = $"当前连续: {save.currentDailyChallengeStreak} 天 (最高: {save.highestDailyChallengeStreak} 天)";
            }

            bool completed = LeaderboardSystem.Instance.HasCompletedTodayChallenge();
            if (statusText != null) statusText.text = completed ? "今日挑战已完成！" : "挑战进行中";
            if (completedOverlay != null) completedOverlay.SetActive(completed);
            if (startButton != null) startButton.interactable = !completed;

            UpdateForecastDisplay(challenge);
        }

        private string GetModifierDescription(string name, float value)
        {
            switch (name)
            {
                case "双倍补给": return "关卡开始时补给是原来的2倍";
                case "无风挑战": return "全程无风，船只完全依赖燃料";
                case "极限风暴": return "出现极端天气的概率大幅增加";
                case "限时加速": return $"船只速度提升 {value * 100:F0}%，但燃料消耗更快";
                case "黄金视野": return "能见度提升，所有拍摄画质+30分";
                default: return "特殊的挑战规则";
            }
        }

        private void UpdateForecastDisplay(DailyChallengeData challenge)
        {
            if (forecastContainer == null || challenge.forcedWeather == null) return;
            foreach (Transform child in forecastContainer) Destroy(child.gameObject);

            for (int i = 0; i < Mathf.Min(6, challenge.forcedWeather.Length); i++)
            {
                if (forecastItemPrefab == null) continue;
                var go = Instantiate(forecastItemPrefab, forecastContainer);
                var ui = go.GetComponent<ForecastItemUI>();
                if (ui != null) ui.Initialize(challenge.forcedWeather[i], i);
            }
        }

        private void OnStartClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            var challenge = LeaderboardSystem.Instance?.TodayChallenge;
            if (challenge == null) return;

            GameManager.Instance?.SetCurrentLevel(challenge.levelId, 99);
            GameManager.Instance?.ChangeState(GameState.Playing);
            UIManager.Instance?.ShowNotification("每日挑战开始！", 1.5f);
            Close();
        }

        private void OnShareClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.ShowNotification("分享功能开发中...", 1f);
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }
    }
}
