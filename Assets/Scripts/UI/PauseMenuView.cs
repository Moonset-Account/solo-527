using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public class PauseMenuView : UIViewBase
    {
        [Header("Buttons")]
        [SerializeField] private Button resumeButton;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button mainMenuButton;

        [Header("Info")]
        [SerializeField] private TextMeshProUGUI levelNameText;
        [SerializeField] private TextMeshProUGUI currentScoreText;
        [SerializeField] private TextMeshProUGUI movesLeftText;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.PauseMenu;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (resumeButton != null)
                resumeButton.onClick.AddListener(OnResumeClicked);
            if (restartButton != null)
                restartButton.onClick.AddListener(OnRestartClicked);
            if (settingsButton != null)
                settingsButton.onClick.AddListener(OnSettingsClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenuClicked);
        }

        public override void Open()
        {
            base.Open();
            UpdateInfo();
        }

        private void UpdateInfo()
        {
            var match3Manager = Gameplay.Match3.Match3GameManager.Instance;
            if (match3Manager != null)
            {
                if (levelNameText != null && match3Manager.CurrentLevel != null)
                {
                    levelNameText.text = match3Manager.CurrentLevel.LevelName;
                }
                if (currentScoreText != null)
                {
                    currentScoreText.text = $"得分: {match3Manager.CurrentScore}";
                }
                if (movesLeftText != null)
                {
                    movesLeftText.text = $"剩余步数: {match3Manager.MovesRemaining}";
                }
            }
        }

        private void OnResumeClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
            Gameplay.Match3.Match3GameManager.Instance?.ResumeGame();
        }

        private void OnRestartClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
            Gameplay.Match3.Match3GameManager.Instance?.RestartLevel();
        }

        private void OnSettingsClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            GameStateManager.Instance.ChangeState(GameState.Settings);
            UIManager.Instance.OpenView(UIView.Settings);
        }

        private void OnMainMenuClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            Gameplay.Match3.Match3GameManager.Instance?.ExitToMainMenu();
        }

        private void OnDestroy()
        {
            if (resumeButton != null)
                resumeButton.onClick.RemoveListener(OnResumeClicked);
            if (restartButton != null)
                restartButton.onClick.RemoveListener(OnRestartClicked);
            if (settingsButton != null)
                settingsButton.onClick.RemoveListener(OnSettingsClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.RemoveListener(OnMainMenuClicked);
        }
    }
}
