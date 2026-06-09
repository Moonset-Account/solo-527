using UnityEngine;
using UnityEngine.UI;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class PauseMenuPanel : UIPanelBase
    {
        [Header("按钮")]
        [SerializeField] private Button resumeButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button quitButton;

        [Header("信息")]
        [SerializeField] private Text currentScoreText;
        [SerializeField] private Text taskProgressText;
        [SerializeField] private Text elapsedTimeText;

        private Button builtResumeButton;
        private Button builtSettingsButton;
        private Button builtRestartButton;
        private Button builtQuitButton;

        private Text builtCurrentScoreText;
        private Text builtTaskProgressText;
        private Text builtElapsedTimeText;

        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Vector2 ButtonSize = new Vector2(360f, 56f);

        private void Awake()
        {
            panelType = UIType.PauseMenu;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();
            if (panelContent == null) return;

            var contentRoot = panelContent.transform;

            RuntimeUIBuilder.CreateTitle(contentRoot, "游戏暂停", 52, -10f);

            var infoGroup = RuntimeUIBuilder.CreateVerticalGroup(contentRoot, "InfoGroup", 10f, 120f, 0f, 0f, 0f);

            builtCurrentScoreText = RuntimeUIBuilder.CreateLabel(infoGroup.transform, "当前分数: 0", 22,
                TextAnchor.MiddleCenter, 600, 36);
            builtTaskProgressText = RuntimeUIBuilder.CreateLabel(infoGroup.transform, "任务进度: 0/0", 22,
                TextAnchor.MiddleCenter, 600, 36);
            builtElapsedTimeText = RuntimeUIBuilder.CreateLabel(infoGroup.transform, "用时: 00:00", 22,
                TextAnchor.MiddleCenter, 600, 36);

            var buttonsGroup = RuntimeUIBuilder.CreateVerticalGroup(contentRoot, "ButtonsGroup", 20f, 320f, 60f, 0f, 0f);

            builtResumeButton = RuntimeUIBuilder.CreateButton(buttonsGroup.transform, "继续游戏", ButtonSize,
                OnResumeClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtSettingsButton = RuntimeUIBuilder.CreateButton(buttonsGroup.transform, "系统设置", ButtonSize,
                OnSettingsClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtRestartButton = RuntimeUIBuilder.CreateButton(buttonsGroup.transform, "重新开始", ButtonSize,
                OnRestartClicked, 26, ButtonNormalColor, ButtonHoverColor);
            builtQuitButton = RuntimeUIBuilder.CreateButton(buttonsGroup.transform, "返回主菜单", ButtonSize,
                OnQuitClicked, 26, ButtonNormalColor, ButtonHoverColor);
        }

        private void Start()
        {
            InitializeButtons();
        }

        private void InitializeButtons()
        {
            if (resumeButton) resumeButton.onClick.AddListener(OnResumeClicked);
            if (settingsButton) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (restartButton) restartButton.onClick.AddListener(OnRestartClicked);
            if (quitButton) quitButton.onClick.AddListener(OnQuitClicked);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            UpdateInfo();
        }

        private void UpdateInfo()
        {
            string scoreText = "当前分数: 0";
            string progressText = "任务进度: 0/0";
            string timeText = "用时: 00:00";

            var ts = Gameplay.TaskSystem.Instance;
            if (ts != null)
            {
                scoreText = $"当前分数: {ts.TotalScore}";
                int completed = ts.GetCompletedTaskCount();
                int total = ts.GetTotalTaskCount();
                progressText = $"任务进度: {completed}/{total}";
                float elapsed = (ts.CurrentLevelConfig?.timeLimitSeconds ?? 0) - ts.TimeRemaining;
                int min = Mathf.FloorToInt(elapsed / 60f);
                int sec = Mathf.FloorToInt(elapsed % 60f);
                timeText = $"用时: {min:00}:{sec:00}";
            }

            if (builtCurrentScoreText != null) builtCurrentScoreText.text = scoreText;
            if (builtTaskProgressText != null) builtTaskProgressText.text = progressText;
            if (builtElapsedTimeText != null) builtElapsedTimeText.text = timeText;

            if (currentScoreText) currentScoreText.text = scoreText;
            if (taskProgressText) taskProgressText.text = progressText;
            if (elapsedTimeText) elapsedTimeText.text = timeText;
        }

        private void OnResumeClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            GameManager.Instance?.TogglePause();
        }

        private void OnSettingsClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.SettingsMenu);
            GameManager.Instance?.ChangeState(GameState.Settings);
        }

        private void OnRestartClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.ShowConfirmation(
                "重新开始",
                "确定要重新开始当前关卡吗？当前进度将丢失。",
                () =>
                {
                    Close();
                    GameManager.Instance?.RestartLevel();
                });
        }

        private void OnQuitClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.ShowConfirmation(
                "返回主菜单",
                "确定要返回主菜单吗？当前进度将丢失。",
                () =>
                {
                    Close();
                    GameManager.Instance?.ReturnToMainMenu();
                    UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
                });
        }
    }
}
