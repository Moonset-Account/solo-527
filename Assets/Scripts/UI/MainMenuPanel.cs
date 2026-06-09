using UnityEngine;
using UnityEngine.UI;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Meta;

namespace LakeSailing.UI
{
    public class MainMenuPanel : UIPanelBase
    {
        [Header("按钮")]
        [SerializeField] private Button startGameButton;
        [SerializeField] private Button tutorialButton;
        [SerializeField] private Button galleryButton;
        [SerializeField] private Button achievementsButton;
        [SerializeField] private Button leaderboardButton;
        [SerializeField] private Button dailyChallengeButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button quitButton;

        [Header("信息显示")]
        [SerializeField] private Text playerNameText;
        [SerializeField] private Text totalCoinsText;
        [SerializeField] private Text totalXPText;
        [SerializeField] private Text dailyStreakText;
        [SerializeField] private Text versionText;

        private Button builtStartGameButton;
        private Button builtTutorialButton;
        private Button builtGalleryButton;
        private Button builtAchievementsButton;
        private Button builtLeaderboardButton;
        private Button builtDailyChallengeButton;
        private Button builtSettingsButton;
        private Button builtQuitButton;

        private Text builtPlayerNameText;
        private Text builtTotalCoinsText;
        private Text builtTotalXPText;
        private Text builtDailyStreakText;

        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Vector2 ButtonSize = new Vector2(400f, 60f);

        private void Awake()
        {
            panelType = UIType.MainMenu;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();
            if (panelContent == null) return;

            var contentRoot = panelContent.transform;

            RuntimeUIBuilder.CreateTitle(contentRoot, "湖面航行天气挑战", 56, -20f);

            RuntimeUIBuilder.CreateTitle(contentRoot,
                "8页教程带你全面了解：天气系统、风向航行、补给管理、路线规划、拍摄任务、评分系统、成就收集、每日挑战",
                20, 60f);

            var vGroup = RuntimeUIBuilder.CreateVerticalGroup(contentRoot, "ButtonsGroup", 18f, 200f, 80f, 0f, 0f);

            builtStartGameButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "开始游戏", ButtonSize,
                OnStartGameClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtTutorialButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "新手教程", ButtonSize,
                OnTutorialClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtGalleryButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "图鉴收集", ButtonSize,
                OnGalleryClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtAchievementsButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "成就系统", ButtonSize,
                OnAchievementsClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtLeaderboardButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "排行榜", ButtonSize,
                OnLeaderboardClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtDailyChallengeButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "每日挑战", ButtonSize,
                OnDailyChallengeClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtSettingsButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "系统设置", ButtonSize,
                OnSettingsClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtQuitButton = RuntimeUIBuilder.CreateButton(vGroup.transform, "退出游戏", ButtonSize,
                OnQuitClicked, 26, ButtonNormalColor, ButtonHoverColor);

            var bottomBar = RuntimeUIBuilder.CreateHorizontalGroup(contentRoot, "BottomBar", 40f);
            var bottomRT = bottomBar.GetComponent<RectTransform>();
            bottomRT.anchorMin = new Vector2(0.5f, 0f);
            bottomRT.anchorMax = new Vector2(0.5f, 0f);
            bottomRT.pivot = new Vector2(0.5f, 0f);
            bottomRT.anchoredPosition = new Vector2(0f, 40f);

            builtPlayerNameText = RuntimeUIBuilder.CreateLabel(bottomBar.transform, "玩家: 未登录", 20,
                TextAnchor.MiddleCenter, 200, 36);
            builtTotalCoinsText = RuntimeUIBuilder.CreateLabel(bottomBar.transform, "金币: 0", 20,
                TextAnchor.MiddleCenter, 160, 36);
            builtTotalXPText = RuntimeUIBuilder.CreateLabel(bottomBar.transform, "经验: 0", 20,
                TextAnchor.MiddleCenter, 160, 36);
            builtDailyStreakText = RuntimeUIBuilder.CreateLabel(bottomBar.transform, "连续: 0 天", 20,
                TextAnchor.MiddleCenter, 180, 36);
        }

        private void Start()
        {
            InitializeButtons();
            UpdateDisplay();
        }

        private void InitializeButtons()
        {
            if (startGameButton) startGameButton.onClick.AddListener(OnStartGameClicked);
            if (tutorialButton) tutorialButton.onClick.AddListener(OnTutorialClicked);
            if (galleryButton) galleryButton.onClick.AddListener(OnGalleryClicked);
            if (achievementsButton) achievementsButton.onClick.AddListener(OnAchievementsClicked);
            if (leaderboardButton) leaderboardButton.onClick.AddListener(OnLeaderboardClicked);
            if (dailyChallengeButton) dailyChallengeButton.onClick.AddListener(OnDailyChallengeClicked);
            if (settingsButton) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (quitButton) quitButton.onClick.AddListener(OnQuitClicked);
        }

        private void UpdateDisplay()
        {
            var save = SaveSystem.Instance?.CurrentSave;
            string playerName = "玩家: 未登录";
            string coins = "金币: 0";
            string xp = "经验: 0";
            string streak = "连续: 0 天";
            string version = "v1.0.0";

            if (save != null)
            {
                playerName = $"玩家: {save.playerName}";
                coins = $"金币: {save.totalCoins}";
                xp = $"经验: {save.totalXP}";
                streak = $"连续: {save.currentDailyChallengeStreak} 天";
            }

            if (builtPlayerNameText != null) builtPlayerNameText.text = playerName;
            if (builtTotalCoinsText != null) builtTotalCoinsText.text = coins;
            if (builtTotalXPText != null) builtTotalXPText.text = xp;
            if (builtDailyStreakText != null) builtDailyStreakText.text = streak;

            if (playerNameText) playerNameText.text = save != null ? save.playerName : "未登录";
            if (totalCoinsText) totalCoinsText.text = coins;
            if (totalXPText) totalXPText.text = xp;
            if (dailyStreakText) dailyStreakText.text = streak;
            if (versionText) versionText.text = version;
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.MainMenu);
            UpdateDisplay();
        }

        private void OnStartGameClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.LevelSelect, true);
        }

        private void OnTutorialClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.Tutorial);
            GameManager.Instance?.ChangeState(GameState.Tutorial);
        }

        private void OnGalleryClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.Gallery);
            GameManager.Instance?.ChangeState(GameState.Gallery);
        }

        private void OnAchievementsClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.Achievements);
            GameManager.Instance?.ChangeState(GameState.Achievements);
        }

        private void OnLeaderboardClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.Leaderboard);
            GameManager.Instance?.ChangeState(GameState.Leaderboard);
        }

        private void OnDailyChallengeClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.DailyChallenge);
            GameManager.Instance?.ChangeState(GameState.DailyChallenge);
        }

        private void OnSettingsClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.SettingsMenu);
            GameManager.Instance?.ChangeState(GameState.Settings);
        }

        private void OnQuitClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
