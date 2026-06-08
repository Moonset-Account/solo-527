using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class GameOrchestrator : MonoBehaviour
{
    private Canvas canvas;
    private GameObject currentPanel;
    private Dictionary<GameState, GameObject> allPanels = new Dictionary<GameState, GameObject>();

    private TextMeshProUGUI hudScoreText;
    private TextMeshProUGUI hudTimerText;
    private TextMeshProUGUI hudComboText;
    private TextMeshProUGUI hudCleanHintText;
    private Transform hudOrderContainer;

    private TextMeshProUGUI failReasonText;
    private TextMeshProUGUI settleScoreText;
    private TextMeshProUGUI settleStatsText;
    private TextMeshProUGUI settleLevelText;
    private List<Image> settleStarImages = new List<Image>();

    private List<Button> levelButtons = new List<Button>();
    private Slider masterSlider;
    private Slider musicSlider;
    private Slider sfxSlider;

    private List<LevelData> allLevels = new List<LevelData>();
    private List<GameObject> spawnedStationObjects = new List<GameObject>();
    private List<GameObject> spawnedPlayerObjects = new List<GameObject>();
    private List<GameObject> orderUIItems = new List<GameObject>();

    private int currentTutorialStep;
    private bool isGameplayInitialized;
    private TextMeshProUGUI tutorialStepText;
    private Image tutorialHighlight;
    private GameObject settingsPanel;

    private void Awake()
    {
        GameObject canvasObj = new GameObject("Canvas");
        canvasObj.transform.SetParent(transform);
        canvas = canvasObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920, 1080);

        GameObject eventSystemObj = new GameObject("EventSystem");
        eventSystemObj.transform.SetParent(transform);
        eventSystemObj.AddComponent<UnityEngine.EventSystems.EventSystem>();
        eventSystemObj.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

        BuildAllPanels();
    }

    private void Start()
    {
        if (GameManager.HasInstance)
            GameManager.Instance.OnGameStateChanged += OnGameStateChanged;

        allLevels = RuntimeDataFactory.CreateAllLevels();
        if (allLevels == null || allLevels.Count == 0)
            allLevels = LevelConfigLoader.GetAllLevelConfigs();

        RefreshLevelSelectButtons();
        ShowPanel(GameState.Menu);
    }

    private void OnEnable()
    {
        EventBus.Subscribe<GameEvents.OrderSpawnedEvent>(OnOrderSpawned);
        EventBus.Subscribe<GameEvents.OrderCompletedEvent>(OnOrderCompleted);
        EventBus.Subscribe<GameEvents.OrderFailedEvent>(OnOrderFailed);
        EventBus.Subscribe<GameEvents.PlayerInteractEvent>(OnPlayerInteract);
    }

    private void OnDisable()
    {
        EventBus.Unsubscribe<GameEvents.OrderSpawnedEvent>(OnOrderSpawned);
        EventBus.Unsubscribe<GameEvents.OrderCompletedEvent>(OnOrderCompleted);
        EventBus.Unsubscribe<GameEvents.OrderFailedEvent>(OnOrderFailed);
        EventBus.Unsubscribe<GameEvents.PlayerInteractEvent>(OnPlayerInteract);
    }

    private void OnDestroy()
    {
        if (GameManager.HasInstance)
            GameManager.Instance.OnGameStateChanged -= OnGameStateChanged;
    }

    private void BuildAllPanels()
    {
        BuildStartMenuPanel();
        BuildLevelSelectPanel();
        BuildGameplayHUDPanel();
        BuildTutorialPanel();
        BuildPausedPanel();
        BuildFailurePanel();
        BuildSettlementPanel();
        BuildSettingsPanel();

        foreach (var kvp in allPanels)
            kvp.Value.SetActive(false);

        if (settingsPanel != null)
            settingsPanel.SetActive(false);
    }

    private void BuildStartMenuPanel()
    {
        GameObject panel = CreatePanel("StartMenu", Color.clear);
        VerticalLayoutGroup layout = panel.AddComponent<VerticalLayoutGroup>();
        layout.childAlignment = TextAnchor.MiddleCenter;
        layout.childControlWidth = true;
        layout.childControlHeight = true;
        layout.childForceExpandWidth = false;
        layout.childForceExpandHeight = false;
        layout.spacing = 20;

        CreateText("限时厨房协作", panel.transform, 64, Color.white);

        CreateButton("开始游戏", panel.transform, () => StartLevel(0));
        CreateButton("教程", panel.transform, () => StartLevel(0));
        CreateButton("关卡选择", panel.transform, () => ShowPanel(GameState.LevelSelect));
        CreateButton("设置", panel.transform, ShowSettingsPanel);
        CreateButton("退出", panel.transform, () => Application.Quit());

        allPanels[GameState.Menu] = panel;
    }

    private void BuildLevelSelectPanel()
    {
        GameObject panel = CreatePanel("LevelSelect", new Color(0.1f, 0.1f, 0.15f, 0.95f));
        VerticalLayoutGroup layout = panel.AddComponent<VerticalLayoutGroup>();
        layout.childAlignment = TextAnchor.MiddleCenter;
        layout.childControlWidth = true;
        layout.childControlHeight = true;
        layout.childForceExpandWidth = false;
        layout.childForceExpandHeight = false;
        layout.spacing = 15;

        CreateText("选择关卡", panel.transform, 48, Color.white);

        GameObject buttonContainer = new GameObject("LevelButtons");
        buttonContainer.transform.SetParent(panel.transform, false);
        VerticalLayoutGroup btnLayout = buttonContainer.AddComponent<VerticalLayoutGroup>();
        btnLayout.childAlignment = TextAnchor.MiddleCenter;
        btnLayout.childControlWidth = true;
        btnLayout.childControlHeight = true;
        btnLayout.childForceExpandWidth = false;
        btnLayout.childForceExpandHeight = false;
        btnLayout.spacing = 10;

        levelButtons.Clear();

        CreateButton("返回", panel.transform, () => ShowPanel(GameState.Menu));

        allPanels[GameState.LevelSelect] = panel;
    }

    private void BuildGameplayHUDPanel()
    {
        GameObject panel = CreatePanel("GameplayHUD", Color.clear);

        GameObject topBar = new GameObject("TopBar");
        topBar.transform.SetParent(panel.transform, false);
        RectTransform topRect = topBar.AddComponent<RectTransform>();
        topRect.anchorMin = new Vector2(0, 1);
        topRect.anchorMax = new Vector2(1, 1);
        topRect.pivot = new Vector2(0.5f, 1);
        topRect.anchoredPosition = new Vector2(0, 0);
        topRect.sizeDelta = new Vector2(0, 60);
        HorizontalLayoutGroup topLayout = topBar.AddComponent<HorizontalLayoutGroup>();
        topLayout.childAlignment = TextAnchor.MiddleCenter;
        topLayout.childControlWidth = true;
        topLayout.childControlHeight = true;
        topLayout.childForceExpandWidth = true;
        topLayout.childForceExpandHeight = false;
        topLayout.spacing = 40;

        CreateText("分数:", topBar.transform, 24, Color.white);
        hudScoreText = CreateText("0", topBar.transform, 24, Color.yellow);

        CreateText("时间:", topBar.transform, 24, Color.white);
        hudTimerText = CreateText("0:00", topBar.transform, 24, Color.white);

        CreateText("连击:", topBar.transform, 24, Color.white);
        hudComboText = CreateText("x0", topBar.transform, 24, new Color(1f, 0.5f, 0f));

        GameObject orderArea = new GameObject("OrderArea");
        orderArea.transform.SetParent(panel.transform, false);
        RectTransform orderRect = orderArea.AddComponent<RectTransform>();
        orderRect.anchorMin = new Vector2(0, 0);
        orderRect.anchorMax = new Vector2(0.3f, 1);
        orderRect.pivot = new Vector2(0, 0.5f);
        orderRect.offsetMin = new Vector2(10, 60);
        orderRect.offsetMax = new Vector2(-10, -60);
        VerticalLayoutGroup orderLayout = orderArea.AddComponent<VerticalLayoutGroup>();
        orderLayout.childControlWidth = true;
        orderLayout.childControlHeight = true;
        orderLayout.childForceExpandWidth = true;
        orderLayout.childForceExpandHeight = false;
        orderLayout.spacing = 5;
        hudOrderContainer = orderArea.transform;

        hudCleanHintText = CreateText("", panel.transform, 28, new Color(1f, 0.3f, 0.3f));
        RectTransform cleanHintRect = hudCleanHintText.GetComponent<RectTransform>();
        cleanHintRect.anchorMin = new Vector2(0.3f, 0.05f);
        cleanHintRect.anchorMax = new Vector2(1f, 0.15f);
        cleanHintRect.offsetMin = Vector2.zero;
        cleanHintRect.offsetMax = Vector2.zero;
        hudCleanHintText.alignment = TextAlignmentOptions.Center;

        GameObject pauseBtnObj = new GameObject("PauseButton");
        pauseBtnObj.transform.SetParent(panel.transform, false);
        RectTransform pauseRect = pauseBtnObj.AddComponent<RectTransform>();
        pauseRect.anchorMin = new Vector2(1, 1);
        pauseRect.anchorMax = new Vector2(1, 1);
        pauseRect.pivot = new Vector2(1, 1);
        pauseRect.anchoredPosition = new Vector2(-10, -10);
        pauseRect.sizeDelta = new Vector2(100, 40);
        Button pauseBtn = pauseBtnObj.AddComponent<Button>();
        Image pauseImg = pauseBtnObj.AddComponent<Image>();
        pauseImg.color = new Color(0.3f, 0.3f, 0.3f, 0.8f);
        pauseBtn.targetGraphic = pauseImg;
        GameObject pauseLabel = new GameObject("Label");
        pauseLabel.transform.SetParent(pauseBtnObj.transform, false);
        TextMeshProUGUI pauseText = pauseLabel.AddComponent<TextMeshProUGUI>();
        pauseText.text = "暂停";
        pauseText.fontSize = 20;
        pauseText.alignment = TextAlignmentOptions.Center;
        pauseText.color = Color.white;
        RectTransform pauseLabelRect = pauseLabel.GetComponent<RectTransform>();
        pauseLabelRect.anchorMin = Vector2.zero;
        pauseLabelRect.anchorMax = Vector2.one;
        pauseLabelRect.sizeDelta = Vector2.zero;
        pauseBtn.onClick.AddListener(() => GameManager.Instance.PauseGame());

        allPanels[GameState.Gameplay] = panel;
    }

    private void BuildTutorialPanel()
    {
        GameObject panel = CreatePanel("Tutorial", new Color(0, 0, 0, 0.5f));

        GameObject stepContainer = new GameObject("StepContainer");
        stepContainer.transform.SetParent(panel.transform, false);
        RectTransform stepRect = stepContainer.AddComponent<RectTransform>();
        stepRect.anchorMin = new Vector2(0.2f, 0.3f);
        stepRect.anchorMax = new Vector2(0.8f, 0.7f);

        tutorialStepText = CreateText("", stepContainer.transform, 36, Color.white);

        GameObject highlightObj = new GameObject("Highlight");
        highlightObj.transform.SetParent(panel.transform, false);
        RectTransform highlightRect = highlightObj.AddComponent<RectTransform>();
        highlightRect.sizeDelta = new Vector2(100, 100);
        tutorialHighlight = highlightObj.AddComponent<Image>();
        tutorialHighlight.color = new Color(1f, 1f, 0f, 0.3f);
        highlightObj.GetComponent<RectTransform>().anchorMin = new Vector2(0.5f, 0.5f);
        highlightObj.GetComponent<RectTransform>().anchorMax = new Vector2(0.5f, 0.5f);

        CreateButton("跳过", panel.transform, () =>
        {
            if (GameManager.Instance.CurrentState == GameState.Tutorial)
                GameManager.Instance.StartLevel(GameManager.Instance.CurrentLevelIndex);
        });

        allPanels[GameState.Tutorial] = panel;
    }

    private void BuildPausedPanel()
    {
        GameObject panel = CreatePanel("Paused", new Color(0, 0, 0, 0.7f));
        VerticalLayoutGroup layout = panel.AddComponent<VerticalLayoutGroup>();
        layout.childAlignment = TextAnchor.MiddleCenter;
        layout.childControlWidth = true;
        layout.childControlHeight = true;
        layout.childForceExpandWidth = false;
        layout.childForceExpandHeight = false;
        layout.spacing = 20;

        CreateText("已暂停", panel.transform, 48, Color.white);
        CreateButton("继续", panel.transform, () => GameManager.Instance.ResumeGame());
        CreateButton("返回主菜单", panel.transform, () => GameManager.Instance.ReturnToMenu());

        allPanels[GameState.Paused] = panel;
    }

    private void BuildFailurePanel()
    {
        GameObject panel = CreatePanel("Failure", new Color(0.2f, 0, 0, 0.85f));
        VerticalLayoutGroup layout = panel.AddComponent<VerticalLayoutGroup>();
        layout.childAlignment = TextAnchor.MiddleCenter;
        layout.childControlWidth = true;
        layout.childControlHeight = true;
        layout.childForceExpandWidth = false;
        layout.childForceExpandHeight = false;
        layout.spacing = 20;

        CreateText("关卡失败", panel.transform, 48, Color.red);
        failReasonText = CreateText("", panel.transform, 28, Color.white);
        CreateButton("重试", panel.transform, () => StartLevel(GameManager.Instance.CurrentLevelIndex));
        CreateButton("主菜单", panel.transform, () => GameManager.Instance.ReturnToMenu());

        allPanels[GameState.Failure] = panel;
    }

    private void BuildSettlementPanel()
    {
        GameObject panel = CreatePanel("Settlement", new Color(0, 0, 0.1f, 0.9f));
        VerticalLayoutGroup layout = panel.AddComponent<VerticalLayoutGroup>();
        layout.childAlignment = TextAnchor.MiddleCenter;
        layout.childControlWidth = true;
        layout.childControlHeight = true;
        layout.childForceExpandWidth = false;
        layout.childForceExpandHeight = false;
        layout.spacing = 15;

        settleLevelText = CreateText("", panel.transform, 36, Color.white);

        GameObject starRow = new GameObject("StarRow");
        starRow.transform.SetParent(panel.transform, false);
        HorizontalLayoutGroup starLayout = starRow.AddComponent<HorizontalLayoutGroup>();
        starLayout.childAlignment = TextAnchor.MiddleCenter;
        starLayout.childControlWidth = true;
        starLayout.childControlHeight = true;
        starLayout.childForceExpandWidth = false;
        starLayout.childForceExpandHeight = false;
        starLayout.spacing = 20;

        settleStarImages.Clear();
        for (int i = 0; i < GameConstants.MAX_STARS; i++)
        {
            GameObject starObj = new GameObject($"Star_{i}");
            starObj.transform.SetParent(starRow.transform, false);
            Image starImg = starObj.AddComponent<Image>();
            starImg.color = Color.gray;
            starImg.rectTransform.sizeDelta = new Vector2(60, 60);
            settleStarImages.Add(starImg);
        }

        settleScoreText = CreateText("", panel.transform, 32, Color.yellow);
        settleStatsText = CreateText("", panel.transform, 22, Color.white);

        CreateButton("下一关", panel.transform, () =>
        {
            int next = GameManager.Instance.CurrentLevelIndex + 1;
            if (next < allLevels.Count)
                StartLevel(next);
            else
                GameManager.Instance.ReturnToMenu();
        });

        CreateButton("重试", panel.transform, () => StartLevel(GameManager.Instance.CurrentLevelIndex));
        CreateButton("主菜单", panel.transform, () => GameManager.Instance.ReturnToMenu());

        allPanels[GameState.Settlement] = panel;
    }

    private void BuildSettingsPanel()
    {
        GameObject panel = CreatePanel("Settings", new Color(0.1f, 0.1f, 0.15f, 0.95f));
        VerticalLayoutGroup layout = panel.AddComponent<VerticalLayoutGroup>();
        layout.childAlignment = TextAnchor.MiddleCenter;
        layout.childControlWidth = true;
        layout.childControlHeight = true;
        layout.childForceExpandWidth = false;
        layout.childForceExpandHeight = false;
        layout.spacing = 20;

        CreateText("设置", panel.transform, 48, Color.white);

        CreateText("主音量", panel.transform, 24, Color.white);
        float masterVal = AudioManager.HasInstance ? AudioManager.Instance.masterVolume : 0.8f;
        masterSlider = CreateSlider(masterVal, panel.transform, v => { if (AudioManager.HasInstance) AudioManager.Instance.SetMasterVolume(v); });

        CreateText("音乐音量", panel.transform, 24, Color.white);
        float musicVal = AudioManager.HasInstance ? AudioManager.Instance.musicVolume : 0.7f;
        musicSlider = CreateSlider(musicVal, panel.transform, v => { if (AudioManager.HasInstance) AudioManager.Instance.SetMusicVolume(v); });

        CreateText("音效音量", panel.transform, 24, Color.white);
        float sfxVal = AudioManager.HasInstance ? AudioManager.Instance.sfxVolume : 0.8f;
        sfxSlider = CreateSlider(sfxVal, panel.transform, v => { if (AudioManager.HasInstance) AudioManager.Instance.SetSFXVolume(v); });

        GameObject toggleObj = new GameObject("FullscreenToggle");
        toggleObj.transform.SetParent(panel.transform, false);
        Toggle fullscreenToggle = toggleObj.AddComponent<Toggle>();
        Image toggleBg = toggleObj.AddComponent<Image>();
        toggleBg.color = Color.white;
        fullscreenToggle.targetGraphic = toggleBg;
        fullscreenToggle.isOn = Screen.fullScreen;
        fullscreenToggle.onValueChanged.AddListener(isOn => Screen.fullScreen = isOn);
        GameObject checkObj = new GameObject("Checkmark");
        checkObj.transform.SetParent(toggleObj.transform, false);
        Image checkImg = checkObj.AddComponent<Image>();
        checkImg.color = Color.green;
        fullscreenToggle.graphic = checkImg;
        RectTransform checkRect = checkObj.GetComponent<RectTransform>();
        checkRect.anchorMin = new Vector2(0.1f, 0.1f);
        checkRect.anchorMax = new Vector2(0.9f, 0.9f);
        checkRect.sizeDelta = Vector2.zero;

        CreateText("全屏", panel.transform, 24, Color.white);

        CreateButton("返回", panel.transform, () =>
        {
            settingsPanel.SetActive(false);
            ShowPanel(GameState.Menu);
        });

        settingsPanel = panel;
    }

    private void ShowPanel(GameState state)
    {
        if (currentPanel != null)
            currentPanel.SetActive(false);

        if (settingsPanel != null)
            settingsPanel.SetActive(false);

        GameObject panel;
        if (allPanels.TryGetValue(state, out panel))
        {
            panel.SetActive(true);
            currentPanel = panel;
        }

        if (state == GameState.LevelSelect)
            RefreshLevelSelectButtons();
    }

    private void ShowSettingsPanel()
    {
        if (currentPanel != null)
            currentPanel.SetActive(false);

        if (settingsPanel != null)
        {
            settingsPanel.SetActive(true);
            currentPanel = settingsPanel;
        }
    }

    private void OnGameStateChanged(GameState prev, GameState next)
    {
        ShowPanel(next);

        if ((next == GameState.Gameplay || next == GameState.Tutorial) && !isGameplayInitialized)
        {
            StartGameplay();
            isGameplayInitialized = true;
        }

        if (next == GameState.Settlement)
            PopulateSettlement();

        if (next == GameState.Failure)
            PopulateFailure();

        if (next == GameState.Menu)
            isGameplayInitialized = false;
    }

    private void StartGameplay()
    {
        CleanupSpawnedObjects();

        int levelIndex = GameManager.Instance.CurrentLevelIndex;
        LevelData levelData = null;

        if (levelIndex >= 0 && levelIndex < allLevels.Count)
            levelData = allLevels[levelIndex];

        if (levelData == null)
            levelData = RuntimeDataFactory.CreateLevelData(levelIndex);

        if (levelData == null)
            return;

        LevelManager.Instance.LoadLevel(levelData);
        OrderManager.Instance.SetAvailableRecipes(levelData.availableRecipes);
        OrderManager.Instance.InitializeSpawnTimer(levelData.orderInterval);
        OrderManager.Instance.SetMaxActiveOrders(levelData.maxOrders);
        ScoringManager.Instance.ResetLevelScore();

        SpawnLevelStations(levelData);
        CreatePlayer();

        if (levelData.isTutorialLevel && levelData.tutorialSteps != null && levelData.tutorialSteps.Count > 0)
        {
            currentTutorialStep = 0;
            UpdateTutorialStep(levelData);
        }

        LevelManager.Instance.StartLevel();
    }

    private void Update()
    {
        GameState state = GameManager.Instance.CurrentState;

        if (state == GameState.Gameplay)
        {
            UpdateGameplayHUD();

            if (Input.GetKeyDown(KeyCode.Escape))
                GameManager.Instance.PauseGame();
        }
        else if (state == GameState.Tutorial)
        {
            UpdateGameplayHUD();
            UpdateTutorialProgress();

            if (Input.GetKeyDown(KeyCode.Escape))
                GameManager.Instance.PauseGame();
        }
    }

    private void UpdateGameplayHUD()
    {
        if (hudScoreText != null)
            hudScoreText.text = ScoringManager.Instance.currentScore.ToString();

        if (hudTimerText != null && LevelManager.Instance.levelTimer != null)
        {
            float remaining = LevelManager.Instance.levelTimer.RemainingTime;
            int minutes = Mathf.FloorToInt(remaining / 60f);
            int seconds = Mathf.FloorToInt(remaining % 60f);
            hudTimerText.text = $"{minutes}:{seconds:D2}";
        }

        if (hudComboText != null)
        {
            int combo = ScoringManager.Instance.comboCount;
            hudComboText.text = combo > 0 ? $"x{combo}" : "";
        }

        if (hudCleanHintText != null && LevelManager.HasInstance && LevelManager.Instance.currentLevelData != null)
        {
            LevelData ld = LevelManager.Instance.currentLevelData;
            bool scoreMet = ScoringManager.Instance.currentScore >= ld.targetScore;
            bool hasDirty = LevelManager.HasDirtyDishes();
            if (ld.requireAllDishesCleaned && scoreMet && hasDirty)
                hudCleanHintText.text = "请清洗脏盘子！";
            else
                hudCleanHintText.text = "";
        }
    }

    private void PopulateSettlement()
    {
        LevelData levelData = LevelManager.Instance.currentLevelData;
        int score = ScoringManager.Instance.currentScore;
        int stars = LevelManager.Instance.GetCurrentStars(score);

        if (settleLevelText != null && levelData != null)
            settleLevelText.text = levelData.levelName;

        if (settleScoreText != null)
            settleScoreText.text = $"分数: {score}";

        for (int i = 0; i < settleStarImages.Count; i++)
            settleStarImages[i].color = i < stars ? Color.yellow : Color.gray;

        int completed = OrderManager.Instance.completedOrders.Count;
        int failed = OrderManager.Instance.failedOrders.Count;
        int bestCombo = ScoringManager.Instance.comboCount;
        float timeUsed = levelData != null ? levelData.timeLimit - (LevelManager.Instance.levelTimer?.RemainingTime ?? 0f) : 0f;

        if (settleStatsText != null)
            settleStatsText.text = $"完成订单: {completed}  失败订单: {failed}\n最高连击: {bestCombo}  用时: {timeUsed:F1}s";

        if (levelData != null)
        {
            if (LevelProgression.Instance != null)
                LevelProgression.Instance.CompleteLevel(levelData.levelIndex, stars);
            ScoringManager.Instance.SaveLevelScore(levelData.levelIndex);
        }
    }

    private void PopulateFailure()
    {
        if (failReasonText != null)
            failReasonText.text = "时间耗尽！";
    }

    private void CreatePlayer()
    {
        PlayerManager.Instance.SetSoloMode(true);
        PlayerManager.Instance.players.Clear();

        GameObject playerObj = new GameObject("Player");
        playerObj.transform.SetParent(null);
        playerObj.transform.position = Vector3.zero;

        Rigidbody2D rb = playerObj.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0f;
        rb.constraints = RigidbodyConstraints2D.FreezeRotation;

        BoxCollider2D col = playerObj.AddComponent<BoxCollider2D>();
        col.size = new Vector2(0.8f, 0.8f);

        SpriteRenderer sr = playerObj.AddComponent<SpriteRenderer>();
        sr.sprite = CreateRectSprite(0.8f, 0.8f, Color.green);

        PlayerController pc = playerObj.AddComponent<PlayerController>();
        pc.rb = rb;
        pc.spriteRenderer = sr;
        pc.isControlled = true;

        PlayerManager.Instance.RegisterPlayer(pc);
        spawnedPlayerObjects.Add(playerObj);
    }

    private void SpawnLevelStations(LevelData levelData)
    {
        if (levelData == null || levelData.stationLayout == null)
            return;

        foreach (StationLayoutEntry entry in levelData.stationLayout)
        {
            if (entry.isLocked)
                continue;

            GameObject stationObj = new GameObject(entry.stationName);
            stationObj.transform.position = entry.position;
            stationObj.transform.rotation = Quaternion.Euler(0f, 0f, entry.rotation);

            Color stationColor = GetStationColor(entry.stationType);
            SpriteRenderer sr = stationObj.AddComponent<SpriteRenderer>();
            sr.sprite = CreateRectSprite(1.2f, 0.8f, stationColor);
            sr.sortingOrder = 1;

            KitchenStation station = null;
            switch (entry.stationType)
            {
                case StationType.Prep:
                    station = stationObj.AddComponent<PrepStation>();
                    break;
                case StationType.Cooking:
                    station = stationObj.AddComponent<CookingStation>();
                    break;
                case StationType.Plating:
                    station = stationObj.AddComponent<PlatingStation>();
                    break;
                case StationType.Cleaning:
                    station = stationObj.AddComponent<CleaningStation>();
                    break;
                case StationType.Ingredient:
                    station = stationObj.AddComponent<IngredientStation>();
                    break;
            }

            if (station != null)
            {
                station.stationType = entry.stationType;
                station.stationName = entry.stationName;
                StationManager.Instance.RegisterStation(station);
            }

            if (entry.stationType == StationType.Ingredient && station is IngredientStation ingStation)
                ingStation.availableIngredients = levelData.availableIngredients;

            GameObject progressBar = new GameObject("Progress");
            progressBar.transform.SetParent(stationObj.transform, false);
            progressBar.transform.localPosition = new Vector3(0f, 0.6f, 0f);
            SpriteRenderer progressBg = progressBar.AddComponent<SpriteRenderer>();
            progressBg.sprite = CreateRectSprite(1.0f, 0.15f, new Color(0.2f, 0.2f, 0.2f, 0.8f));
            progressBg.sortingOrder = 2;

            GameObject progressFill = new GameObject("ProgressFill");
            progressFill.transform.SetParent(progressBar.transform, false);
            progressFill.transform.localPosition = new Vector3(0f, 0f, 0f);
            SpriteRenderer fillSr = progressFill.AddComponent<SpriteRenderer>();
            fillSr.sprite = CreateRectSprite(1.0f, 0.15f, Color.green);
            fillSr.sortingOrder = 3;

            spawnedStationObjects.Add(stationObj);
        }
    }

    private void UpdateTutorialStep(LevelData levelData)
    {
        if (levelData == null || levelData.tutorialSteps == null || currentTutorialStep >= levelData.tutorialSteps.Count)
            return;

        TutorialStep step = levelData.tutorialSteps[currentTutorialStep];
        if (tutorialStepText != null)
            tutorialStepText.text = step.description;

        if (tutorialHighlight != null)
        {
            RectTransform hlRect = tutorialHighlight.GetComponent<RectTransform>();
            hlRect.anchoredPosition = new Vector2(step.highlightPosition.x, step.highlightPosition.y);
            float diameter = step.highlightRadius * 2f;
            hlRect.sizeDelta = new Vector2(diameter, diameter);
        }
    }

    private void OnPlayerInteract(GameEvents.PlayerInteractEvent e)
    {
        if (GameManager.Instance.CurrentState != GameState.Tutorial)
            return;

        LevelData levelData = LevelManager.HasInstance ? LevelManager.Instance.currentLevelData : null;
        if (levelData == null || levelData.tutorialSteps == null || currentTutorialStep >= levelData.tutorialSteps.Count)
            return;

        TutorialStep step = levelData.tutorialSteps[currentTutorialStep];
        if (e.StationType == step.targetStationType)
        {
            step.isCompleted = true;
            levelData.tutorialSteps[currentTutorialStep] = step;
        }
    }

    private void UpdateTutorialProgress()
    {
        LevelData levelData = LevelManager.HasInstance ? LevelManager.Instance.currentLevelData : null;
        if (levelData == null || levelData.tutorialSteps == null || currentTutorialStep >= levelData.tutorialSteps.Count)
            return;

        TutorialStep step = levelData.tutorialSteps[currentTutorialStep];
        if (step.isCompleted)
        {
            currentTutorialStep++;
            if (currentTutorialStep >= levelData.tutorialSteps.Count)
            {
                if (tutorialHighlight != null)
                    tutorialHighlight.gameObject.SetActive(false);
                if (tutorialStepText != null)
                    tutorialStepText.gameObject.SetActive(false);
                GameManager.Instance.TransitionToGameplay();
            }
            else
            {
                UpdateTutorialStep(levelData);
            }
        }
    }

    private void RefreshLevelSelectButtons()
    {
        if (!allPanels.ContainsKey(GameState.LevelSelect))
            return;

        foreach (Button btn in levelButtons)
        {
            if (btn != null && btn.gameObject != null)
                Destroy(btn.gameObject);
        }
        levelButtons.Clear();

        Transform container = allPanels[GameState.LevelSelect].transform.Find("LevelButtons");
        if (container == null)
            return;

        for (int i = 0; i < allLevels.Count; i++)
        {
            int index = i;
            LevelData level = allLevels[i];
            int bestStars = LevelProgression.Instance != null ? LevelProgression.Instance.GetBestStars(i) : 0;
            string starStr = new string('★', bestStars) + new string('☆', GameConstants.MAX_STARS - bestStars);
            string label = $"{level.levelName}  {starStr}";

            Button btn = CreateButton(label, container, () => StartLevel(index));
            levelButtons.Add(btn);
        }
    }

    private void StartLevel(int levelIndex)
    {
        if (levelIndex < 0 || levelIndex >= allLevels.Count)
            return;

        LevelData levelData = allLevels[levelIndex];
        if (levelData.isTutorialLevel)
        {
            GameManager.Instance.StartTutorial(levelIndex);
        }
        else
        {
            GameManager.Instance.StartLevel(levelIndex);
        }
    }

    private void OnOrderSpawned(GameEvents.OrderSpawnedEvent e)
    {
        if (hudOrderContainer == null || e.Order == null || e.Order.recipe == null)
            return;

        GameObject orderItem = new GameObject($"Order_{e.Order.orderID}");
        orderItem.transform.SetParent(hudOrderContainer, false);
        HorizontalLayoutGroup layout = orderItem.AddComponent<HorizontalLayoutGroup>();
        layout.childControlWidth = true;
        layout.childControlHeight = true;
        layout.childForceExpandWidth = false;
        layout.childForceExpandHeight = false;
        layout.spacing = 5;

        Image bg = orderItem.AddComponent<Image>();
        bg.color = new Color(0.2f, 0.2f, 0.3f, 0.9f);

        CreateText(e.Order.recipe.recipeName, orderItem.transform, 18, Color.white);
        TextMeshProUGUI timeText = CreateText($"{e.Order.timeRemaining:F0}s", orderItem.transform, 16, Color.cyan);
        orderItem.AddComponent<OrderUIBinding>().Initialize(e.Order, timeText);

        orderUIItems.Add(orderItem);
    }

    private void OnOrderCompleted(GameEvents.OrderCompletedEvent e)
    {
        RemoveOrderUI(e.Order);
    }

    private void OnOrderFailed(GameEvents.OrderFailedEvent e)
    {
        RemoveOrderUI(e.Order);
    }

    private void RemoveOrderUI(Order order)
    {
        if (order == null || hudOrderContainer == null)
            return;

        for (int i = orderUIItems.Count - 1; i >= 0; i--)
        {
            GameObject item = orderUIItems[i];
            OrderUIBinding binding = item.GetComponent<OrderUIBinding>();
            if (binding != null && binding.order == order)
            {
                orderUIItems.RemoveAt(i);
                Destroy(item);
                return;
            }
        }
    }

    private void CleanupSpawnedObjects()
    {
        foreach (GameObject obj in spawnedStationObjects)
        {
            if (obj != null)
                Destroy(obj);
        }
        spawnedStationObjects.Clear();

        foreach (GameObject obj in spawnedPlayerObjects)
        {
            if (obj != null)
                Destroy(obj);
        }
        spawnedPlayerObjects.Clear();

        foreach (GameObject obj in orderUIItems)
        {
            if (obj != null)
                Destroy(obj);
        }
        orderUIItems.Clear();

        if (StationManager.HasInstance)
            StationManager.Instance.allStations.Clear();

        if (PlayerManager.HasInstance)
            PlayerManager.Instance.players.Clear();
    }

    private GameObject CreatePanel(string name, Color bgColor)
    {
        GameObject panel = new GameObject(name);
        panel.transform.SetParent(canvas.transform, false);

        RectTransform rect = panel.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.sizeDelta = Vector2.zero;

        if (bgColor.a > 0.001f)
        {
            Image bg = panel.AddComponent<Image>();
            bg.color = bgColor;
        }

        return panel;
    }

    private Button CreateButton(string text, Transform parent, Action onClick)
    {
        GameObject btnObj = new GameObject($"Btn_{text}");
        btnObj.transform.SetParent(parent, false);

        Image bg = btnObj.AddComponent<Image>();
        bg.color = new Color(0.25f, 0.25f, 0.35f, 1f);

        Button btn = btnObj.AddComponent<Button>();
        btn.targetGraphic = bg;

        GameObject labelObj = new GameObject("Label");
        labelObj.transform.SetParent(btnObj.transform, false);
        TextMeshProUGUI tmp = labelObj.AddComponent<TextMeshProUGUI>();
        tmp.text = text;
        tmp.fontSize = 24;
        tmp.alignment = TextAlignmentOptions.Center;
        tmp.color = Color.white;
        RectTransform labelRect = labelObj.GetComponent<RectTransform>();
        labelRect.anchorMin = Vector2.zero;
        labelRect.anchorMax = Vector2.one;
        labelRect.sizeDelta = Vector2.zero;

        LayoutElement layoutEl = btnObj.AddComponent<LayoutElement>();
        layoutEl.minHeight = 40;
        layoutEl.preferredWidth = 200;

        btn.onClick.AddListener(() => onClick());

        return btn;
    }

    private TextMeshProUGUI CreateText(string content, Transform parent, int fontSize, Color color)
    {
        GameObject textObj = new GameObject("Text");
        textObj.transform.SetParent(parent, false);

        TextMeshProUGUI tmp = textObj.AddComponent<TextMeshProUGUI>();
        tmp.text = content;
        tmp.fontSize = fontSize;
        tmp.color = color;
        tmp.alignment = TextAlignmentOptions.Center;

        LayoutElement layoutEl = textObj.AddComponent<LayoutElement>();
        layoutEl.preferredHeight = fontSize + 10;

        return tmp;
    }

    private Slider CreateSlider(float value, Transform parent, Action<float> onValueChanged)
    {
        GameObject sliderObj = new GameObject("Slider");
        sliderObj.transform.SetParent(parent, false);

        Slider slider = sliderObj.AddComponent<Slider>();
        slider.minValue = 0f;
        slider.maxValue = 1f;
        slider.value = value;
        slider.direction = Slider.Direction.LeftToRight;

        LayoutElement layoutEl = sliderObj.AddComponent<LayoutElement>();
        layoutEl.minHeight = 30;
        layoutEl.preferredWidth = 300;

        GameObject bgObj = new GameObject("Background");
        bgObj.transform.SetParent(sliderObj.transform, false);
        Image bgImg = bgObj.AddComponent<Image>();
        bgImg.color = new Color(0.3f, 0.3f, 0.3f);
        RectTransform bgRect = bgObj.GetComponent<RectTransform>();
        bgRect.anchorMin = Vector2.zero;
        bgRect.anchorMax = Vector2.one;
        bgRect.sizeDelta = Vector2.zero;

        GameObject fillAreaObj = new GameObject("Fill Area");
        fillAreaObj.transform.SetParent(sliderObj.transform, false);
        RectTransform fillAreaRect = fillAreaObj.GetComponent<RectTransform>();
        fillAreaRect.anchorMin = Vector2.zero;
        fillAreaRect.anchorMax = Vector2.one;
        fillAreaRect.sizeDelta = Vector2.zero;

        GameObject fillObj = new GameObject("Fill");
        fillObj.transform.SetParent(fillAreaObj.transform, false);
        Image fillImg = fillObj.AddComponent<Image>();
        fillImg.color = new Color(0.3f, 0.7f, 1f);
        RectTransform fillRect = fillObj.GetComponent<RectTransform>();
        fillRect.anchorMin = Vector2.zero;
        fillRect.anchorMax = new Vector2(1, 1);
        fillRect.sizeDelta = Vector2.zero;

        GameObject handleAreaObj = new GameObject("Handle Slide Area");
        handleAreaObj.transform.SetParent(sliderObj.transform, false);
        RectTransform handleAreaRect = handleAreaObj.GetComponent<RectTransform>();
        handleAreaRect.anchorMin = Vector2.zero;
        handleAreaRect.anchorMax = Vector2.one;
        handleAreaRect.sizeDelta = Vector2.zero;

        GameObject handleObj = new GameObject("Handle");
        handleObj.transform.SetParent(handleAreaObj.transform, false);
        Image handleImg = handleObj.AddComponent<Image>();
        handleImg.color = Color.white;
        RectTransform handleRect = handleObj.GetComponent<RectTransform>();
        handleRect.sizeDelta = new Vector2(20, 20);

        slider.targetGraphic = handleImg;
        slider.fillRect = fillRect;
        slider.handleRect = handleRect;

        slider.onValueChanged.AddListener(v => onValueChanged(v));

        return slider;
    }

    private Sprite CreateRectSprite(float width, float height, Color color)
    {
        Texture2D tex = new Texture2D(1, 1);
        tex.SetPixel(0, 0, Color.white);
        tex.Apply();
        Sprite sprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        return sprite;
    }

    private Color GetStationColor(StationType type)
    {
        switch (type)
        {
            case StationType.Ingredient: return new Color(0.4f, 0.8f, 0.4f);
            case StationType.Prep: return new Color(0.4f, 0.6f, 0.9f);
            case StationType.Cooking: return new Color(0.9f, 0.4f, 0.2f);
            case StationType.Plating: return new Color(0.8f, 0.7f, 0.3f);
            case StationType.Cleaning: return new Color(0.5f, 0.7f, 0.9f);
            default: return Color.white;
        }
    }

    private class OrderUIBinding : MonoBehaviour
    {
        public Order order;
        private TextMeshProUGUI timeLabel;

        public void Initialize(Order order, TextMeshProUGUI timeLabel)
        {
            this.order = order;
            this.timeLabel = timeLabel;
        }

        private void Update()
        {
            if (order != null && timeLabel != null)
            {
                timeLabel.text = $"{Mathf.Max(0, order.timeRemaining):F0}s";

                if (order.timeRemaining < 10f)
                    timeLabel.color = Color.red;
                else if (order.timeRemaining < 20f)
                    timeLabel.color = Color.yellow;
                else
                    timeLabel.color = Color.cyan;
            }
        }
    }
}
