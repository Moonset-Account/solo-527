using System;
using System.Collections.Generic;
using UnityEngine;
using SpaceCourier.Core;

namespace SpaceCourier.UI
{
    public class UIManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.UIManager;

        [Header("Root Canvas")]
        public Canvas rootCanvas;
        public CanvasScaler scaler;

        [Header("Panel References")]
        public UIPanelBase mainMenuPanel;
        public UIPanelBase hudPanel;
        public UIPanelBase contractPanel;
        public UIPanelBase eventCardPanel;
        public UIPanelBase resultPanel;
        public UIPanelBase settingsPanel;
        public UIPanelBase pausePanel;
        public UIPanelBase loadingPanel;

        private Dictionary<string, UIPanelBase> panelRegistry = new Dictionary<string, UIPanelBase>();
        private Stack<UIPanelBase> panelHistory = new Stack<UIPanelBase>();
        private UIPanelBase currentTopPanel;

        public event Action<string> OnPanelOpened;
        public event Action<string> OnPanelClosed;

        public UIPanelBase CurrentTopPanel => currentTopPanel;

        public void Initialize()
        {
            if (rootCanvas == null)
            {
                var canvasObj = new GameObject("UICanvas");
                rootCanvas = canvasObj.AddComponent<Canvas>();
                rootCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
                rootCanvas.sortingOrder = 100;
                scaler = canvasObj.AddComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
                canvasObj.AddComponent<GraphicRaycaster>();
            }

            RegisterAllPanels();
            Debug.Log("[UIManager] Initialized.");
        }

        private void RegisterAllPanels()
        {
            if (mainMenuPanel != null) RegisterPanel("MainMenu", mainMenuPanel);
            if (hudPanel != null) RegisterPanel("HUD", hudPanel);
            if (contractPanel != null) RegisterPanel("Contract", contractPanel);
            if (eventCardPanel != null) RegisterPanel("EventCard", eventCardPanel);
            if (resultPanel != null) RegisterPanel("Result", resultPanel);
            if (settingsPanel != null) RegisterPanel("Settings", settingsPanel);
            if (pausePanel != null) RegisterPanel("Pause", pausePanel);
            if (loadingPanel != null) RegisterPanel("Loading", loadingPanel);
        }

        public void RegisterPanel(string panelName, UIPanelBase panel)
        {
            if (!panelRegistry.ContainsKey(panelName))
            {
                panelRegistry[panelName] = panel;
            }
            if (panel != null)
            {
                panel.gameObject.SetActive(false);
            }
        }

        public T GetPanel<T>(string panelName) where T : UIPanelBase
        {
            if (panelRegistry.TryGetValue(panelName, out var panel))
            {
                return panel as T;
            }
            return null;
        }

        public void OpenPanel(string panelName, bool addToHistory = true)
        {
            if (!panelRegistry.TryGetValue(panelName, out var panel))
            {
                Debug.LogWarning($"[UIManager] Panel not found: {panelName}");
                return;
            }

            OpenPanelInternal(panel, panelName, addToHistory);
        }

        public void OpenPanel(UIPanelBase panel, string panelName, bool addToHistory = true)
        {
            if (panel == null) return;

            if (!panelRegistry.ContainsKey(panelName))
            {
                panelRegistry[panelName] = panel;
            }

            OpenPanelInternal(panel, panelName, addToHistory);
        }

        private void OpenPanelInternal(UIPanelBase panel, string panelName, bool addToHistory)
        {
            if (currentTopPanel != null && panel.CloseOnPanelOpened)
            {
                currentTopPanel.ClosePanel();
            }

            if (addToHistory && currentTopPanel != null)
            {
                panelHistory.Push(currentTopPanel);
            }

            panel.OpenPanel();
            currentTopPanel = panel;

            OnPanelOpened?.Invoke(panelName);
            EventBus.Publish(new GameEvents.UIPanelOpened { PanelName = panelName });
            Debug.Log($"[UIManager] Opened panel: {panelName}");
        }

        public void ClosePanel(string panelName)
        {
            if (!panelRegistry.TryGetValue(panelName, out var panel)) return;
            ClosePanelInternal(panel, panelName);
        }

        public void CloseTopPanel()
        {
            if (currentTopPanel == null) return;
            string panelName = FindPanelName(currentTopPanel);
            ClosePanelInternal(currentTopPanel, panelName);

            if (panelHistory.Count > 0)
            {
                var previous = panelHistory.Pop();
                previous.OpenPanel();
                currentTopPanel = previous;
            }
        }

        private void ClosePanelInternal(UIPanelBase panel, string panelName)
        {
            if (panel == null) return;
            panel.ClosePanel();

            if (currentTopPanel == panel)
            {
                currentTopPanel = null;
            }

            OnPanelClosed?.Invoke(panelName);
            EventBus.Publish(new GameEvents.UIPanelClosed { PanelName = panelName });
            Debug.Log($"[UIManager] Closed panel: {panelName}");
        }

        private string FindPanelName(UIPanelBase panel)
        {
            foreach (var kvp in panelRegistry)
            {
                if (kvp.Value == panel) return kvp.Key;
            }
            return "Unknown";
        }

        public void CloseAllPanels()
        {
            foreach (var kvp in panelRegistry)
            {
                kvp.Value?.ClosePanel();
            }
            panelHistory.Clear();
            currentTopPanel = null;
        }

        public void ShowLoadingScreen(string message = "加载中...")
        {
            OpenPanel("Loading", false);
        }

        public void HideLoadingScreen()
        {
            ClosePanel("Loading");
        }

        public void ShowMainMenu()
        {
            CloseAllPanels();
            OpenPanel("MainMenu", false);
        }

        public void ShowHUD()
        {
            CloseAllPanels();
            OpenPanel("HUD", false);
        }

        public void ToggleSettings()
        {
            if (currentTopPanel != null && FindPanelName(currentTopPanel) == "Settings")
            {
                CloseTopPanel();
            }
            else
            {
                OpenPanel("Settings");
            }
        }

        public void ShowNotification(string message, bool isSuccess = true, float duration = 2f)
        {
            if (notificationToast != null)
            {
                notificationToast.Show(message, isSuccess, duration);
            }
        }

        [Header("Notification")]
        public NotificationToast notificationToast;

        public void Shutdown()
        {
            CloseAllPanels();
            panelRegistry.Clear();
            panelHistory.Clear();
            Debug.Log("[UIManager] Shutdown.");
        }
    }
}
