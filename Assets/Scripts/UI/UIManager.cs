using UnityEngine;
using System;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public enum UIType
    {
        None = 0,
        MainMenu,
        HUD,
        PauseMenu,
        SettingsMenu,
        Tutorial,
        LevelSelect,
        Victory,
        Defeat,
        Gallery,
        Achievements,
        Leaderboard,
        DailyChallenge,
        Result,
        RoutePlanner,
        PhotoPreview,
        Loading
    }

    public class UIManager : PersistentSingleton<UIManager>
    {
        [SerializeField] private RectTransform uiRoot;
        [SerializeField] private Canvas mainCanvas;
        [SerializeField] private Dictionary<UIType, UIPanelBase> registeredPanels =
            new Dictionary<UIType, UIPanelBase>();
        [SerializeField] private Stack<UIType> panelStack = new Stack<UIType>();

        public event Action<UIType> OnPanelOpened;
        public event Action<UIType> OnPanelClosed;

        public RectTransform UIRoot => uiRoot;
        public Canvas MainCanvas => mainCanvas;
        public int OpenPanelsCount => panelStack.Count;

        protected override void Awake()
        {
            base.Awake();
            EnsureUIRoot();
        }

        private void EnsureUIRoot()
        {
            if (uiRoot == null)
            {
                var canvasGO = new GameObject("UICanvas");
                mainCanvas = canvasGO.AddComponent<Canvas>();
                mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
                mainCanvas.sortingOrder = 100;

                var scaler = canvasGO.AddComponent<UnityEngine.UI.CanvasScaler>();
                scaler.uiScaleMode = UnityEngine.UI.CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
                scaler.matchWidthOrHeight = 0.5f;

                canvasGO.AddComponent<UnityEngine.UI.GraphicRaycaster>();

                uiRoot = canvasGO.GetComponent<RectTransform>();
                DontDestroyOnLoad(canvasGO);
            }
        }

        public void RegisterPanel(UIType type, UIPanelBase panel)
        {
            if (!registeredPanels.ContainsKey(type))
            {
                registeredPanels[type] = panel;
            }
        }

        public void UnregisterPanel(UIType type)
        {
            if (registeredPanels.ContainsKey(type))
            {
                registeredPanels.Remove(type);
            }
        }

        public T OpenPanel<T>(UIType type, bool closePrevious = false) where T : UIPanelBase
        {
            if (closePrevious && panelStack.Count > 0)
            {
                CloseCurrentPanel();
            }

            if (registeredPanels.TryGetValue(type, out var existingPanel))
            {
                existingPanel.Open();
                panelStack.Push(type);
                OnPanelOpened?.Invoke(type);
                PlayPanelOpenSound();
                return existingPanel as T;
            }

            return null;
        }

        public void OpenPanel(UIType type, bool closePrevious = false)
        {
            OpenPanel<UIPanelBase>(type, closePrevious);
        }

        public void ClosePanel(UIType type)
        {
            if (registeredPanels.TryGetValue(type, out var panel))
            {
                panel.Close();
                if (panelStack.Count > 0 && panelStack.Peek() == type)
                {
                    panelStack.Pop();
                }
                OnPanelClosed?.Invoke(type);
                PlayPanelCloseSound();
            }
        }

        public void CloseCurrentPanel()
        {
            if (panelStack.Count > 0)
            {
                ClosePanel(panelStack.Peek());
            }
        }

        public void CloseAllPanels()
        {
            while (panelStack.Count > 0)
            {
                var type = panelStack.Pop();
                if (registeredPanels.TryGetValue(type, out var panel))
                {
                    panel.Close();
                    OnPanelClosed?.Invoke(type);
                }
            }
        }

        public T GetPanel<T>(UIType type) where T : UIPanelBase
        {
            if (registeredPanels.TryGetValue(type, out var panel))
            {
                return panel as T;
            }
            return null;
        }

        public bool IsPanelOpen(UIType type)
        {
            if (registeredPanels.TryGetValue(type, out var panel))
            {
                return panel.IsOpen;
            }
            return false;
        }

        public void TogglePanel(UIType type)
        {
            if (IsPanelOpen(type))
            {
                ClosePanel(type);
            }
            else
            {
                OpenPanel(type);
            }
        }

        public void ReturnToPreviousPanel()
        {
            if (panelStack.Count > 1)
            {
                CloseCurrentPanel();
            }
        }

        private void PlayPanelOpenSound()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
        }

        private void PlayPanelCloseSound()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick, 0.8f);
        }

        public void ShowNotification(string message, float duration = 2f)
        {
            EventBus.Trigger(new UINotificationEvent(message, duration));
        }

        public void ShowConfirmation(string title, string message, Action onConfirm, Action onCancel = null)
        {
            EventBus.Trigger(new UIConfirmationEvent(title, message, onConfirm, onCancel));
        }
    }

    public abstract class UIPanelBase : MonoBehaviour
    {
        [SerializeField] protected UIType panelType;
        [SerializeField] protected bool isOpen;
        [SerializeField] protected GameObject panelContent;
        [SerializeField] protected Animator panelAnimator;

        public UIType PanelType => panelType;
        public bool IsOpen => isOpen;

        public virtual void Open()
        {
            isOpen = true;
            if (panelContent != null) panelContent.SetActive(true);
            if (panelAnimator != null) panelAnimator.SetTrigger("Open");
            OnOpened();
        }

        public virtual void Close()
        {
            isOpen = false;
            if (panelAnimator != null)
            {
                panelAnimator.SetTrigger("Close");
                StartCoroutine(DeactivateAfterAnimation());
            }
            else if (panelContent != null)
            {
                panelContent.SetActive(false);
            }
            OnClosed();
        }

        private System.Collections.IEnumerator DeactivateAfterAnimation()
        {
            yield return new WaitForSeconds(0.3f);
            if (panelContent != null) panelContent.SetActive(false);
        }

        protected virtual void OnOpened() { }
        protected virtual void OnClosed() { }
    }

    public struct UINotificationEvent : IEvent
    {
        public readonly string Message;
        public readonly float Duration;

        public UINotificationEvent(string message, float duration)
        {
            Message = message;
            Duration = duration;
        }
    }

    public struct UIConfirmationEvent : IEvent
    {
        public readonly string Title;
        public readonly string Message;
        public readonly Action OnConfirm;
        public readonly Action OnCancel;

        public UIConfirmationEvent(string title, string message, Action onConfirm, Action onCancel)
        {
            Title = title;
            Message = message;
            OnConfirm = onConfirm;
            OnCancel = onCancel;
        }
    }
}
