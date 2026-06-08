using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public abstract class IPanel : MonoBehaviour
    {
        public abstract void Setup(Transform parent);
        public abstract void Show();
        public abstract void Hide();
        public bool IsVisible { get; protected set; }
        protected GameObject _panelObject;
    }

    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        private Dictionary<Type, IPanel> _panels = new Dictionary<Type, IPanel>();
        private IPanel _currentPanel;
        private Canvas _canvas;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void Initialize()
        {
            CreateCanvas();
            CreateEventSystem();

            AddPanel<MainMenuPanel>();
            AddPanel<TutorialPanel>();
            AddPanel<PlanningPanel>();
            AddPanel<HUDPanel>();
            AddPanel<PauseMenuPanel>();
            AddPanel<ResultPanel>();
            AddPanel<SettingsPanel>();
            AddPanel<EncyclopediaPanel>();

            GameManager.Instance.OnStateChanged += OnGameStateChanged;

            ShowPanel<MainMenuPanel>();
        }

        private void CreateCanvas()
        {
            GameObject canvasObj = new GameObject("Canvas");
            canvasObj.transform.SetParent(transform);

            _canvas = canvasObj.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            canvasObj.AddComponent<GraphicRaycaster>();
        }

        private void CreateEventSystem()
        {
            GameObject eventSystemObj = new GameObject("EventSystem");
            eventSystemObj.transform.SetParent(transform);
            eventSystemObj.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemObj.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }

        private void AddPanel<T>() where T : IPanel
        {
            T panel = new GameObject(typeof(T).Name).AddComponent<T>();
            panel.transform.SetParent(transform);
            panel.Setup(_canvas.transform);
            panel.Hide();
            _panels[typeof(T)] = panel;
        }

        public void ShowPanel<T>() where T : IPanel
        {
            Type type = typeof(T);
            if (!_panels.ContainsKey(type)) return;

            if (_currentPanel != null && _currentPanel.IsVisible)
            {
                _currentPanel.Hide();
            }

            _panels[type].Show();
            _currentPanel = _panels[type];
        }

        public void HideAll()
        {
            foreach (var panel in _panels.Values)
            {
                panel.Hide();
            }
            _currentPanel = null;
        }

        public T GetPanel<T>() where T : IPanel
        {
            Type type = typeof(T);
            if (_panels.ContainsKey(type))
            {
                return (T)_panels[type];
            }
            return null;
        }

        public void UpdateHUD()
        {
            if (_currentPanel != null && _currentPanel.IsVisible && _currentPanel is HUDPanel hudPanel)
            {
                hudPanel.UpdateDisplay();
            }
        }

        private void OnGameStateChanged(GameState previousState, GameState newState)
        {
            switch (newState)
            {
                case GameState.MainMenu:
                    ShowPanel<MainMenuPanel>();
                    break;
                case GameState.Tutorial:
                    ShowPanel<TutorialPanel>();
                    break;
                case GameState.Planning:
                    ShowPanel<PlanningPanel>();
                    break;
                case GameState.Sailing:
                    ShowPanel<HUDPanel>();
                    break;
                case GameState.Paused:
                    ShowPanel<PauseMenuPanel>();
                    break;
                case GameState.Settings:
                    ShowPanel<SettingsPanel>();
                    break;
                case GameState.Result:
                    ShowPanel<ResultPanel>();
                    break;
                case GameState.Encyclopedia:
                    ShowPanel<EncyclopediaPanel>();
                    break;
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged -= OnGameStateChanged;
            }
        }
    }
}
