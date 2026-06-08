using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class GameBootstrap : MonoBehaviour
{
    public Canvas mainCanvas;
    public GameObject panelContainerPrefab;
    public Font defaultFont;

    void Start()
    {
        DontDestroyOnLoad(gameObject);

        GameObject managersObj = new GameObject("Managers");
        managersObj.transform.SetParent(transform);
        managersObj.AddComponent<GameManager>();
        managersObj.AddComponent<TrainingManager>();
        managersObj.AddComponent<MatchManager>();
        managersObj.AddComponent<FinanceManager>();
        managersObj.AddComponent<InjuryManager>();
        managersObj.AddComponent<SaveManager>();
        managersObj.AddComponent<AudioManager>();
        managersObj.AddComponent<DebugLogger>();

        if (mainCanvas == null)
        {
            GameObject canvasObj = new GameObject("MainCanvas");
            mainCanvas = canvasObj.AddComponent<Canvas>();
            mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObj.AddComponent<CanvasScaler>();
            canvasObj.AddComponent<GraphicRaycaster>();
            CanvasScaler scaler = canvasObj.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
        }

        GameObject uiManagerObj = new GameObject("UIManager");
        uiManagerObj.transform.SetParent(mainCanvas.transform, false);
        UIManager uiManager = uiManagerObj.AddComponent<UIManager>();

        GameObject panelContainer = new GameObject("PanelContainer");
        panelContainer.transform.SetParent(mainCanvas.transform, false);
        RectTransform containerRect = panelContainer.AddComponent<RectTransform>();
        containerRect.anchorMin = Vector2.zero;
        containerRect.anchorMax = Vector2.one;
        containerRect.offsetMin = Vector2.zero;
        containerRect.offsetMax = Vector2.zero;
        uiManager.panelContainer = panelContainer.transform;

        CreateAllPanels(uiManager, panelContainer.transform);

        uiManager.ShowPanel("MainMenu");

        DebugLogger.Instance.Log("Bootstrap", "Game initialized successfully");
    }

    void CreateAllPanels(UIManager uiManager, Transform container)
    {
        CreatePanel<MainMenuPanel>(uiManager, container, "MainMenu");
        CreatePanel<TutorialPanel>(uiManager, container, "Tutorial");
        CreatePanel<LevelSelectPanel>(uiManager, container, "LevelSelect");
        CreatePanel<MainGamePanel>(uiManager, container, "MainGame");
        CreatePanel<PlayerDetailPanel>(uiManager, container, "PlayerDetail");
        CreatePanel<SchedulePanel>(uiManager, container, "Schedule");
        CreatePanel<FinancePanel>(uiManager, container, "Finance");
        CreatePanel<ResultPanel>(uiManager, container, "Result");
        CreatePanel<TrainingSetupPanel>(uiManager, container, "TrainingSetup");
        CreatePanel<GameOverPanel>(uiManager, container, "GameOver");
        CreatePanel<SettingsPanel>(uiManager, container, "Settings");
    }

    T CreatePanel<T>(UIManager uiManager, Transform container, string panelName) where T : UIPanel
    {
        GameObject panelObj = new GameObject(panelName);
        panelObj.transform.SetParent(container, false);
        RectTransform rect = panelObj.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
        CanvasGroup cg = panelObj.AddComponent<CanvasGroup>();
        T panel = panelObj.AddComponent<T>();
        panel.canvasGroup = cg;
        panelObj.SetActive(false);
        uiManager.RegisterPanel(panelName, panel);
        return panel;
    }
}
