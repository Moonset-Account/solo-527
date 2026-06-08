using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;
using DecorMatch3.Gameplay.Match3;

namespace DecorMatch3.UI
{
    public class Match3HUDView : UIViewBase
    {
        [Header("Top Bar")]
        [SerializeField] private TextMeshProUGUI levelNameText;
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI targetScoreText;
        [SerializeField] private TextMeshProUGUI movesText;
        [SerializeField] private Button pauseButton;

        [Header("Objective Panel")]
        [SerializeField] private Transform objectivesContainer;
        [SerializeField] private GameObject objectiveItemPrefab;

        [Header("Combo Display")]
        [SerializeField] private GameObject comboDisplay;
        [SerializeField] private TextMeshProUGUI comboText;
        [SerializeField] private CanvasGroup comboCanvasGroup;

        [Header("Score Animation")]
        [SerializeField] private Transform scorePopupContainer;
        [SerializeField] private GameObject scorePopupPrefab;

        private Dictionary<GemType, ObjectiveItemUI> _objectiveItems = new Dictionary<GemType, ObjectiveItemUI>();
        private Coroutine _comboDisplayCoroutine;
        private int _displayedScore = 0;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.Match3HUD;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (pauseButton != null)
                pauseButton.onClick.AddListener(OnPauseClicked);

            EventBus.Subscribe<GameStateChangedEvent>(OnGameStateChanged);
        }

        public override void Open()
        {
            base.Open();
            RegisterMatch3Events();
            InitializeObjectives();
            _displayedScore = 0;
        }

        public override void Close(bool animate = true)
        {
            base.Close(animate);
            UnregisterMatch3Events();
        }

        private void RegisterMatch3Events()
        {
            var match3Manager = Match3GameManager.Instance;
            if (match3Manager != null)
            {
                match3Manager.OnScoreChanged += HandleScoreChanged;
                match3Manager.OnMovesChanged += HandleMovesChanged;
                match3Manager.OnObjectiveProgress += HandleObjectiveProgress;
                match3Manager.OnGameStarted += HandleGameStarted;
            }

            if (Board.Instance != null)
            {
                Board.Instance.OnComboTriggered += HandleComboTriggered;
                Board.Instance.OnScoreAdded += HandleScoreAdded;
            }
        }

        private void UnregisterMatch3Events()
        {
            var match3Manager = Match3GameManager.Instance;
            if (match3Manager != null)
            {
                match3Manager.OnScoreChanged -= HandleScoreChanged;
                match3Manager.OnMovesChanged -= HandleMovesChanged;
                match3Manager.OnObjectiveProgress -= HandleObjectiveProgress;
                match3Manager.OnGameStarted -= HandleGameStarted;
            }

            if (Board.Instance != null)
            {
                Board.Instance.OnComboTriggered -= HandleComboTriggered;
                Board.Instance.OnScoreAdded -= HandleScoreAdded;
            }
        }

        private void OnGameStateChanged(GameStateChangedEvent e)
        {
            if (e.NewState == GameState.PausedMatch3)
            {
                UIManager.Instance.OpenView(UIView.PauseMenu, true, false);
            }
        }

        private void HandleGameStarted()
        {
            var level = Match3GameManager.Instance.CurrentLevel;
            if (level != null)
            {
                if (levelNameText != null)
                    levelNameText.text = level.LevelName;
                if (targetScoreText != null)
                    targetScoreText.text = $"/{level.TargetScore}";
                if (movesText != null)
                    movesText.text = level.MovesLimit.ToString();
            }

            InitializeObjectives();
        }

        private void InitializeObjectives()
        {
            if (objectivesContainer == null || Match3GameManager.Instance?.CurrentLevel?.Objectives == null)
                return;

            foreach (Transform child in objectivesContainer)
            {
                Destroy(child.gameObject);
            }
            _objectiveItems.Clear();

            foreach (var obj in Match3GameManager.Instance.CurrentLevel.Objectives)
            {
                if (objectiveItemPrefab == null) continue;

                GameObject objGO = Instantiate(objectiveItemPrefab, objectivesContainer);
                ObjectiveItemUI itemUI = objGO.GetComponent<ObjectiveItemUI>();
                if (itemUI == null) itemUI = objGO.AddComponent<ObjectiveItemUI>();

                itemUI.Initialize(obj.TargetGem, obj.CurrentCount, obj.RequiredCount);
                _objectiveItems[obj.TargetGem] = itemUI;

                HandleObjectiveProgress(obj.TargetGem, obj.CurrentCount, obj.RequiredCount);
            }
        }

        private void HandleScoreChanged(int newScore)
        {
            StartCoroutine(AnimateScore(_displayedScore, newScore, 0.3f));
        }

        private IEnumerator AnimateScore(int from, int to, float duration)
        {
            float timer = 0f;
            while (timer < duration)
            {
                timer += Time.deltaTime;
                float t = timer / duration;
                _displayedScore = Mathf.RoundToInt(Mathf.Lerp(from, to, t));
                if (scoreText != null)
                    scoreText.text = _displayedScore.ToString();
                yield return null;
            }
            _displayedScore = to;
            if (scoreText != null)
                scoreText.text = _displayedScore.ToString();
        }

        private void HandleMovesChanged(int moves)
        {
            if (movesText != null)
            {
                movesText.text = moves.ToString();
                if (moves <= 5)
                {
                    movesText.color = Color.red;
                    StartCoroutine(PulseText(movesText));
                }
                else
                {
                    movesText.color = Color.white;
                }
            }
        }

        private IEnumerator PulseText(TextMeshProUGUI text)
        {
            float timer = 0f;
            while (timer < 0.5f)
            {
                timer += Time.deltaTime;
                text.transform.localScale = Vector3.one * (1 + 0.15f * Mathf.Sin(timer * Mathf.PI * 4));
                yield return null;
            }
            text.transform.localScale = Vector3.one;
        }

        private void HandleObjectiveProgress(GemType type, int current, int required)
        {
            if (_objectiveItems.TryGetValue(type, out ObjectiveItemUI item))
            {
                item.UpdateProgress(current, required);
            }
        }

        private void HandleComboTriggered(int combo)
        {
            if (comboDisplayCoroutine != null)
            {
                StopCoroutine(comboDisplayCoroutine);
            }
            comboDisplayCoroutine = StartCoroutine(ShowCombo(combo));
        }

        private IEnumerator ShowCombo(int combo)
        {
            if (comboText != null)
            {
                comboText.text = $"{combo}连击！";
                comboText.fontSize = 40 + combo * 5;
            }

            if (comboDisplay != null)
                comboDisplay.SetActive(true);

            if (comboCanvasGroup != null)
            {
                comboCanvasGroup.alpha = 0;
                comboDisplay.transform.localScale = Vector3.one * 0.5f;
            }

            float timer = 0f;
            while (timer < 0.3f)
            {
                timer += Time.deltaTime;
                float t = timer / 0.3f;
                if (comboCanvasGroup != null)
                    comboCanvasGroup.alpha = Mathf.Clamp01(t * 1.5f);
                comboDisplay.transform.localScale = Vector3.one * Mathf.Lerp(0.5f, 1.1f, t);
                yield return null;
            }

            yield return new WaitForSeconds(0.3f);

            timer = 0f;
            while (timer < 0.3f)
            {
                timer += Time.deltaTime;
                float t = timer / 0.3f;
                if (comboCanvasGroup != null)
                    comboCanvasGroup.alpha = 1 - t;
                comboDisplay.transform.localScale = Vector3.one * Mathf.Lerp(1.1f, 0.8f, t);
                yield return null;
            }

            if (comboDisplay != null)
                comboDisplay.SetActive(false);
        }

        private void HandleScoreAdded(int score, int combo)
        {
            SpawnScorePopup(score);
        }

        private void SpawnScorePopup(int score)
        {
            if (scorePopupContainer == null || scorePopupPrefab == null) return;

            GameObject popup = Instantiate(scorePopupPrefab, scorePopupContainer);
            TextMeshProUGUI popupText = popup.GetComponentInChildren<TextMeshProUGUI>();
            if (popupText != null)
            {
                popupText.text = $"+{score}";
            }

            StartCoroutine(AnimateScorePopup(popup));
        }

        private IEnumerator AnimateScorePopup(GameObject popup)
        {
            RectTransform rt = popup.GetComponent<RectTransform>();
            CanvasGroup cg = popup.GetComponent<CanvasGroup>();
            if (cg == null) cg = popup.AddComponent<CanvasGroup>();

            Vector2 startPos = rt != null ? rt.anchoredPosition : Vector2.zero;
            Vector2 endPos = startPos + new Vector2(0, 80);

            float timer = 0f;
            cg.alpha = 1;
            while (timer < 0.8f)
            {
                timer += Time.deltaTime;
                float t = timer / 0.8f;
                if (rt != null)
                    rt.anchoredPosition = Vector2.Lerp(startPos, endPos, t);
                cg.alpha = 1 - t;
                yield return null;
            }

            Destroy(popup);
        }

        private void OnPauseClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            GameStateManager.Instance.TogglePause();
        }

        private void OnDestroy()
        {
            if (pauseButton != null)
                pauseButton.onClick.RemoveListener(OnPauseClicked);
            EventBus.Unsubscribe<GameStateChangedEvent>(OnGameStateChanged);
        }
    }

    public class ObjectiveItemUI : MonoBehaviour
    {
        [SerializeField] private Image gemIcon;
        [SerializeField] private TextMeshProUGUI progressText;
        [SerializeField] private Image progressBarFill;
        [SerializeField] private GameObject checkmark;

        private GemType _gemType;
        private int _current;
        private int _required;

        public void Initialize(GemType type, int current, int required)
        {
            _gemType = type;
            _current = current;
            _required = required;

            if (gemIcon != null)
            {
                gemIcon.color = Gameplay.Match3.Gem.GetColorForGem(type);
            }

            UpdateProgress(current, required);
        }

        public void UpdateProgress(int current, int required)
        {
            _current = current;
            _required = required;

            if (progressText != null)
            {
                progressText.text = $"{current}/{required}";
                progressText.color = current >= required ? new Color(0.3f, 0.9f, 0.4f) : Color.white;
            }

            if (progressBarFill != null)
            {
                progressBarFill.fillAmount = Mathf.Clamp01((float)current / required);
            }

            if (checkmark != null)
            {
                checkmark.SetActive(current >= required);
            }
        }
    }
}
