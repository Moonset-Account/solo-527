using System;
using System.Collections;
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

        public void SetMainCanvas(Canvas canvas)
        {
            _mainCanvas = canvas;
        }

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
                CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
                scaler.matchWidthOrHeight = 0.5f;
                canvasGO.AddComponent<GraphicRaycaster>();
            }

            BuildTopBar();
            BuildBottomBar();
            BuildContentArea();
            BuildPopupContainer();
        }

        private void BuildTopBar()
        {
            if (_topBar != null) return;
            GameObject topGO = new GameObject("TopBar");
            topGO.transform.SetParent(_mainCanvas.transform, false);
            _topBar = topGO.AddComponent<RectTransform>();
            _topBar.anchorMin = new Vector2(0, 1);
            _topBar.anchorMax = new Vector2(1, 1);
            _topBar.pivot = new Vector2(0.5f, 1f);
            _topBar.anchoredPosition = Vector2.zero;
            _topBar.sizeDelta = new Vector2(0, 80);
            Image bg = topGO.AddComponent<Image>();
            bg.color = new Color(0.12f, 0.15f, 0.22f, 0.95f);

            _coinsText = BuildCurrencyItem(_topBar, "\U0001F4B0 ", 0.02f, new Color(1f, 0.85f, 0.3f));
            _gemsText = BuildCurrencyItem(_topBar, "\U0001F48E ", 0.22f, new Color(0.4f, 0.75f, 1f));
            _starsText = BuildCurrencyItem(_topBar, "\u2B50 ", 0.42f, new Color(1f, 0.9f, 0.4f));
        }

        private Text BuildCurrencyItem(RectTransform parent, string icon, float anchorXMin, Color color)
        {
            GameObject go = new GameObject("Currency_" + icon.Trim());
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(anchorXMin, 0f);
            rt.anchorMax = new Vector2(anchorXMin + 0.18f, 1f);
            rt.offsetMin = new Vector2(10, 10);
            rt.offsetMax = new Vector2(-10, -10);

            Text t = go.AddComponent<Text>();
            t.text = icon + "0";
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.fontSize = 26;
            t.fontStyle = FontStyle.Bold;
            t.color = color;
            t.alignment = TextAnchor.MiddleLeft;
            return t;
        }

        private void BuildBottomBar()
        {
            if (_bottomBar != null) return;
            GameObject botGO = new GameObject("BottomBar");
            botGO.transform.SetParent(_mainCanvas.transform, false);
            _bottomBar = botGO.AddComponent<RectTransform>();
            _bottomBar.anchorMin = Vector2.zero;
            _bottomBar.anchorMax = new Vector2(1, 0);
            _bottomBar.pivot = new Vector2(0.5f, 0f);
            _bottomBar.anchoredPosition = Vector2.zero;
            _bottomBar.sizeDelta = new Vector2(0, 0);
            botGO.SetActive(false);
        }

        private void BuildContentArea()
        {
            if (_contentArea != null) return;
            GameObject contentGO = new GameObject("ContentArea");
            contentGO.transform.SetParent(_mainCanvas.transform, false);
            _contentArea = contentGO.AddComponent<RectTransform>();
            _contentArea.anchorMin = Vector2.zero;
            _contentArea.anchorMax = Vector2.one;
            _contentArea.offsetMin = Vector2.zero;
            _contentArea.offsetMax = Vector2.zero;
        }

        private void BuildPopupContainer()
        {
            if (_popupContainer != null) return;
            GameObject popupGO = new GameObject("PopupContainer");
            popupGO.transform.SetParent(_mainCanvas.transform, false);
            _popupContainer = popupGO.AddComponent<RectTransform>();
            _popupContainer.anchorMin = Vector2.zero;
            _popupContainer.anchorMax = Vector2.one;
            _popupContainer.offsetMin = Vector2.zero;
            _popupContainer.offsetMax = Vector2.zero;
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
            if (_popupContainer == null) BuildPopupContainer();

            GameObject toast;
            if (_toastPrefab != null)
            {
                toast = Instantiate(_toastPrefab, _popupContainer);
            }
            else
            {
                toast = BuildToastGameObject(message);
                toast.transform.SetParent(_popupContainer, false);
            }

            Text textComp = toast.GetComponentInChildren<Text>();
            if (textComp != null && _toastPrefab != null) textComp.text = message;

            CanvasGroup cg = toast.GetComponent<CanvasGroup>();
            if (cg == null) cg = toast.AddComponent<CanvasGroup>();
            cg.alpha = 0f;

            StartCoroutine(ShowToastRoutine(toast, cg, duration));
        }

        private GameObject BuildToastGameObject(string message)
        {
            GameObject toast = new GameObject("Toast");
            RectTransform rt = toast.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.15f);
            rt.anchorMax = new Vector2(0.5f, 0.15f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(800, 80);
            Image bg = toast.AddComponent<Image>();
            bg.color = new Color(0f, 0f, 0f, 0.85f);
            bg.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            bg.type = Image.Type.Sliced;

            GameObject textGO = new GameObject("Text");
            textGO.transform.SetParent(toast.transform, false);
            Text t = textGO.AddComponent<Text>();
            t.text = message;
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.fontSize = 28;
            t.color = Color.white;
            t.alignment = TextAnchor.MiddleCenter;
            RectTransform trt = textGO.GetComponent<RectTransform>();
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.offsetMin = Vector2.zero;
            trt.offsetMax = Vector2.zero;
            return toast;
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
            if (_popupContainer == null) BuildPopupContainer();

            GameObject dialog;
            if (_dialogPrefab != null)
            {
                dialog = Instantiate(_dialogPrefab, _popupContainer);
                Text[] texts = dialog.GetComponentsInChildren<Text>();
                Button[] buttons = dialog.GetComponentsInChildren<Button>();
                if (texts.Length >= 1) texts[0].text = title;
                if (texts.Length >= 2) texts[1].text = message;
                SetupDialogButtons(dialog, buttons, confirmText, cancelText, onConfirm, onCancel);
            }
            else
            {
                dialog = BuildDialogGameObject(title, message, confirmText, cancelText, onConfirm, onCancel);
                dialog.transform.SetParent(_popupContainer, false);
            }

            _popupStack.Push(dialog);
            CanvasGroup cg = dialog.GetComponent<CanvasGroup>();
            if (cg == null) cg = dialog.AddComponent<CanvasGroup>();
            cg.alpha = 0f;
            StartCoroutine(cg.DoFade(1f, 0.2f));
        }

        private void SetupDialogButtons(GameObject dialog, Button[] buttons,
                                        string confirmText, string cancelText,
                                        Action onConfirm, Action onCancel)
        {
            if (buttons.Length < 1) return;
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

        private GameObject BuildDialogGameObject(string title, string message,
                                                 string confirmText, string cancelText,
                                                 Action onConfirm, Action onCancel)
        {
            GameObject dialog = new GameObject("Dialog");
            RectTransform rt = dialog.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(900, 520);

            GameObject blockGO = new GameObject("Blocker");
            blockGO.transform.SetParent(dialog.transform, false);
            RectTransform brt = blockGO.AddComponent<RectTransform>();
            brt.anchorMin = new Vector2(-10f, -10f);
            brt.anchorMax = new Vector2(11f, 11f);
            brt.offsetMin = Vector2.zero;
            brt.offsetMax = Vector2.zero;
            Image bimg = blockGO.AddComponent<Image>();
            bimg.color = new Color(0f, 0f, 0f, 0.55f);
            Button bbtn = blockGO.AddComponent<Button>();
            bbtn.transition = Selectable.Transition.None;
            ColorBlock bcb = bbtn.colors;
            bcb.normalColor = bcb.highlightedColor = bcb.pressedColor = bcb.selectedColor = Color.clear;
            bbtn.colors = bcb;
            if (!string.IsNullOrEmpty(cancelText))
            {
                bbtn.onClick.AddListener(() =>
                {
                    ClosePopup(dialog);
                    onCancel?.Invoke();
                });
            }

            GameObject panelGO = new GameObject("Panel");
            panelGO.transform.SetParent(dialog.transform, false);
            RectTransform prt = panelGO.AddComponent<RectTransform>();
            prt.anchorMin = Vector2.zero;
            prt.anchorMax = Vector2.one;
            prt.offsetMin = Vector2.zero;
            prt.offsetMax = Vector2.zero;
            Image pimg = panelGO.AddComponent<Image>();
            pimg.color = new Color(1f, 0.98f, 0.95f);
            pimg.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            pimg.type = Image.Type.Sliced;

            GameObject titleGO = new GameObject("Title");
            titleGO.transform.SetParent(panelGO.transform, false);
            RectTransform titleRT = titleGO.AddComponent<RectTransform>();
            titleRT.anchorMin = new Vector2(0, 1);
            titleRT.anchorMax = new Vector2(1, 1);
            titleRT.pivot = new Vector2(0.5f, 1f);
            titleRT.anchoredPosition = new Vector2(0, 0);
            titleRT.sizeDelta = new Vector2(0, 90);
            Text titleT = titleGO.AddComponent<Text>();
            titleT.text = title;
            titleT.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleT.fontSize = 42;
            titleT.fontStyle = FontStyle.Bold;
            titleT.alignment = TextAnchor.MiddleCenter;
            titleT.color = new Color(0.15f, 0.12f, 0.1f);
            titleT.horizontalOverflow = HorizontalWrapMode.Overflow;
            titleT.verticalOverflow = VerticalWrapMode.Overflow;

            GameObject msgGO = new GameObject("Message");
            msgGO.transform.SetParent(panelGO.transform, false);
            RectTransform msgRT = msgGO.AddComponent<RectTransform>();
            msgRT.anchorMin = new Vector2(0.05f, 0.25f);
            msgRT.anchorMax = new Vector2(0.95f, 0.85f);
            msgRT.offsetMin = Vector2.zero;
            msgRT.offsetMax = Vector2.zero;
            Text msgT = msgGO.AddComponent<Text>();
            msgT.text = message;
            msgT.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            msgT.fontSize = 30;
            msgT.alignment = TextAnchor.MiddleCenter;
            msgT.color = new Color(0.2f, 0.18f, 0.15f);
            msgT.horizontalOverflow = HorizontalWrapMode.Wrap;
            msgT.verticalOverflow = VerticalWrapMode.Truncate;

            BuildDialogButton(panelGO, "ConfirmBtn", confirmText,
                new Vector2(0.18f, 0.05f), new Vector2(0.48f, 0.22f),
                new Color(0.25f, 0.65f, 0.35f),
                () => { ClosePopup(dialog); onConfirm?.Invoke(); });

            if (!string.IsNullOrEmpty(cancelText))
            {
                BuildDialogButton(panelGO, "CancelBtn", cancelText,
                    new Vector2(0.52f, 0.05f), new Vector2(0.82f, 0.22f),
                    new Color(0.6f, 0.6f, 0.65f),
                    () => { ClosePopup(dialog); onCancel?.Invoke(); });
            }

            return dialog;
        }

        private void BuildDialogButton(Transform parent, string name, string text,
                                       Vector2 anchorMin, Vector2 anchorMax,
                                       Color color, Action onClick)
        {
            GameObject btnGO = new GameObject(name);
            btnGO.transform.SetParent(parent, false);
            RectTransform rt = btnGO.AddComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            Image img = btnGO.AddComponent<Image>();
            img.color = color;
            img.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            img.type = Image.Type.Sliced;
            Button btn = btnGO.AddComponent<Button>();
            ColorBlock cb = btn.colors;
            cb.normalColor = color;
            cb.highlightedColor = color * 1.1f;
            cb.pressedColor = color * 0.8f;
            btn.colors = cb;
            btn.onClick.AddListener(() => onClick?.Invoke());

            GameObject textGO = new GameObject("Text");
            textGO.transform.SetParent(btnGO.transform, false);
            Text t = textGO.AddComponent<Text>();
            t.text = text;
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.fontSize = 30;
            t.fontStyle = FontStyle.Bold;
            t.color = Color.white;
            t.alignment = TextAnchor.MiddleCenter;
            RectTransform trt = textGO.GetComponent<RectTransform>();
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.offsetMin = Vector2.zero;
            trt.offsetMax = Vector2.zero;
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
