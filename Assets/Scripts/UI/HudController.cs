using System;
using System.Collections;
using BeatRunner.Core;
using BeatRunner.Data;
using BeatRunner.Input;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class HudController : MonoBehaviour
    {
        [SerializeField] private GameObject _hudRoot;

        [Header("Score")]
        [SerializeField] private Text _scoreText;
        [SerializeField] private Text _comboText;
        [SerializeField] private Text _comboLabel;
        [SerializeField] private Animator _comboAnimator;

        [Header("Track Info")]
        [SerializeField] private Text _trackNameText;
        [SerializeField] private Text _artistText;
        [SerializeField] private Image _trackCover;

        [Header("Progress")]
        [SerializeField] private Slider _progressBar;
        [SerializeField] private Text _progressText;

        [Header("Fragments")]
        [SerializeField] private Text _fragmentText;
        [SerializeField] private Image _fragmentIcon;

        [Header("Judgment")]
        [SerializeField] private Text _judgmentText;
        [SerializeField] private Animator _judgmentAnimator;
        [SerializeField] private float _judgmentDisplayDuration = 0.5f;

        [Header("Hint")]
        [SerializeField] private GameObject _hintPanel;
        [SerializeField] private Text _hintText;
        [SerializeField] private Text _keyHintText;

        [Header("Buttons")]
        [SerializeField] private Button _pauseButton;

        private RuntimeGameData _runtimeData;
        private Coroutine _judgmentCoroutine;

        public event Action OnPauseClicked;

        private void OnEnable()
        {
            ServiceLocator.TryGet(out _runtimeData);
            if (_pauseButton) _pauseButton.onClick.AddListener(HandlePause);
        }

        private void OnDisable()
        {
            if (_pauseButton) _pauseButton.onClick.RemoveListener(HandlePause);
        }

        private void Update()
        {
            UpdateScoreDisplay();
        }

        private void UpdateScoreDisplay()
        {
            if (_runtimeData == null) return;

            if (_scoreText) _scoreText.text = _runtimeData.currentScore.ToString("N0");

            if (_comboText)
            {
                _comboText.text = _runtimeData.currentCombo.ToString();
                if (_comboLabel)
                {
                    bool show = _runtimeData.currentCombo >= 2;
                    _comboText.enabled = show;
                    _comboLabel.enabled = show;
                }
            }

            if (_fragmentText) _fragmentText.text = _runtimeData.fragmentsCollected.ToString();
        }

        public void SetTrackInfo(TrackData track)
        {
            if (_trackNameText && track != null) _trackNameText.text = track.trackName;
            if (_artistText && track != null) _artistText.text = track.artistName;
            if (_trackCover && track && track.coverArt)
            {
                _trackCover.sprite = track.coverArt;
                _trackCover.color = track.themeColor;
            }
        }

        public void UpdateProgress(float normalized, string timeText)
        {
            if (_progressBar) _progressBar.value = Mathf.Clamp01(normalized);
            if (_progressText) _progressText.text = timeText;
        }

        public void ShowJudgment(JudgmentType type)
        {
            if (_judgmentCoroutine != null) StopCoroutine(_judgmentCoroutine);
            _judgmentCoroutine = StartCoroutine(ShowJudgmentRoutine(type));
        }

        private IEnumerator ShowJudgmentRoutine(JudgmentType type)
        {
            if (_judgmentText != null)
            {
                string text = "";
                Color color = Color.white;
                switch (type)
                {
                    case JudgmentType.Perfect:
                        text = "PERFECT!";
                        color = new Color(1f, 0.85f, 0.2f);
                        break;
                    case JudgmentType.Great:
                        text = "GREAT";
                        color = new Color(0.3f, 1f, 0.5f);
                        break;
                    case JudgmentType.Good:
                        text = "GOOD";
                        color = new Color(0.4f, 0.7f, 1f);
                        break;
                    case JudgmentType.Miss:
                        text = "MISS";
                        color = new Color(1f, 0.3f, 0.3f);
                        break;
                }

                _judgmentText.text = text;
                _judgmentText.color = color;

                if (_judgmentAnimator)
                {
                    _judgmentAnimator.SetTrigger("Show");
                }
            }

            yield return new WaitForSeconds(_judgmentDisplayDuration);

            if (_judgmentText) _judgmentText.text = "";
        }

        public void ShowHint(string message, string keyHint = "")
        {
            if (_hintPanel) _hintPanel.SetActive(true);
            if (_hintText) _hintText.text = message;
            if (_keyHintText) _keyHintText.text = keyHint;
        }

        public void HideHint()
        {
            if (_hintPanel) _hintPanel.SetActive(false);
        }

        public void SetVisible(bool visible)
        {
            if (_hudRoot) _hudRoot.SetActive(visible);
        }

        public void PlayComboBurst()
        {
            if (_comboAnimator) _comboAnimator.SetTrigger("Burst");
        }

        private void HandlePause()
        {
            OnPauseClicked?.Invoke();
        }
    }
}
