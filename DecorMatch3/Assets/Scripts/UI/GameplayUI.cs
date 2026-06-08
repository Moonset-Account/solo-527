using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3
{
    public class GameplayUI : MonoBehaviour
    {
        [SerializeField] private Text _scoreText;
        [SerializeField] private Text _movesText;
        [SerializeField] private Text _levelText;
        [SerializeField] private Slider _progressSlider;
        [SerializeField] private GameObject _comboPanel;
        [SerializeField] private Text _comboText;
        [SerializeField] private Button _pauseBtn;
        [SerializeField] private Button _hintBtn;
        [SerializeField] private GameObject _pauseMenu;
        [SerializeField] private Button _resumeBtn;
        [SerializeField] private Button _restartBtn;
        [SerializeField] private Button _quitLevelBtn;

        private int _currentScore;
        private int _targetScore;

        private void Start()
        {
            _pauseBtn.onClick.AddListener(OnPause);
            _hintBtn.onClick.AddListener(OnHint);
            _resumeBtn.onClick.AddListener(OnResume);
            _restartBtn.onClick.AddListener(OnRestart);
            _quitLevelBtn.onClick.AddListener(OnQuitLevel);

            GameEvents.OnScoreChanged += UpdateScore;
            GameEvents.OnMovesChanged += UpdateMoves;
            GameEvents.OnComboHit += ShowCombo;

            if (_comboPanel != null) _comboPanel.SetActive(false);
            if (_pauseMenu != null) _pauseMenu.SetActive(false);
        }

        private void OnDestroy()
        {
            GameEvents.OnScoreChanged -= UpdateScore;
            GameEvents.OnMovesChanged -= UpdateMoves;
            GameEvents.OnComboHit -= ShowCombo;
        }

        public void Initialize(LevelConfigData config)
        {
            _targetScore = config.targetScore;
            _currentScore = 0;

            if (_levelText != null) _levelText.text = "Level " + config.levelId;
            if (_scoreText != null) _scoreText.text = "0";
            if (_movesText != null) _movesText.text = config.movesLimit.ToString();
            if (_progressSlider != null)
            {
                _progressSlider.minValue = 0;
                _progressSlider.maxValue = _targetScore;
                _progressSlider.value = 0;
            }
        }

        public void UpdateScore(int score)
        {
            _currentScore = score;
            if (_scoreText != null) _scoreText.text = score.ToString();
        }

        public void UpdateMoves(int moves)
        {
            if (_movesText != null) _movesText.text = moves.ToString();
        }

        public void ShowCombo(int comboLevel)
        {
            if (_comboPanel != null) _comboPanel.SetActive(true);
            if (_comboText != null) _comboText.text = "Combo x" + comboLevel;
        }

        public void HideCombo()
        {
            if (_comboPanel != null) _comboPanel.SetActive(false);
        }

        public void ShowPauseMenu()
        {
            if (_pauseMenu != null) _pauseMenu.SetActive(true);
        }

        public void HidePauseMenu()
        {
            if (_pauseMenu != null) _pauseMenu.SetActive(false);
        }

        private void OnPause()
        {
            PlayButtonSound();
            Time.timeScale = 0f;
            ShowPauseMenu();
        }

        private void OnResume()
        {
            PlayButtonSound();
            Time.timeScale = 1f;
            HidePauseMenu();
        }

        private void OnHint()
        {
            PlayButtonSound();
        }

        private void OnRestart()
        {
            PlayButtonSound();
            Time.timeScale = 1f;
        }

        private void OnQuitLevel()
        {
            PlayButtonSound();
            Time.timeScale = 1f;
            GameManager.Instance.ReturnToMenu();
        }

        private void Update()
        {
            if (_progressSlider != null && _targetScore > 0)
            {
                _progressSlider.value = Mathf.Min(_currentScore, _targetScore);
            }
        }

        private void PlayButtonSound()
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("button_click");
            }
        }
    }
}
