using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DecorMatch3.Utils;
using DecorMatch3.Core;
using DecorMatch3.Core.Events;

namespace DecorMatch3.UI
{
    public enum UIState
    {
        MainMenu,
        LevelSelect,
        Match3,
        Decoration,
        OrderSelect,
        Pause,
        Settings,
        Achievements,
        Leaderboard,
        DailyChallenge,
        Result,
        Loading
    }

    public class UIManager : Singleton<UIManager>
    {
        [SerializeField] private Canvas _mainCanvas;
        [SerializeField] private RectTransform _topBar;
        [SerializeField] private RectTransform _bottomBar;
        [SerializeField] private RectTransform _contentArea;
        [SerializeField] private RectTransform _popupContainer;

        [Header("货币显示")]
        [SerializeField] private Text _coinsText;
        [SerializeField] private Text _gemsText;
        [SerializeField] private Text _starsText;

        [Header("加载界面")]
        [SerializeField] private GameObject _loadingScreen;
        [SerializeField] private Image _loadingProgressBar;
        [SerializeField] private Text _loadingText;

        [Header("弹窗Prefabs")]
        [SerializeField] private GameObject _dialogPrefab;
        [SerializeField] private GameObject _toastPrefab;

        private readonly Dictionary<UIState, GameObject> _stateRoots = new Dictionary<UIState, GameObject>();
        private readonly Stack<GameObject> _popupStack = new Stack<GameObject>();
        private UIState _currentState;

        public UIState CurrentState => _currentState;
        public Canvas MainCanvas => _mainCanvas;
        public RectTransform ContentArea => _contentArea;

        public event Action<UIState> OnStateChanged;

        protected override void Awake()
        {
            base.Awake();
            InitializeUI();
            SubscribeToEvents();
        }

        private void Start()
        {
            UpdateCurrencyDisplay();
        }

        private void InitializeUI()
        {
            if (_mainCanvas == null)
            {
                GameObject canvasGO = new GameObject("MainCanvas");
                canvasGO.transform.SetParent(transform);
                _mainCanvas = canvasGO.AddComponent<Canvas>();
                _mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvasGO.AddComponent<CanvasScaler>();
                canvasGO.AddComponent<GraphicRaycaster>();
            }
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<SaveDataLoadedEvent>(_ => UpdateCurrencyDisplay());
            EventBus.Subscribe<SaveDataSavedEvent>(_ => UpdateCurrencyDisplay());
            EventBus.Subscribe<SceneLoadStartedEvent>(HandleSceneLoadStarted);
            EventBus.Subscribe<SceneLoadCompletedEvent>(HandleSceneLoadCompleted);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<SaveDataLoadedEvent>(_ => UpdateCurrencyDisplay());
            EventBus.Unsubscribe<SaveDataSavedEvent>(_ => UpdateCurrencyDisplay());
            EventBus.Unsubscribe<SceneLoadStartedEvent>(HandleSceneLoadStarted);
            EventBus.Unsubscribe<SceneLoadCompletedEvent>(HandleSceneLoadCompleted);
        }

        public void RegisterStateRoot(UIState state, GameObject root)
        {
            _stateRoots[state] = root;
            root.SetActive(false);
        }

        public void ChangeState(UIState newState)
        {
            if (_currentState == newState) return;

            if (_stateRoots.TryGetValue(_currentState, out GameObject oldRoot))
            {
                oldRoot?.SetActive(false);
            }

            UIState previousState = _currentState;
            _currentState = newState;

            if (_stateRoots.TryGetValue(newState, out GameObject newRoot))
            {
                newRoot?.SetActive(true);
                StartCoroutine(newRoot.GetComponent<CanvasGroup>()?.DoFade(1f, 0.2f));
            }

            Debug.Log($"[UIManager] State changed: {previousState} -> {newState}");
            OnStateChanged?.Invoke(newState);
        }

        public void UpdateCurrencyDisplay()
        {
            if (SaveSystem.Instance == null) return;

            if (_coinsText != null)
                _coinsText.text = SaveSystem.Instance.CurrentSave.TotalCoins.ToString("N0");
            if (_gemsText != null)
                _gemsText.text = SaveSystem.Instance.CurrentSave.TotalGems.ToString("N0");
            if (_starsText != null)
                _starsText.text = SaveSystem.Instance.CurrentSave.TotalStars.ToString("N0");
        }

        public void ShowLoadingScreen(bool show, string text = null)
        {
            if (_loadingScreen != null)
            {
                _loadingScreen.SetActive(show);
                if (show && _loadingText != null && !string.IsNullOrEmpty(text))
                {
                    _loadingText.text = text;
                }
            }
        }

        public void UpdateLoadingProgress(float progress)
        {
            if (_loadingProgressBar != null)
            {
                _loadingProgressBar.fillAmount = progress;
            }
            if (_loadingText != null)
            {
                _loadingText.text = $"加载中... {Mathf.RoundToInt(progress * 100)}%";
            }
        }

        public void ShowToast(string message, float duration = 2f)
        {
            if (_toastPrefab == null || _popupContainer == null)
            {
                Debug.LogWarning($"[Toast] {message}");
                return;
            }

            GameObject toast = Instantiate(_toastPrefab, _popupContainer);
            Text textComp = toast.GetComponentInChildren<Text>();
            if (textComp != null) textComp.text = message;

            CanvasGroup cg = toast.GetComponent<CanvasGroup>();
            if (cg == null) cg = toast.AddComponent<CanvasGroup>();
            cg.alpha = 0f;

            StartCoroutine(ShowToastRoutine(toast, cg, duration));
        }

        private IEnumerator<object> ShowToastRoutine(GameObject toast, CanvasGroup cg, float duration)
        {
            yield return cg.DoFade(1f, 0.25f);
            yield return new WaitForSeconds(duration);
            yield return cg.DoFade(0f, 0.25f);
            Destroy(toast);
        }

        public void ShowDialog(string title, string message,
                               string confirmText = "确认", string cancelText = null,
                               Action onConfirm = null, Action onCancel = null)
        {
            if (_dialogPrefab == null || _popupContainer == null)
            {
                Debug.LogWarning($"[Dialog] {title}: {message}");
                onConfirm?.Invoke();
                return;
            }

            GameObject dialog = Instantiate(_dialogPrefab, _popupContainer);
            _popupStack.Push(dialog);

            Text[] texts = dialog.GetComponentsInChildren<Text>();
            Button[] buttons = dialog.GetComponentsInChildren<Button>();

            if (texts.Length >= 1) texts[0].text = title;
            if (texts.Length >= 2) texts[1].text = message;

            if (buttons.Length >= 1)
            {
                int idx = 0;
                Button confirmBtn = buttons[idx++];
                Text confirmBtnText = confirmBtn.GetComponentInChildren<Text>();
                if (confirmBtnText != null) confirmBtnText.text = confirmText;
                confirmBtn.onClick.AddListener(() =>
                {
                    ClosePopup(dialog);
                    onConfirm?.Invoke();
                });

                if (!string.IsNullOrEmpty(cancelText) && buttons.Length >= 2)
                {
                    Button cancelBtn = buttons[idx];
                    Text cancelBtnText = cancelBtn.GetComponentInChildren<Text>();
                    if (cancelBtnText != null) cancelBtnText.text = cancelText;
                    cancelBtn.gameObject.SetActive(true);
                    cancelBtn.onClick.AddListener(() =>
                    {
                        ClosePopup(dialog);
                        onCancel?.Invoke();
                    });
                }
                else if (buttons.Length >= 2)
                {
                    buttons[idx].gameObject.SetActive(false);
                }
            }

            CanvasGroup cg = dialog.GetComponent<CanvasGroup>();
            if (cg == null) cg = dialog.AddComponent<CanvasGroup>();
            cg.alpha = 0f;
            StartCoroutine(cg.DoFade(1f, 0.2f));
        }

        public void ClosePopup(GameObject popup)
        {
            if (_popupStack.Count > 0 && _popupStack.Peek() == popup)
            {
                _popupStack.Pop();
            }
            StartCoroutine(DestroyPopupRoutine(popup));
        }

        private IEnumerator<object> DestroyPopupRoutine(GameObject popup)
        {
            CanvasGroup cg = popup.GetComponent<CanvasGroup>();
            if (cg != null)
            {
                yield return cg.DoFade(0f, 0.2f);
            }
            Destroy(popup);
        }

        public void CloseTopPopup()
        {
            if (_popupStack.Count > 0)
            {
                GameObject top = _popupStack.Pop();
                StartCoroutine(DestroyPopupRoutine(top));
            }
        }

        public void ShowTopBar(bool show)
        {
            if (_topBar != null) _topBar.gameObject.SetActive(show);
        }

        public void ShowBottomBar(bool show)
        {
            if (_bottomBar != null) _bottomBar.gameObject.SetActive(show);
        }

        private void HandleSceneLoadStarted(SceneLoadStartedEvent e)
        {
            ShowLoadingScreen(true, e.SceneName);
            UpdateLoadingProgress(e.Progress);
        }

        private void HandleSceneLoadCompleted(SceneLoadCompletedEvent e)
        {
            ShowLoadingScreen(false);
        }
    }
}
