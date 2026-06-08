using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.InputSystem;
using YouthTrainingManagement.Systems;

namespace YouthTrainingManagement.UI
{
    public class UIManager : MonoBehaviour
    {
        private GameManager _gameManager;

        private readonly Dictionary<UIScreen, UIScreenBase> _screens = new Dictionary<UIScreen, UIScreenBase>();
        private readonly Stack<UIScreen> _screenStack = new Stack<UIScreen>();

        private UIScreen _currentScreen = UIScreen.None;
        private Canvas _mainCanvas;

        public event Action<UIScreen> OnScreenShown;
        public event Action<UIScreen> OnScreenHidden;

        public void Initialize(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
            CreateCanvasHierarchy();
            InitializeAllScreens();
            Debug.Log("UIManager initialized.");
        }

        public void Initialize(GameManager gameManager, Transform parent)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
            if (parent != null)
            {
                _mainCanvas = parent.GetComponent<Canvas>();
                if (_mainCanvas == null)
                {
                    CreateCanvasHierarchy();
                }
                else
                {
                    if (_mainCanvas.GetComponent<GraphicRaycaster>() == null)
                        _mainCanvas.gameObject.AddComponent<GraphicRaycaster>();
                    transform.SetParent(parent, false);

                    if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
                    {
                        var esGO = new GameObject("EventSystem");
                        esGO.transform.SetParent(transform, false);
                        esGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
                        esGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
                    }
                }
            }
            else
            {
                CreateCanvasHierarchy();
            }
            InitializeAllScreens();
            Debug.Log("UIManager initialized with external canvas.");
        }

        private void CreateCanvasHierarchy()
        {
            var canvasGO = new GameObject("MainCanvas");
            canvasGO.transform.SetParent(transform, false);
            _mainCanvas = canvasGO.AddComponent<Canvas>();
            _mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _mainCanvas.sortingOrder = 100;

            var scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            canvasGO.AddComponent<GraphicRaycaster>();

            if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                var esGO = new GameObject("EventSystem");
                esGO.transform.SetParent(transform, false);
                esGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
                esGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }
        }

        private void InitializeAllScreens()
        {
            RegisterScreen(UIScreen.Dashboard, gameObject.AddComponent<DashboardScreen>());
            RegisterScreen(UIScreen.Training, gameObject.AddComponent<TrainingScreen>());
            RegisterScreen(UIScreen.Match, gameObject.AddComponent<MatchScreen>());
            RegisterScreen(UIScreen.Recovery, gameObject.AddComponent<RecoveryScreen>());
            RegisterScreen(UIScreen.Squad, gameObject.AddComponent<SquadScreen>());
            RegisterScreen(UIScreen.Fixtures, gameObject.AddComponent<FixturesScreen>());
            RegisterScreen(UIScreen.Finance, gameObject.AddComponent<FinanceScreen>());
            RegisterScreen(UIScreen.Tutorial, gameObject.AddComponent<TutorialScreen>());
            RegisterScreen(UIScreen.Settings, gameObject.AddComponent<SettingsScreen>());
            RegisterScreen(UIScreen.Pause, gameObject.AddComponent<PauseScreen>());
            RegisterScreen(UIScreen.Result, gameObject.AddComponent<ResultScreen>());

            foreach (var kvp in _screens)
            {
                kvp.Value.Initialize(_gameManager, _mainCanvas.transform);
                kvp.Value.Hide();
            }
        }

        private void RegisterScreen(UIScreen id, UIScreenBase screen)
        {
            screen.ScreenId = id;
            _screens[id] = screen;
        }

        public void ShowScreen(UIScreen screenId)
        {
            if (_currentScreen != UIScreen.None && _currentScreen != screenId)
            {
                HideScreen(_currentScreen);
            }

            if (_screens.TryGetValue(screenId, out var screen))
            {
                screen.Show();
                _currentScreen = screenId;
                _screenStack.Push(screenId);
                OnScreenShown?.Invoke(screenId);
                _gameManager.AudioManager?.PlaySound(YouthTrainingManagement.Audio.SoundType.MenuOpen);
            }
            else
            {
                Debug.LogWarning($"Screen {screenId} not registered.");
            }
        }

        public void HideScreen(UIScreen screenId)
        {
            if (_screens.TryGetValue(screenId, out var screen))
            {
                screen.Hide();
                if (_currentScreen == screenId)
                    _currentScreen = UIScreen.None;
                OnScreenHidden?.Invoke(screenId);
                _gameManager.AudioManager?.PlaySound(YouthTrainingManagement.Audio.SoundType.MenuClose);
            }
        }

        public void GoBack()
        {
            if (_screenStack.Count > 1)
            {
                var current = _screenStack.Pop();
                HideScreen(current);
                var previous = _screenStack.Peek();
                ShowScreen(previous);
            }
        }

        public T GetScreen<T>(UIScreen screenId) where T : UIScreenBase
        {
            return _screens.TryGetValue(screenId, out var s) ? s as T : null;
        }

        public void UpdateTimeDisplay()
        {
            foreach (var screen in _screens.Values)
            {
                screen.UpdateTimeDisplay();
            }
        }

        public void RefreshAllData()
        {
            foreach (var screen in _screens.Values)
            {
                screen.RefreshData();
            }
        }

        public void ShowTutorialStep(Config.TutorialStep step, int currentIndex, int totalSteps)
        {
            var tutorial = GetScreen<TutorialScreen>(UIScreen.Tutorial);
            tutorial?.SetStepData(step, currentIndex, totalSteps);
        }

        public void PlayPulseAnimation(string elementId)
        {
            foreach (var screen in _screens.Values)
                screen.PlayPulse(elementId);
        }

        public void PlayHighlightAnimation(string elementId)
        {
            foreach (var screen in _screens.Values)
                screen.PlayHighlight(elementId);
        }

        private void Update()
        {
            _gameManager.InputManager?.Update();
        }
    }

    public abstract class UIScreenBase : MonoBehaviour
    {
        public UIScreen ScreenId { get; set; }
        protected GameManager GameManager;
        protected Transform ParentTransform;
        protected GameObject ScreenRoot;

        public virtual void Initialize(GameManager gm, Transform parent)
        {
            GameManager = gm;
            ParentTransform = parent;
            CreateUI();
        }

        protected abstract void CreateUI();
        public virtual void Show() { if (ScreenRoot != null) ScreenRoot.SetActive(true); RefreshData(); }
        public virtual void Hide() { if (ScreenRoot != null) ScreenRoot.SetActive(false); }
        public virtual void RefreshData() { }
        public virtual void UpdateTimeDisplay() { }
        public virtual void PlayPulse(string elementId) { }
        public virtual void PlayHighlight(string elementId) { }
    }
}
