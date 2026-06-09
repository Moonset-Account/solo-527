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

        private void Awake()
        {
            panelType = UIType.MainMenu;
            UIManager.Instance?.RegisterPanel(panelType, this);
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
            if (save == null) return;

            if (playerNameText) playerNameText.text = save.playerName;
            if (totalCoinsText) totalCoinsText.text = $"金币: {save.totalCoins}";
            if (totalXPText) totalXPText.text = $"经验: {save.totalXP}";
            if (dailyStreakText) dailyStreakText.text = $"连续挑战: {save.currentDailyChallengeStreak} 天";
            if (versionText) versionText.text = "v1.0.0";
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
