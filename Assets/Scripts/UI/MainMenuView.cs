using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Audio;
using DecorMatch3.Data;

namespace DecorMatch3.UI
{
    public class MainMenuView : UIViewBase
    {
        [Header("Buttons")]
        [SerializeField] private Button startGameButton;
        [SerializeField] private Button tutorialButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button levelSelectButton;

        [Header("Info")]
        [SerializeField] private TextMeshProUGUI playerNameText;
        [SerializeField] private TextMeshProUGUI levelText;
        [SerializeField] private TextMeshProUGUI coinsText;
        [SerializeField] private TextMeshProUGUI xpText;

        [Header("Logo")]
        [SerializeField] private RectTransform logoTransform;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.MainMenu;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (startGameButton != null)
                startGameButton.onClick.AddListener(OnStartGameClicked);

            if (tutorialButton != null)
                tutorialButton.onClick.AddListener(OnTutorialClicked);

            if (settingsButton != null)
                settingsButton.onClick.AddListener(OnSettingsClicked);

            if (levelSelectButton != null)
                levelSelectButton.onClick.AddListener(OnLevelSelectClicked);
        }

        public override void Open()
        {
            base.Open();
            UpdatePlayerInfo();
            PlayLogoAnimation();
            AudioManager.Instance?.PlayMusic(MusicType.MainMenu);
        }

        private void UpdatePlayerInfo()
        {
            var progress = SaveManager.Instance?.CurrentSave.Progress;
            if (progress == null) return;

            if (playerNameText != null)
                playerNameText.text = "设计师";

            if (levelText != null)
                levelText.text = $"Lv.{progress.PlayerLevel}";

            if (coinsText != null)
                coinsText.text = progress.Coins.ToString();

            if (xpText != null)
            {
                int xpNeeded = progress.PlayerLevel * 1000;
                xpText.text = $"XP: {progress.TotalXP}/{xpNeeded}";
            }
        }

        private void PlayLogoAnimation()
        {
            if (logoTransform == null) return;

            StartCoroutine(LogoBounce());
        }

        private System.Collections.IEnumerator LogoBounce()
        {
            yield return new WaitForSeconds(0.2f);
            float timer = 0f;
            Vector3 startScale = logoTransform.localScale;
            while (timer < 0.4f)
            {
                timer += Time.deltaTime;
                float t = timer / 0.4f;
                logoTransform.localScale = startScale * (1 + 0.1f * Mathf.Sin(t * Mathf.PI));
                yield return null;
            }
            logoTransform.localScale = startScale;
        }

        private void OnStartGameClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);

            int levelToPlay = SaveManager.Instance.CurrentSave.Progress.HighestUnlockedLevel;
            OrderData order = LevelManager.Instance.GetOrderForLevel(levelToPlay);

            if (order != null)
            {
                LevelManager.Instance.StartOrder(order.OrderId);
            }

            LevelManager.Instance.StartLevel(levelToPlay);
            SceneLoader.Instance.LoadScene(SceneType.Match3Level, false, () =>
            {
                GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
            });
        }

        private void OnTutorialClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            GameStateManager.Instance.ChangeState(GameState.Tutorial);
            UIManager.Instance.OpenView(UIView.Tutorial);
        }

        private void OnSettingsClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            GameStateManager.Instance.ChangeState(GameState.Settings);
            UIManager.Instance.OpenView(UIView.Settings);
        }

        private void OnLevelSelectClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            UIManager.Instance.OpenView(UIView.LevelSelect);
        }

        private void OnDestroy()
        {
            if (startGameButton != null)
                startGameButton.onClick.RemoveListener(OnStartGameClicked);
            if (tutorialButton != null)
                tutorialButton.onClick.RemoveListener(OnTutorialClicked);
            if (settingsButton != null)
                settingsButton.onClick.RemoveListener(OnSettingsClicked);
            if (levelSelectButton != null)
                levelSelectButton.onClick.RemoveListener(OnLevelSelectClicked);
        }
    }
}
