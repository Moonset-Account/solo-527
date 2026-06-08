using System;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;

namespace DecorMatch3.UI
{
    public enum UIView
    {
        None,
        MainMenu,
        Tutorial,
        Match3HUD,
        PauseMenu,
        Settings,
        LevelComplete,
        LevelFailed,
        DecorationHUD,
        FurniturePanel,
        ColorPanel,
        CustomerReview,
        LoadingScreen,
        LevelSelect,
        MaterialInventory
    }

    public class UIManager : Singleton<UIManager>
    {
        [Header("UI Views")]
        [SerializeField] private List<UIViewBase> registeredViews = new List<UIViewBase>();

        [Header("HUD")]
        [SerializeField] private GameObject hudContainer;

        private Dictionary<UIView, UIViewBase> _viewMap = new Dictionary<UIView, UIViewBase>();
        private Stack<UIView> _viewHistory = new Stack<UIView>();
        private UIView _currentView = UIView.None;

        public UIView CurrentView => _currentView;
        public bool IsViewOpen(UIView view) => _viewMap.TryGetValue(view, out UIViewBase v) && v.IsOpen;

        public event Action<UIView> OnViewOpened;
        public event Action<UIView> OnViewClosed;

        protected override void Awake()
        {
            base.Awake();
            InitializeViews();
        }

        private void InitializeViews()
        {
            foreach (var view in registeredViews)
            {
                if (view != null)
                {
                    _viewMap[view.ViewType] = view;
                    view.Initialize();
                    if (view.IsOpen)
                    {
                        view.Close(false);
                    }
                }
            }
        }

        public void RegisterView(UIViewBase view)
        {
            if (view == null || _viewMap.ContainsKey(view.ViewType)) return;

            _viewMap[view.ViewType] = view;
            view.Initialize();
        }

        public void UnregisterView(UIView viewType)
        {
            if (_viewMap.ContainsKey(viewType))
            {
                _viewMap.Remove(viewType);
            }
        }

        public T GetView<T>(UIView viewType) where T : UIViewBase
        {
            if (_viewMap.TryGetValue(viewType, out UIViewBase view))
            {
                return view as T;
            }
            return null;
        }

        public void OpenView(UIView viewType, bool addToHistory = true, bool closeOthers = true)
        {
            if (_currentView == viewType) return;

            if (!_viewMap.TryGetValue(viewType, out UIViewBase view))
            {
                Debug.LogWarning($"[UIManager] View {viewType} not registered!");
                return;
            }

            if (closeOthers && _currentView != UIView.None)
            {
                if (addToHistory)
                {
                    _viewHistory.Push(_currentView);
                }
                CloseView(_currentView, false);
            }

            _currentView = viewType;
            view.Open();

            OnViewOpened?.Invoke(viewType);
            EventBus.Publish(new UIViewOpenedEvent { ViewType = viewType });
        }

        public void CloseView(UIView viewType, bool animate = true)
        {
            if (!_viewMap.TryGetValue(viewType, out UIViewBase view)) return;

            if (view.IsOpen)
            {
                view.Close(animate);

                if (_currentView == viewType)
                {
                    _currentView = UIView.None;
                }

                OnViewClosed?.Invoke(viewType);
                EventBus.Publish(new UIViewClosedEvent { ViewType = viewType });
            }
        }

        public void CloseCurrentView()
        {
            if (_currentView != UIView.None)
            {
                CloseView(_currentView);
            }
        }

        public void GoBack()
        {
            if (_viewHistory.Count > 0)
            {
                UIView previousView = _viewHistory.Pop();
                CloseView(_currentView, true);
                OpenView(previousView, false, true);
            }
            else if (_currentView != UIView.None)
            {
                CloseView(_currentView);
            }
        }

        public void ClearHistory()
        {
            _viewHistory.Clear();
        }

        public void ShowHUD(bool show)
        {
            if (hudContainer != null)
            {
                hudContainer.SetActive(show);
            }
        }

        public void CloseAllViews()
        {
            foreach (var kvp in _viewMap)
            {
                if (kvp.Value.IsOpen)
                {
                    kvp.Value.Close(false);
                }
            }

            _currentView = UIView.None;
            _viewHistory.Clear();
        }
    }

    public struct UIViewOpenedEvent
    {
        public UIView ViewType;
    }

    public struct UIViewClosedEvent
    {
        public UIView ViewType;
    }
}
