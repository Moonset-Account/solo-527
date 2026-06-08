using UnityEngine;
using UnityEngine.UI;
using ShadowPlatformer.Core;
using ShadowPlatformer.Player;

namespace ShadowPlatformer.UI
{
    public class PauseMenu : MonoBehaviour
    {
        [Header("Panels")]
        public GameObject pausePanel;
        public GameObject settingsPanel;
        public GameObject confirmQuitPanel;

        [Header("Buttons")]
        public Button resumeButton;
        public Button restartButton;
        public Button settingsButton;
        public Button quitButton;
        public Button confirmQuitYesButton;
        public Button confirmQuitNoButton;
        public Button settingsBackButton;

        private void OnEnable()
        {
            EventBus.Instance.OnPauseToggled += OnPauseToggled;
            GameManager.Instance.OnGameModeChanged += OnGameModeChanged;

            if (resumeButton != null) resumeButton.onClick.AddListener(Resume);
            if (restartButton != null) restartButton.onClick.AddListener(RestartLevel);
            if (settingsButton != null) settingsButton.onClick.AddListener(ShowSettings);
            if (quitButton != null) quitButton.onClick.AddListener(ShowConfirmQuit);
            if (confirmQuitYesButton != null) confirmQuitYesButton.onClick.AddListener(QuitToMenu);
            if (confirmQuitNoButton != null) confirmQuitNoButton.onClick.AddListener(HideConfirmQuit);
            if (settingsBackButton != null) settingsBackButton.onClick.AddListener(HideSettings);
        }

        private void OnDisable()
        {
            EventBus.Instance.OnPauseToggled -= OnPauseToggled;
            if (GameManager.Instance != null)
                GameManager.Instance.OnGameModeChanged -= OnGameModeChanged;
        }

        private void OnPauseToggled()
        {
            if (GameManager.Instance.CurrentMode == GameMode.Paused)
                Show();
            else
                Hide();
        }

        private void OnGameModeChanged(GameMode mode)
        {
            if (mode != GameMode.Paused)
                Hide();
        }

        public void Show()
        {
            if (pausePanel != null) pausePanel.SetActive(true);
            HideSettings();
            HideConfirmQuit();
            if (resumeButton != null) resumeButton.Select();
        }

        public void Hide()
        {
            if (pausePanel != null) pausePanel.SetActive(false);
            HideSettings();
            HideConfirmQuit();
        }

        public void Resume()
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);
        }

        public void RestartLevel()
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);
            var player = FindObjectOfType<PlayerController>();
            if (player != null)
            {
                player.Die();
                player.Respawn();
            }
        }

        public void ShowSettings()
        {
            if (settingsPanel != null) settingsPanel.SetActive(true);
        }

        public void HideSettings()
        {
            if (settingsPanel != null) settingsPanel.SetActive(false);
        }

        public void ShowConfirmQuit()
        {
            if (confirmQuitPanel != null) confirmQuitPanel.SetActive(true);
        }

        public void HideConfirmQuit()
        {
            if (confirmQuitPanel != null) confirmQuitPanel.SetActive(false);
        }

        public void QuitToMenu()
        {
            GameManager.Instance.SetGameMode(GameMode.Menu);
            SceneLoader.Instance.LoadScene("MainMenu");
        }
    }
}
