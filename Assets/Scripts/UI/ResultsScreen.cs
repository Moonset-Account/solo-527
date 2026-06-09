using System;
using BeatRunner.Core;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class ResultsScreen : MonoBehaviour
    {
        [SerializeField] private GameObject _resultsRoot;

        [Header("Track Info")]
        [SerializeField] private Text _trackNameText;
        [SerializeField] private Text _artistText;
        [SerializeField] private Image _trackCover;

        [Header("Result Rank")]
        [SerializeField] private Text _rankText;
        [SerializeField] private Image _rankIcon;
        [SerializeField] private Text _scoreText;
        [SerializeField] private Text _accuracyText;

        [Header("Breakdown")]
        [SerializeField] private Text _perfectText;
        [SerializeField] private Text _greatText;
        [SerializeField] private Text _goodText;
        [SerializeField] private Text _missText;
        [SerializeField] private Text _maxComboText;
        [SerializeField] private Text _fragmentsText;

        [Header("High Score")]
        [SerializeField] private GameObject _newHighScoreBanner;
        [SerializeField] private Text _highScoreText;

        [Header("Buttons")]
        [SerializeField] private Button _retryBtn;
        [SerializeField] private Button _nextBtn;
        [SerializeField] private Button _backToMenuBtn;
        [SerializeField] private Button _continueBtn;

        public event Action OnRetry;
        public event Action OnNext;
        public event Action OnBackToMenu;
        public event Action OnContinue;

        private RuntimeGameData _runtimeData;

        private void OnEnable()
        {
            ServiceLocator.TryGet(out _runtimeData);

            if (_retryBtn) _retryBtn.onClick.AddListener(() => OnRetry?.Invoke());
            if (_nextBtn) _nextBtn.onClick.AddListener(() => OnNext?.Invoke());
            if (_backToMenuBtn) _backToMenuBtn.onClick.AddListener(() => OnBackToMenu?.Invoke());
            if (_continueBtn) _continueBtn.onClick.AddListener(() => OnContinue?.Invoke());
        }

        private void OnDisable()
        {
            if (_retryBtn) _retryBtn.onClick.RemoveAllListeners();
            if (_nextBtn) _nextBtn.onClick.RemoveAllListeners();
            if (_backToMenuBtn) _backToMenuBtn.onClick.RemoveAllListeners();
            if (_continueBtn) _continueBtn.onClick.RemoveAllListeners();
        }

        public void Show(string trackName, string artist, Color themeColor,
            bool showNextButton = false, bool showContinueButton = true)
        {
            if (_resultsRoot) _resultsRoot.SetActive(true);

            if (_trackNameText) _trackNameText.text = trackName;
            if (_artistText) _artistText.text = artist;
            if (_trackCover) _trackCover.color = themeColor;

            if (_runtimeData == null) ServiceLocator.TryGet(out _runtimeData);

            PopulateStats();

            if (_nextBtn) _nextBtn.gameObject.SetActive(showNextButton);
            if (_continueBtn) _continueBtn.gameObject.SetActive(showContinueButton);

            GameStateManager.Instance?.ChangeState(GameStateManager.GameState.Results);
        }

        public void Hide()
        {
            if (_resultsRoot) _resultsRoot.SetActive(false);
        }

        private void PopulateStats()
        {
            if (_runtimeData == null) return;

            float accuracy = CalculateAccuracy();

            if (_scoreText) _scoreText.text = _runtimeData.currentScore.ToString("N0");
            if (_accuracyText) _accuracyText.text = $"{accuracy:F2}%";

            if (_perfectText) _perfectText.text = _runtimeData.perfectCount.ToString();
            if (_greatText) _greatText.text = _runtimeData.greatCount.ToString();
            if (_goodText) _goodText.text = _runtimeData.goodCount.ToString();
            if (_missText) _missText.text = _runtimeData.missCount.ToString();
            if (_maxComboText) _maxComboText.text = _runtimeData.maxCombo.ToString();
            if (_fragmentsText) _fragmentsText.text = $"+{_runtimeData.fragmentsCollected}";

            string rank = GetRank(accuracy);
            Color rankColor = GetRankColor(rank);
            if (_rankText)
            {
                _rankText.text = rank;
                _rankText.color = rankColor;
            }
            if (_rankIcon) _rankIcon.color = rankColor;

            if (_highScoreText)
            {
                var hs = SaveSystem.GetHighScore(_runtimeData.selectedTrack?.trackId ?? "");
                bool isNew = _runtimeData.currentScore >= hs.score && hs.score > 0;
                if (hs.score <= 0) isNew = true;
                if (_newHighScoreBanner) _newHighScoreBanner.SetActive(isNew);
                _highScoreText.text = isNew ? _runtimeData.currentScore.ToString("N0") : hs.score.ToString("N0");
            }
        }

        private float CalculateAccuracy()
        {
            if (_runtimeData == null) return 0f;
            float total = _runtimeData.perfectCount + _runtimeData.greatCount +
                          _runtimeData.goodCount + _runtimeData.missCount;
            if (total == 0) return 100f;
            float weighted = (_runtimeData.perfectCount * 1.0f +
                             _runtimeData.greatCount * 0.8f +
                             _runtimeData.goodCount * 0.5f);
            return (weighted / total) * 100f;
        }

        private string GetRank(float accuracy)
        {
            if (accuracy >= 99f) return "S+";
            if (accuracy >= 95f) return "S";
            if (accuracy >= 90f) return "A";
            if (accuracy >= 80f) return "B";
            if (accuracy >= 60f) return "C";
            return "D";
        }

        private Color GetRankColor(string rank)
        {
            switch (rank)
            {
                case "S+": return new Color(1f, 0.85f, 0.2f);
                case "S": return new Color(1f, 0.6f, 0.2f);
                case "A": return new Color(0.3f, 1f, 0.5f);
                case "B": return new Color(0.4f, 0.7f, 1f);
                case "C": return new Color(0.8f, 0.5f, 1f);
                default: return Color.white;
            }
        }
    }
}
