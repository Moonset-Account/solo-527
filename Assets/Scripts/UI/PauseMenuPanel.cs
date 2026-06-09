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

        private void Awake()
        {
            panelType = UIType.PauseMenu;
            UIManager.Instance?.RegisterPanel(panelType, this);
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
            var ts = Gameplay.TaskSystem.Instance;
            if (ts != null)
            {
                if (currentScoreText) currentScoreText.text = $"当前分数: {ts.TotalScore}";
                int completed = ts.GetCompletedTaskCount();
                int total = ts.GetTotalTaskCount();
                if (taskProgressText) taskProgressText.text = $"任务进度: {completed}/{total}";
                float elapsed = (ts.CurrentLevelConfig?.timeLimitSeconds ?? 0) - ts.TimeRemaining;
                int min = Mathf.FloorToInt(elapsed / 60f);
                int sec = Mathf.FloorToInt(elapsed % 60f);
                if (elapsedTimeText) elapsedTimeText.text = $"用时: {min:00}:{sec:00}";
            }
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
