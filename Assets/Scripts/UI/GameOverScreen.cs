using System;
using BeatRunner.Core;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class GameOverScreen : MonoBehaviour
    {
        [SerializeField] private GameObject _gameOverRoot;
        [SerializeField] private Text _titleText;
        [SerializeField] private Text _scoreText;
        [SerializeField] private Text _fragmentText;
        [SerializeField] private Text _comboText;
        [SerializeField] private Text _reasonText;

        [SerializeField] private Button _retryBtn;
        [SerializeField] private Button _restartTutorialBtn;
        [SerializeField] private Button _backToMenuBtn;

        [SerializeField] private GameObject _tutorialHint;

        public event Action OnRetry;
        public event Action OnRestartTutorial;
        public event Action OnBackToMenu;

        private RuntimeGameData _runtimeData;

        private void OnEnable()
        {
            ServiceLocator.TryGet(out _runtimeData);
            if (_retryBtn) _retryBtn.onClick.AddListener(() => OnRetry?.Invoke());
            if (_restartTutorialBtn) _restartTutorialBtn.onClick.AddListener(() => OnRestartTutorial?.Invoke());
            if (_backToMenuBtn) _backToMenuBtn.onClick.AddListener(() => OnBackToMenu?.Invoke());
        }

        private void OnDisable()
        {
            if (_retryBtn) _retryBtn.onClick.RemoveAllListeners();
            if (_restartTutorialBtn) _restartTutorialBtn.onClick.RemoveAllListeners();
            if (_backToMenuBtn) _backToMenuBtn.onClick.RemoveAllListeners();
        }

        public void Show(string failReason = "撞上了障碍物")
        {
            if (_gameOverRoot) _gameOverRoot.SetActive(true);
            if (_reasonText) _reasonText.text = failReason;

            if (_runtimeData == null) ServiceLocator.TryGet(out _runtimeData);
            if (_runtimeData != null)
            {
                if (_scoreText) _scoreText.text = _runtimeData.currentScore.ToString("N0");
                if (_fragmentText) _fragmentText.text = $"+{_runtimeData.fragmentsCollected}";
                if (_comboText) _comboText.text = _runtimeData.maxCombo.ToString();
            }

            bool showHint = !SaveSystem.CurrentSave.tutorialCompleted;
            if (_tutorialHint) _tutorialHint.SetActive(showHint);
            if (_restartTutorialBtn) _restartTutorialBtn.gameObject.SetActive(showHint);

            GameStateManager.Instance?.ChangeState(GameStateManager.GameState.GameOver);
        }

        public void Hide()
        {
            if (_gameOverRoot) _gameOverRoot.SetActive(false);
        }
    }
}
