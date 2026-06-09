using System;
using BeatRunner.Core;
using BeatRunner.Input;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class PauseMenu : MonoBehaviour
    {
        [SerializeField] private GameObject _pauseRoot;
        [SerializeField] private Button _resumeBtn;
        [SerializeField] private Button _retryBtn;
        [SerializeField] private Button _settingsBtn;
        [SerializeField] private Button _quitBtn;
        [SerializeField] private Text _trackNameText;
        [SerializeField] private Text _scoreText;

        public event Action OnResume;
        public event Action OnRetry;
        public event Action OnSettings;
        public event Action OnQuitToMenu;

        private void OnEnable()
        {
            if (_resumeBtn) _resumeBtn.onClick.AddListener(HandleResume);
            if (_retryBtn) _retryBtn.onClick.AddListener(HandleRetry);
            if (_settingsBtn) _settingsBtn.onClick.AddListener(HandleSettings);
            if (_quitBtn) _quitBtn.onClick.AddListener(HandleQuit);
        }

        private void OnDisable()
        {
            if (_resumeBtn) _resumeBtn.onClick.RemoveListener(HandleResume);
            if (_retryBtn) _retryBtn.onClick.RemoveListener(HandleRetry);
            if (_settingsBtn) _settingsBtn.onClick.RemoveListener(HandleSettings);
            if (_quitBtn) _quitBtn.onClick.RemoveListener(HandleQuit);
        }

        public void Show(string trackName = "", int score = 0)
        {
            if (_pauseRoot) _pauseRoot.SetActive(true);
            if (_trackNameText) _trackNameText.text = trackName;
            if (_scoreText) _scoreText.text = score.ToString("N0");
            GameStateManager.Instance?.ChangeState(GameStateManager.GameState.Paused);
        }

        public void Hide()
        {
            if (_pauseRoot) _pauseRoot.SetActive(false);
        }

        private void HandleResume()
        {
            Hide();
            OnResume?.Invoke();
            GameStateManager.Instance?.ChangeState(GameStateManager.GameState.Playing);
        }

        private void HandleRetry()
        {
            Hide();
            OnRetry?.Invoke();
        }

        private void HandleSettings()
        {
            OnSettings?.Invoke();
        }

        private void HandleQuit()
        {
            Hide();
            OnQuitToMenu?.Invoke();
        }
    }
}
