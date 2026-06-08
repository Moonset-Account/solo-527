using Kitchen.Core;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Kitchen.UI
{
    public class PauseMenuController : MonoBehaviour
    {
        [Header("References")]
        public GameObject pausePanel;
        public Button resumeButton;
        public Button restartButton;
        public Button settingsButton;
        public Button quitButton;
        public GameObject settingsPanelRef;
        public TextMeshProUGUI retryCountText;
        public TextMeshProUGUI failureHintsText;

        private void OnEnable()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnStateChanged += HandleStateChanged;
            if (resumeButton != null) resumeButton.onClick.AddListener(OnResume);
            if (restartButton != null) restartButton.onClick.AddListener(OnRestart);
            if (settingsButton != null) settingsButton.onClick.AddListener(OnOpenSettings);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuit);
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnStateChanged -= HandleStateChanged;
            if (resumeButton != null) resumeButton.onClick.RemoveListener(OnResume);
            if (restartButton != null) restartButton.onClick.RemoveListener(OnRestart);
            if (settingsButton != null) settingsButton.onClick.RemoveListener(OnOpenSettings);
            if (quitButton != null) quitButton.onClick.RemoveListener(OnQuit);
        }

        private void HandleStateChanged(GameManager.GameState oldS, GameManager.GameState newS)
        {
            if (pausePanel != null)
            {
                pausePanel.SetActive(newS == GameManager.GameState.Paused);
            }
            if (newS == GameManager.GameState.Paused)
            {
                UpdateHintText();
            }
        }

        private void UpdateHintText()
        {
            if (GameManager.Instance?.currentLevelConfig == null) return;
            int retries = Kitchen.Save.SaveManager.Instance?.GetRetryCount(GameManager.Instance.currentLevelConfig) ?? 0;
            if (retryCountText != null) retryCountText.text = retries > 0 ? $"重试次数：{retries}" : "";

            if (retries >= 2 && failureHintsText != null)
            {
                failureHintsText.text = "提示：尝试分工合作，一人备菜一人装盘能提高效率！";
            }
        }

        public void OnResume()
        {
            GameManager.Instance?.ChangeState(GameManager.GameState.Playing);
        }

        public void OnRestart()
        {
            GameManager.Instance?.RestartLevel();
        }

        public void OnOpenSettings()
        {
            if (settingsPanelRef != null) settingsPanelRef.SetActive(true);
            GameManager.Instance?.ChangeState(GameManager.GameState.Settings);
        }

        public void OnQuit()
        {
            GameManager.Instance?.ChangeState(GameManager.GameState.MainMenu);
        }
    }
}
