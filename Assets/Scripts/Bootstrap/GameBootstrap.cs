using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;
using SpaceCourier.Gameplay;
using SpaceCourier.StarMap;
using SpaceCourier.UI;
using SpaceCourier.SaveSystem;
using SpaceCourier.Audio;
using SpaceCourier.Animation;
using DataDiff = SpaceCourier.Data.Difficulty;

namespace SpaceCourier.Bootstrap
{
    [DefaultExecutionOrder(-1000)]
    public class GameBootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureBootstrapExists()
        {
            if (FindObjectOfType<GameBootstrap>() == null)
            {
                Debug.Log("[Bootstrap] No GameBootstrap found in scene, auto-creating.");
                var obj = new GameObject("_Bootstrap_Auto");
                obj.AddComponent<GameBootstrap>();
            }
        }

        private static readonly Color COLOR_BG_DARK = new Color(0.03f, 0.04f, 0.08f);
        private static readonly Color COLOR_PANEL_BG = new Color(0.08f, 0.1f, 0.18f, 0.95f);
        private static readonly Color COLOR_ACCENT = new Color(0.2f, 0.7f, 1f);
        private static readonly Color COLOR_ACCENT2 = new Color(1f, 0.78f, 0.25f);
        private static readonly Color COLOR_GREEN = new Color(0.3f, 0.85f, 0.4f);
        private static readonly Color COLOR_RED = new Color(0.9f, 0.3f, 0.3f);

        private GameManager gameManager;
        private AnimationController animationController;

        private StarMapController starMapController;
        private GameplayController gameplayController;

        private MainMenuPanel mainMenuPanel;
        private HUDPanel hudPanel;
        private ContractPanel contractPanel;
        private EventCardPanel eventCardPanel;
        private ResultPanel resultPanel;
        private SettingsPanel settingsPanel;
        private NotificationToast notificationToast;

        private GameObject starNodePrefab;
        private GameObject connectionPrefab;
        private GameObject shipObject;
        private LineRenderer routeLineRenderer;

        private LevelButtonItem levelButtonPrefab;
        private ContractItemView contractItemPrefab;
        private EventChoiceButton eventChoiceButtonPrefab;
        private GameObject breakdownItemPrefab;

        private Camera mainCamera;
        private GameObject starMapRoot;
        private Canvas mainCanvas;
        private CanvasScaler mainCanvasScaler;

        private DataManager dataManager;
        private TurnManager turnManager;
        private FuelManager fuelManager;
        private ReputationManager reputationManager;
        private EventManager eventManager;
        private UIManager uiManager;
        private PlayRecorder playRecorder;
        private AudioManager audioManager;

        private bool isGameStarted = false;
        private int currentLevelId = 1;

        private TMP_FontAsset cachedFont;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            CreateCoreSceneObjects();
            CreateMainCanvas();
            CreateAllUIPanels();
            CreateStarMapTemplates();
            InitializeSystems();
            SetupUIConnections();
        }

        private void Start()
        {
            ShowMainMenu();
        }

        private void CreateCoreSceneObjects()
        {
            var cameraObj = new GameObject("MainCamera");
            cameraObj.tag = "MainCamera";
            mainCamera = cameraObj.AddComponent<Camera>();
            mainCamera.orthographic = true;
            mainCamera.orthographicSize = 8f;
            mainCamera.backgroundColor = COLOR_BG_DARK;
            mainCamera.clearFlags = CameraClearFlags.SolidColor;
            mainCamera.depth = -1;
            cameraObj.AddComponent<AudioListener>();

            var eventSystemObj = new GameObject("EventSystem");
            eventSystemObj.AddComponent<EventSystem>();
            eventSystemObj.AddComponent<StandaloneInputModule>();

            starMapRoot = new GameObject("StarMapRoot");
            starMapRoot.transform.position = Vector3.zero;
        }

        private void CreateMainCanvas()
        {
            var canvasObj = new GameObject("MainCanvas");
            canvasObj.transform.SetParent(transform, false);
            mainCanvas = canvasObj.AddComponent<Canvas>();
            mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            mainCanvas.sortingOrder = 100;

            mainCanvasScaler = canvasObj.AddComponent<CanvasScaler>();
            mainCanvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            mainCanvasScaler.referenceResolution = new Vector2(1920, 1080);
            mainCanvasScaler.matchWidthOrHeight = 0.5f;

            canvasObj.AddComponent<GraphicRaycaster>();
        }

        private void CreateAllUIPanels()
        {
            notificationToast = CreateNotificationToast();
            mainMenuPanel = CreateMainMenuPanel();
            hudPanel = CreateHUDPanel();
            contractPanel = CreateContractPanel();
            eventCardPanel = CreateEventCardPanel();
            resultPanel = CreateResultPanel();
            settingsPanel = CreateSettingsPanel();
        }

        private void CreateStarMapTemplates()
        {
            starNodePrefab = CreateStarNodeTemplate();
            connectionPrefab = CreateConnectionTemplate();
            shipObject = CreateShipObject();
            routeLineRenderer = CreateRouteLineRenderer();
        }

        private GameObject CreateStarNodeTemplate()
        {
            var nodeObj = new GameObject("StarNodeTemplate");
            nodeObj.transform.SetParent(starMapRoot.transform, false);
            nodeObj.SetActive(false);

            var nodeRendererObj = new GameObject("NodeSprite");
            nodeRendererObj.transform.SetParent(nodeObj.transform, false);
            var nodeRenderer = nodeRendererObj.AddComponent<SpriteRenderer>();
            nodeRenderer.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f), 64f);
            nodeRenderer.sortingOrder = 5;
            nodeRenderer.color = COLOR_ACCENT;

            var labelObj = new GameObject("Label");
            labelObj.transform.SetParent(nodeObj.transform, false);
            labelObj.transform.localPosition = new Vector3(0, -1.2f, 0);
            var nameLabel = labelObj.AddComponent<TextMeshPro>();
            nameLabel.text = "Node";
            nameLabel.fontSize = 14;
            nameLabel.color = Color.white;
            nameLabel.alignment = TextAlignmentOptions.Center;
            nameLabel.font = GetDefaultFont();

            var ringGlowObj = new GameObject("RingGlow");
            ringGlowObj.transform.SetParent(nodeObj.transform, false);
            var haloRenderer = ringGlowObj.AddComponent<SpriteRenderer>();
            haloRenderer.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 128, 128), new Vector2(0.5f, 0.5f), 128f);
            haloRenderer.sortingOrder = 4;
            haloRenderer.color = new Color(0.3f, 0.5f, 1f, 0.3f);

            var statusBarObj = new GameObject("StatusBar");
            statusBarObj.transform.SetParent(nodeObj.transform, false);
            statusBarObj.transform.localPosition = new Vector3(0, 0.8f, 0);
            var statusRenderer = statusBarObj.AddComponent<SpriteRenderer>();
            statusRenderer.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 32, 4), new Vector2(0.5f, 0.5f), 32f);
            statusRenderer.sortingOrder = 6;
            statusRenderer.color = COLOR_GREEN;

            var selectorObj = new GameObject("Selector");
            selectorObj.transform.SetParent(nodeObj.transform, false);
            var selectorRenderer = selectorObj.AddComponent<SpriteRenderer>();
            selectorRenderer.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 128, 128), new Vector2(0.5f, 0.5f), 128f);
            selectorRenderer.sortingOrder = 3;
            selectorRenderer.color = new Color(0f, 1f, 1f, 0.8f);
            selectorRenderer.enabled = false;

            var col2D = nodeObj.AddComponent<CircleCollider2D>();
            col2D.radius = 0.8f;

            var nodeView = nodeObj.AddComponent<StarNodeView>();
            nodeView.nodeRenderer = nodeRenderer;
            nodeView.haloRenderer = haloRenderer;
            nodeView.selectorRenderer = selectorRenderer;
            nodeView.nameLabel = nameLabel;
            nodeView.hitCollider = col2D;

            return nodeObj;
        }

        private GameObject CreateConnectionTemplate()
        {
            var connObj = new GameObject("ConnectionTemplate");
            connObj.transform.SetParent(starMapRoot.transform, false);
            connObj.SetActive(false);

            var line = connObj.AddComponent<LineRenderer>();
            line.useWorldSpace = false;
            line.startWidth = 0.15f;
            line.endWidth = 0.15f;
            line.material = new Material(Shader.Find("Sprites/Default"));
            line.startColor = new Color(0.3f, 0.3f, 0.4f, 0.6f);
            line.endColor = new Color(0.3f, 0.3f, 0.4f, 0.6f);
            line.sortingOrder = 1;
            line.positionCount = 2;
            line.SetPosition(0, Vector3.zero);
            line.SetPosition(1, Vector3.right);

            return connObj;
        }

        private GameObject CreateShipObject()
        {
            var shipObj = new GameObject("ShipObject");
            shipObj.transform.SetParent(starMapRoot.transform, false);

            var shipRenderer = shipObj.AddComponent<SpriteRenderer>();
            Texture2D shipTex = new Texture2D(64, 64);
            Color[] shipPixels = new Color[64 * 64];
            for (int y = 0; y < 64; y++)
            {
                for (int x = 0; x < 64; x++)
                {
                    Vector2 center = new Vector2(32, 32);
                    Vector2 pos = new Vector2(x, y);
                    Vector2 toPos = pos - center;
                    float dist = toPos.magnitude;
                    float angle = Mathf.Atan2(toPos.y, toPos.x) * Mathf.Rad2Deg;
                    bool inTriangle = dist < 28 && angle > -150 && angle < 150 &&
                                      Mathf.Abs(Mathf.Sin(angle * Mathf.Deg2Rad)) < (28 - dist) / 28 * 1.5f;
                    shipPixels[y * 64 + x] = inTriangle ? COLOR_ACCENT2 : Color.clear;
                }
            }
            shipTex.SetPixels(shipPixels);
            shipTex.Apply();
            shipRenderer.sprite = Sprite.Create(shipTex, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f), 64f);
            shipRenderer.sortingOrder = 20;

            var shipCol = shipObj.AddComponent<CircleCollider2D>();
            shipCol.radius = 0.4f;
            shipCol.isTrigger = true;

            return shipObj;
        }

        private LineRenderer CreateRouteLineRenderer()
        {
            var routeObj = new GameObject("RouteLineRenderer");
            routeObj.transform.SetParent(starMapRoot.transform, false);

            var line = routeObj.AddComponent<LineRenderer>();
            line.useWorldSpace = false;
            line.startWidth = 0.2f;
            line.endWidth = 0.2f;
            line.material = new Material(Shader.Find("Sprites/Default"));
            line.sortingOrder = 10;

            var gradient = new Gradient();
            gradient.SetKeys(
                new[] { new GradientColorKey(new Color(0.2f, 0.7f, 1f), 0f), new GradientColorKey(new Color(0.8f, 0.4f, 1f), 1f) },
                new[] { new GradientAlphaKey(0.9f, 0f), new GradientAlphaKey(0.9f, 1f) }
            );
            line.colorGradient = gradient;
            line.positionCount = 0;

            return line;
        }

        private void InitializeSystems()
        {
            if (GameManager.Instance == null)
            {
                var gmObj = new GameObject("[GameManager]");
                gameManager = gmObj.AddComponent<GameManager>();
            }
            else
            {
                gameManager = GameManager.Instance;
            }

            if (animationController == null)
            {
                var animObj = new GameObject("[AnimationController]");
                animationController = animObj.AddComponent<AnimationController>();
            }
        }

        private void SetupUIConnections()
        {
            uiManager = GameManager.Instance?.GetModule<UIManager>(ModuleType.UIManager);
            if (uiManager == null) return;

            uiManager.rootCanvas = mainCanvas;
            uiManager.scaler = mainCanvasScaler;
            uiManager.notificationToast = notificationToast;

            if (mainMenuPanel != null)
            {
                uiManager.RegisterPanel("MainMenu", mainMenuPanel);
                uiManager.mainMenuPanel = mainMenuPanel;

                mainMenuPanel.OnStartLevelSelected += HandleStartLevel;
                mainMenuPanel.OnContinueClicked += HandleContinueGame;
                mainMenuPanel.OnSettingsClicked += () => uiManager.OpenPanel("Settings");
                mainMenuPanel.OnQuitClicked += HandleQuitGame;
            }

            if (hudPanel != null)
            {
                uiManager.RegisterPanel("HUD", hudPanel);
                uiManager.hudPanel = hudPanel;

                hudPanel.OnConfirmRouteClicked += HandleConfirmRoute;
                hudPanel.OnRefuelClicked += HandleRefuel;
                hudPanel.OnContractsClicked += () => uiManager.OpenPanel("Contract");
                hudPanel.OnPauseClicked += () => uiManager.OpenPanel("Settings");
                hudPanel.OnMenuClicked += HandleReturnToMenu;
            }

            if (contractPanel != null)
            {
                uiManager.RegisterPanel("Contract", contractPanel);
                uiManager.contractPanel = contractPanel;

                contractPanel.OnContractAccepted += HandleAcceptContract;
            }

            if (eventCardPanel != null)
            {
                uiManager.RegisterPanel("EventCard", eventCardPanel);
                uiManager.eventCardPanel = eventCardPanel;
                eventCardPanel.OnContinueClicked += HandleEventContinue;
            }

            if (resultPanel != null)
            {
                uiManager.RegisterPanel("Result", resultPanel);
                uiManager.resultPanel = resultPanel;
                resultPanel.notificationToast = notificationToast;

                resultPanel.OnRetryClicked += () => StartLevel(currentLevelId);
                resultPanel.OnReturnToMenuClicked += HandleReturnToMenu;
            }

            if (settingsPanel != null)
            {
                uiManager.RegisterPanel("Settings", settingsPanel);
                uiManager.settingsPanel = settingsPanel;
            }

            SubscribeGameEvents();
        }

        private void SubscribeGameEvents()
        {
            EventBus.Subscribe<GameEvents.EventCardDrawn>(OnEventCardDrawn);
            EventBus.Subscribe<GameEvents.GameEnded>(OnGameEnded);
            EventBus.Subscribe<GameEvents.NodeSelected>(OnNodeSelected);
        }

        private void ShowMainMenu()
        {
            uiManager?.ShowMainMenu();
        }

        private void HandleStartLevel(int levelId)
        {
            StartLevel(levelId);
        }

        private void HandleContinueGame()
        {
            var saveManager = GameManager.Instance?.GetModule<SaveManager>(ModuleType.SaveManager);
            if (saveManager != null && saveManager.LoadGame(0))
            {
                EnterGameplay();
                isGameStarted = true;
                GameManager.Instance?.ResumeGame();
            }
        }

        private void HandleQuitGame()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }

        private void StartLevel(int levelId)
        {
            currentLevelId = levelId;
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            turnManager = GameManager.Instance?.GetModule<TurnManager>(ModuleType.TurnManager);
            fuelManager = GameManager.Instance?.GetModule<FuelManager>(ModuleType.FuelManager);
            reputationManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);
            eventManager = GameManager.Instance?.GetModule<EventManager>(ModuleType.EventManager);
            playRecorder = GameManager.Instance?.GetModule<PlayRecorder>(ModuleType.PlayRecorder);

            if (dataManager == null) return;

            if (!dataManager.LoadLevel(levelId))
            {
                notificationToast?.Show("关卡加载失败", false);
                return;
            }

            GameManager.Instance?.StartGame(levelId);
            EnterGameplay();
            isGameStarted = true;
        }

        private void EnterGameplay()
        {
            SetupStarMap();
            SetupGameplayController();

            uiManager?.ShowHUD();
            hudPanel?.RefreshAll();

            if (starMapController != null)
            {
                starMapController.PanToNode(dataManager.RuntimeData.Ship.CurrentNodeId);
            }

            notificationToast?.Show("任务开始！完成医疗物资运输即可获得胜利", true);
        }

        private void SetupStarMap()
        {
            if (starMapController == null)
            {
                var mapObj = new GameObject("StarMapController");
                starMapController = mapObj.AddComponent<StarMapController>();
            }

            var nodesContainerObj = new GameObject("NodesContainer");
            nodesContainerObj.transform.SetParent(starMapRoot.transform, false);
            var connectionsContainerObj = new GameObject("ConnectionsContainer");
            connectionsContainerObj.transform.SetParent(starMapRoot.transform, false);

            starMapController.nodesContainer = nodesContainerObj.transform;
            starMapController.connectionsContainer = connectionsContainerObj.transform;
            starMapController.starNodePrefab = starNodePrefab;
            starMapController.connectionPrefab = connectionPrefab;
            starMapController.shipTransform = shipObject?.transform;
            starMapController.routeLineRenderer = routeLineRenderer;

            starMapController.Initialize();
            starMapController.SetGameplayController(gameplayController);
            starMapController.BuildStarMap();

            starMapController.OnFeedbackMessage += (msg, ok) =>
            {
                hudPanel?.ShowFeedback(msg, ok);
                notificationToast?.Show(msg, ok);
            };

            starMapController.OnNodeSelected += (nodeId) =>
            {
                hudPanel?.UpdateRoutePreview(
                    nodeId,
                    starMapController.GetPreviewRouteFuelCost(),
                    starMapController.GetPreviewRouteFuelCost() <= (fuelManager?.CurrentFuel ?? 0)
                );
            };

            starMapController.OnShipArrivedNode += (nodeId) =>
            {
                hudPanel?.RefreshAll();
                eventManager?.SetGameplayController(gameplayController);
            };
        }

        private void SetupGameplayController()
        {
            if (gameplayController == null)
            {
                var gpObj = new GameObject("GameplayController");
                gameplayController = gpObj.AddComponent<GameplayController>();
            }

            gameplayController.Initialize();
            eventManager?.SetGameplayController(gameplayController);

            gameplayController.OnFeedbackMessage += (msg, ok) =>
            {
                hudPanel?.ShowFeedback(msg, ok);
                notificationToast?.Show(msg, ok, 2.5f);
            };

            gameplayController.OnShipArrived += (from, to) => hudPanel?.RefreshAll();
        }

        private void HandleConfirmRoute()
        {
            if (starMapController == null) return;
            bool success = starMapController.ExecutePreviewRoute();
            if (!success)
            {
                hudPanel?.ShowFeedback("请先在星图上选择目标节点", false);
            }
            else
            {
                hudPanel?.UpdateRoutePreview(-1, 0, false);
            }
        }

        private void HandleRefuel()
        {
            if (gameplayController == null) return;
            int amount = 25;
            gameplayController.RecordCriticalChoice("Refuel", $"加油{amount}单位");
            gameplayController.RefuelAtStation(amount);
            hudPanel?.RefreshAll();
        }

        private void HandleAcceptContract(int contractId)
        {
            if (gameplayController == null) return;
            gameplayController.RecordCriticalChoice("AcceptContract", $"合同ID:{contractId}");
            bool success = gameplayController.AcceptNewContract(contractId);
            hudPanel?.RefreshAll();
            if (success)
            {
                notificationToast?.Show("合同已接受", true);
            }
            else
            {
                notificationToast?.Show("合同接受失败", false);
            }
        }

        private void OnEventCardDrawn(GameEvents.EventCardDrawn e)
        {
            if (eventManager == null || eventCardPanel == null) return;

            uiManager?.OpenPanel("EventCard");
            eventCardPanel.DisplayEvent(eventManager.CurrentEvent);

            gameplayController?.RecordCriticalChoice(
                $"EventDraw_{e.EventId}",
                $"事件:{e.Title}");
        }

        private void HandleEventContinue()
        {
            hudPanel?.RefreshAll();
            gameplayController?.CheckGameOver();
        }

        private void OnGameEnded(GameEvents.GameEnded e)
        {
            if (resultPanel == null) return;

            uiManager?.OpenPanel("Result");
            resultPanel.DisplayResult(e.IsVictory, e.Reason, e.Score);

            audioManager = GameManager.Instance?.GetModule<AudioManager>(ModuleType.AudioManager);
            if (audioManager != null)
            {
                audioManager.PlaySfx(e.IsVictory ? SfxType.Game_Victory : SfxType.Game_Defeat);
            }
        }

        private void OnNodeSelected(GameEvents.NodeSelected e)
        {
            audioManager = GameManager.Instance?.GetModule<AudioManager>(ModuleType.AudioManager);
            audioManager?.PlaySfx(SfxType.Node_Select);
        }

        private void HandleReturnToMenu()
        {
            GameManager.Instance?.ReturnToMenu();
            uiManager?.ShowMainMenu();
            isGameStarted = false;
        }

        private void OnApplicationPause(bool pause)
        {
            if (pause && isGameStarted)
            {
                var saveManager = GameManager.Instance?.GetModule<SaveManager>(ModuleType.SaveManager);
                saveManager?.SaveGame(0);
            }
        }

        private void OnApplicationQuit()
        {
            if (isGameStarted)
            {
                var saveManager = GameManager.Instance?.GetModule<SaveManager>(ModuleType.SaveManager);
                saveManager?.SaveGame(0);
            }
            EventBus.Unsubscribe<GameEvents.EventCardDrawn>(OnEventCardDrawn);
            EventBus.Unsubscribe<GameEvents.GameEnded>(OnGameEnded);
            EventBus.Unsubscribe<GameEvents.NodeSelected>(OnNodeSelected);
        }

        private TMP_FontAsset GetDefaultFont()
        {
            if (cachedFont != null) return cachedFont;

            var allFonts = Resources.FindObjectsOfTypeAll<TMP_FontAsset>();
            if (allFonts != null && allFonts.Length > 0)
            {
                cachedFont = allFonts[0];
            }
            else
            {
                cachedFont = TMP_Settings.defaultFontAsset;
            }
            return cachedFont;
        }

        private Color GetDifficultyColor(DataDiff diff)
        {
            switch (diff)
            {
                case DataDiff.Tutorial: return new Color(0.8f, 0.7f, 1f);
                case DataDiff.Easy: return new Color(0.3f, 0.9f, 0.5f);
                case DataDiff.Normal: return new Color(0.5f, 0.8f, 1f);
                case DataDiff.Hard: return new Color(1f, 0.7f, 0.2f);
                case DataDiff.Expert: return new Color(1f, 0.3f, 0.3f);
                default: return Color.gray;
            }
        }

        private string GetDifficultyName(DataDiff diff)
        {
            switch (diff)
            {
                case DataDiff.Tutorial: return "教程";
                case DataDiff.Easy: return "简单";
                case DataDiff.Normal: return "普通";
                case DataDiff.Hard: return "困难";
                case DataDiff.Expert: return "专家";
                default: return "未知";
            }
        }

        private Button CreateButton(Transform parent, string name, string text, Vector2 size, Vector2 anchoredPos, Color? bgColor = null, Color? textColor = null, int fontSize = 20)
        {
            var btnObj = new GameObject(name, typeof(RectTransform));
            btnObj.transform.SetParent(parent, false);
            var btnRt = btnObj.GetComponent<RectTransform>();
            btnRt.sizeDelta = size;
            btnRt.anchoredPosition = anchoredPos;

            var btnImage = btnObj.AddComponent<Image>();
            btnImage.color = bgColor ?? COLOR_ACCENT;
            btnImage.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            btnImage.type = Image.Type.Sliced;

            var btn = btnObj.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = bgColor ?? COLOR_ACCENT;
            colors.highlightedColor = Color.Lerp(bgColor ?? COLOR_ACCENT, Color.white, 0.2f);
            colors.pressedColor = Color.Lerp(bgColor ?? COLOR_ACCENT, Color.black, 0.3f);
            colors.selectedColor = colors.highlightedColor;
            btn.colors = colors;

            var textObj = new GameObject("Text", typeof(RectTransform));
            textObj.transform.SetParent(btnObj.transform, false);
            var textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.color = textColor ?? Color.white;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.font = GetDefaultFont();

            return btn;
        }

        private TextMeshProUGUI CreateText(Transform parent, string name, string text, Vector2 size, Vector2 anchoredPos, int fontSize = 18, Color? color = null, TextAlignmentOptions align = TextAlignmentOptions.Center)
        {
            var obj = new GameObject(name, typeof(RectTransform));
            obj.transform.SetParent(parent, false);
            var rt = obj.GetComponent<RectTransform>();
            rt.sizeDelta = size;
            rt.anchoredPosition = anchoredPos;

            var tmp = obj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.color = color ?? Color.white;
            tmp.alignment = align;
            tmp.font = GetDefaultFont();
            tmp.enableWordWrapping = true;

            return tmp;
        }

        private Image CreateImage(Transform parent, string name, Vector2 size, Vector2 anchoredPos, Color? color = null, Sprite sprite = null)
        {
            var obj = new GameObject(name, typeof(RectTransform));
            obj.transform.SetParent(parent, false);
            var rt = obj.GetComponent<RectTransform>();
            rt.sizeDelta = size;
            rt.anchoredPosition = anchoredPos;

            var img = obj.AddComponent<Image>();
            img.color = color ?? Color.white;
            if (sprite != null)
            {
                img.sprite = sprite;
            }
            else
            {
                img.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            }

            return img;
        }

        private Slider CreateSlider(Transform parent, string name, Vector2 size, Vector2 anchoredPos, float min = 0, float max = 100, float value = 0)
        {
            var sliderObj = new GameObject(name, typeof(RectTransform));
            sliderObj.transform.SetParent(parent, false);
            var sliderRt = sliderObj.GetComponent<RectTransform>();
            sliderRt.sizeDelta = size;
            sliderRt.anchoredPosition = anchoredPos;

            var bgObj = new GameObject("Background", typeof(RectTransform));
            bgObj.transform.SetParent(sliderObj.transform, false);
            var bgRt = bgObj.GetComponent<RectTransform>();
            bgRt.anchorMin = new Vector2(0, 0.25f);
            bgRt.anchorMax = new Vector2(1, 0.75f);
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;
            var bgImg = bgObj.AddComponent<Image>();
            bgImg.color = new Color(0.15f, 0.18f, 0.25f);
            bgImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var fillAreaObj = new GameObject("FillArea", typeof(RectTransform));
            fillAreaObj.transform.SetParent(sliderObj.transform, false);
            var fillAreaRt = fillAreaObj.GetComponent<RectTransform>();
            fillAreaRt.anchorMin = new Vector2(0, 0.25f);
            fillAreaRt.anchorMax = new Vector2(1, 0.75f);
            fillAreaRt.offsetMin = new Vector2(2, 0);
            fillAreaRt.offsetMax = new Vector2(-2, 0);

            var fillObj = new GameObject("Fill", typeof(RectTransform));
            fillObj.transform.SetParent(fillAreaObj.transform, false);
            var fillRt = fillObj.GetComponent<RectTransform>();
            fillRt.anchorMin = new Vector2(0, 0);
            fillRt.anchorMax = new Vector2(1, 1);
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;
            var fillImg = fillObj.AddComponent<Image>();
            fillImg.color = COLOR_ACCENT;
            fillImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var handleAreaObj = new GameObject("HandleSlideArea", typeof(RectTransform));
            handleAreaObj.transform.SetParent(sliderObj.transform, false);
            var handleAreaRt = handleAreaObj.GetComponent<RectTransform>();
            handleAreaRt.anchorMin = new Vector2(0, 0);
            handleAreaRt.anchorMax = new Vector2(1, 1);
            handleAreaRt.offsetMin = new Vector2(10, 0);
            handleAreaRt.offsetMax = new Vector2(-10, 0);

            var handleObj = new GameObject("Handle", typeof(RectTransform));
            handleObj.transform.SetParent(handleAreaObj.transform, false);
            var handleRt = handleObj.GetComponent<RectTransform>();
            handleRt.sizeDelta = new Vector2(16, size.y + 10);
            var handleImg = handleObj.AddComponent<Image>();
            handleImg.color = Color.white;
            handleImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var slider = sliderObj.AddComponent<Slider>();
            slider.fillRect = fillRt;
            slider.handleRect = handleRt;
            slider.targetGraphic = handleImg;
            slider.minValue = min;
            slider.maxValue = max;
            slider.value = value;
            slider.direction = Slider.Direction.LeftToRight;

            return slider;
        }

        private Toggle CreateToggle(Transform parent, string name, string labelText, Vector2 size, Vector2 anchoredPos, bool defaultValue = false)
        {
            var toggleObj = new GameObject(name, typeof(RectTransform));
            toggleObj.transform.SetParent(parent, false);
            var toggleRt = toggleObj.GetComponent<RectTransform>();
            toggleRt.sizeDelta = size;
            toggleRt.anchoredPosition = anchoredPos;

            var bgObj = new GameObject("Background", typeof(RectTransform));
            bgObj.transform.SetParent(toggleObj.transform, false);
            var bgRt = bgObj.GetComponent<RectTransform>();
            bgRt.anchorMin = new Vector2(0, 0.5f);
            bgRt.anchorMax = new Vector2(0, 0.5f);
            bgRt.pivot = new Vector2(0, 0.5f);
            bgRt.sizeDelta = new Vector2(size.y, size.y);
            bgRt.anchoredPosition = Vector2.zero;
            var bgImg = bgObj.AddComponent<Image>();
            bgImg.color = new Color(0.2f, 0.25f, 0.35f);
            bgImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var checkmarkObj = new GameObject("Checkmark", typeof(RectTransform));
            checkmarkObj.transform.SetParent(bgObj.transform, false);
            var checkRt = checkmarkObj.GetComponent<RectTransform>();
            checkRt.anchorMin = new Vector2(0.2f, 0.2f);
            checkRt.anchorMax = new Vector2(0.8f, 0.8f);
            checkRt.offsetMin = Vector2.zero;
            checkRt.offsetMax = Vector2.zero;
            var checkImg = checkmarkObj.AddComponent<Image>();
            checkImg.color = COLOR_ACCENT;
            checkImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var labelObj = new GameObject("Label", typeof(RectTransform));
            labelObj.transform.SetParent(toggleObj.transform, false);
            var labelRt = labelObj.GetComponent<RectTransform>();
            labelRt.anchorMin = new Vector2(0, 0);
            labelRt.anchorMax = new Vector2(1, 1);
            labelRt.offsetMin = new Vector2(size.y + 12, 0);
            labelRt.offsetMax = Vector2.zero;
            var labelTmp = labelObj.AddComponent<TextMeshProUGUI>();
            labelTmp.text = labelText;
            labelTmp.fontSize = 16;
            labelTmp.color = Color.white;
            labelTmp.alignment = TextAlignmentOptions.Left | TextAlignmentOptions.Midline;
            labelTmp.font = GetDefaultFont();

            var toggle = toggleObj.AddComponent<Toggle>();
            toggle.graphic = checkImg;
            toggle.isOn = defaultValue;
            toggle.targetGraphic = bgImg;
            var toggleColors = toggle.colors;
            toggleColors.normalColor = new Color(0.2f, 0.25f, 0.35f);
            toggleColors.highlightedColor = new Color(0.3f, 0.35f, 0.45f);
            toggle.colors = toggleColors;

            return toggle;
        }

        private TMP_Dropdown CreateTMPDropdown(Transform parent, string name, Vector2 size, Vector2 anchoredPos)
        {
            var ddObj = new GameObject(name, typeof(RectTransform));
            ddObj.transform.SetParent(parent, false);
            var ddRt = ddObj.GetComponent<RectTransform>();
            ddRt.sizeDelta = size;
            ddRt.anchoredPosition = anchoredPos;

            var ddImg = ddObj.AddComponent<Image>();
            ddImg.color = new Color(0.2f, 0.25f, 0.35f);
            ddImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            ddImg.type = Image.Type.Sliced;

            var dd = ddObj.AddComponent<TMP_Dropdown>();
            dd.targetGraphic = ddImg;

            dd.itemText = null;
            dd.captionText = null;
            dd.options = new List<TMP_Dropdown.OptionData>();

            var captionObj = new GameObject("Caption", typeof(RectTransform));
            var captionRt = captionObj.AddComponent<RectTransform>();
            captionRt.SetParent(ddRt, false);
            captionRt.anchorMin = new Vector2(0, 0);
            captionRt.anchorMax = new Vector2(1, 1);
            captionRt.offsetMin = new Vector2(10, 2);
            captionRt.offsetMax = new Vector2(-30, -2);
            var captionTmp = captionObj.AddComponent<TextMeshProUGUI>();
            captionTmp.text = "选项";
            captionTmp.fontSize = 16;
            captionTmp.color = Color.white;
            captionTmp.alignment = TextAlignmentOptions.Left | TextAlignmentOptions.Midline;
            captionTmp.font = GetDefaultFont();
            dd.captionText = captionTmp;

            var arrowObj = new GameObject("Arrow", typeof(RectTransform));
            var arrowRt = arrowObj.GetComponent<RectTransform>();
            arrowRt.SetParent(ddRt, false);
            arrowRt.anchorMin = new Vector2(1, 0.5f);
            arrowRt.anchorMax = new Vector2(1, 0.5f);
            arrowRt.pivot = new Vector2(1, 0.5f);
            arrowRt.sizeDelta = new Vector2(16, 16);
            arrowRt.anchoredPosition = new Vector2(-8, 0);
            var arrowImg = arrowObj.AddComponent<Image>();
            arrowImg.color = Color.white;
            arrowImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var templateObj = new GameObject("Template", typeof(RectTransform));
            var templateRt = templateObj.AddComponent<RectTransform>();
            templateRt.SetParent(ddRt, false);
            templateRt.anchorMin = new Vector2(0, 0);
            templateRt.anchorMax = new Vector2(1, 0);
            templateRt.pivot = new Vector2(0.5f, 1);
            templateRt.sizeDelta = new Vector2(0, 150);
            templateRt.anchoredPosition = new Vector2(0, 0);
            var templateImg = templateObj.AddComponent<Image>();
            templateImg.color = new Color(0.15f, 0.18f, 0.25f);
            templateImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var viewportObj = new GameObject("Viewport", typeof(RectTransform));
            var viewportRt = viewportObj.AddComponent<RectTransform>();
            viewportRt.SetParent(templateRt, false);
            viewportRt.anchorMin = new Vector2(0, 0);
            viewportRt.anchorMax = new Vector2(1, 1);
            viewportRt.offsetMin = new Vector2(8, 8);
            viewportRt.offsetMax = new Vector2(-8, -8);
            var viewportImg = viewportObj.AddComponent<Image>();
            viewportImg.color = new Color(0, 0, 0, 0.5f);

            var contentObj = new GameObject("Content", typeof(RectTransform));
            var contentRt = contentObj.AddComponent<RectTransform>();
            contentRt.SetParent(viewportRt, false);
            contentRt.anchorMin = new Vector2(0, 1);
            contentRt.anchorMax = new Vector2(1, 1);
            contentRt.pivot = new Vector2(0.5f, 1);
            contentRt.sizeDelta = new Vector2(0, 30);

            var itemObj = new GameObject("Item", typeof(RectTransform));
            var itemRt = itemObj.AddComponent<RectTransform>();
            itemRt.SetParent(contentRt, false);
            itemRt.anchorMin = new Vector2(0, 0.5f);
            itemRt.anchorMax = new Vector2(1, 0.5f);
            itemRt.pivot = new Vector2(0.5f, 0.5f);
            itemRt.sizeDelta = new Vector2(0, 30);

            var itemToggle = itemObj.AddComponent<Toggle>();
            var itemBg = itemObj.AddComponent<Image>();
            itemBg.color = new Color(0, 0, 0, 0);
            itemToggle.targetGraphic = itemBg;
            itemToggle.isOn = true;

            var itemLabelObj = new GameObject("ItemLabel", typeof(RectTransform));
            var itemLabelRt = itemLabelObj.AddComponent<RectTransform>();
            itemLabelRt.SetParent(itemRt, false);
            itemLabelRt.anchorMin = new Vector2(0, 0);
            itemLabelRt.anchorMax = new Vector2(1, 1);
            itemLabelRt.offsetMin = new Vector2(20, 0);
            itemLabelRt.offsetMax = new Vector2(-10, 0);
            var itemLabelTmp = itemLabelObj.AddComponent<TextMeshProUGUI>();
            itemLabelTmp.text = "选项";
            itemLabelTmp.fontSize = 16;
            itemLabelTmp.color = Color.white;
            itemLabelTmp.alignment = TextAlignmentOptions.Left | TextAlignmentOptions.Midline;
            itemLabelTmp.font = GetDefaultFont();
            dd.itemText = itemLabelTmp;

            var itemCheckmarkObj = new GameObject("ItemCheckmark", typeof(RectTransform));
            var itemCheckmarkRt = itemCheckmarkObj.AddComponent<RectTransform>();
            itemCheckmarkRt.SetParent(itemRt, false);
            itemCheckmarkRt.anchorMin = new Vector2(0, 0.5f);
            itemCheckmarkRt.anchorMax = new Vector2(0, 0.5f);
            itemCheckmarkRt.pivot = new Vector2(0, 0.5f);
            itemCheckmarkRt.sizeDelta = new Vector2(20, 20);
            itemCheckmarkRt.anchoredPosition = new Vector2(8, 0);
            var itemCheckmarkImg = itemCheckmarkObj.AddComponent<Image>();
            itemCheckmarkImg.color = COLOR_ACCENT;
            itemToggle.graphic = itemCheckmarkImg;

            dd.template = templateRt;
            templateObj.SetActive(false);

            return dd;
        }

        private void SetupPanelBase(UIPanelBase panel, RectTransform rootRect, Vector2 size)
        {
            panel.panelRect = rootRect;
            rootRect.sizeDelta = size;
            rootRect.anchorMin = new Vector2(0.5f, 0.5f);
            rootRect.anchorMax = new Vector2(0.5f, 0.5f);
            rootRect.pivot = new Vector2(0.5f, 0.5f);
            rootRect.anchoredPosition = Vector2.zero;

            var cg = panel.gameObject.GetComponent<CanvasGroup>();
            if (cg == null) cg = panel.gameObject.AddComponent<CanvasGroup>();
            panel.canvasGroup = cg;
            cg.alpha = 0f;
            cg.blocksRaycasts = false;
            cg.interactable = false;

            panel.gameObject.SetActive(false);
        }

        private NotificationToast CreateNotificationToast()
        {
            var toastObj = new GameObject("NotificationToast", typeof(RectTransform));
            toastObj.transform.SetParent(mainCanvas.transform, false);
            var toastRt = toastObj.GetComponent<RectTransform>();
            toastRt.anchorMin = new Vector2(0.5f, 1f);
            toastRt.anchorMax = new Vector2(0.5f, 1f);
            toastRt.pivot = new Vector2(0.5f, 1f);
            toastRt.sizeDelta = new Vector2(600, 80);
            toastRt.anchoredPosition = new Vector2(0, -30);

            var bgImg = toastObj.AddComponent<Image>();
            bgImg.color = new Color(0.15f, 0.5f, 0.2f, 0.9f);
            bgImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            bgImg.type = Image.Type.Sliced;

            var textObj = new GameObject("MessageText", typeof(RectTransform));
            textObj.transform.SetParent(toastObj.transform, false);
            var textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(20, 0);
            textRt.offsetMax = new Vector2(-20, 0);
            var msgTmp = textObj.AddComponent<TextMeshProUGUI>();
            msgTmp.text = "";
            msgTmp.fontSize = 20;
            msgTmp.color = Color.white;
            msgTmp.alignment = TextAlignmentOptions.Center;
            msgTmp.font = GetDefaultFont();

            var cg = toastObj.AddComponent<CanvasGroup>();
            cg.alpha = 0f;
            cg.blocksRaycasts = false;
            cg.interactable = false;

            var toast = toastObj.AddComponent<NotificationToast>();
            toast.canvasGroup = cg;
            toast.messageText = msgTmp;
            toast.backgroundImage = bgImg;
            toast.toastRect = toastRt;

            toastObj.SetActive(false);

            return toast;
        }

        private MainMenuPanel CreateMainMenuPanel()
        {
            var panelObj = new GameObject("MainMenuPanel", typeof(RectTransform));
            panelObj.transform.SetParent(mainCanvas.transform, false);
            var panelRt = panelObj.GetComponent<RectTransform>();

            var bgImg = CreateImage(panelRt, "PanelBG", Vector2.zero, Vector2.zero, COLOR_PANEL_BG);
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;

            var panel = panelObj.AddComponent<MainMenuPanel>();
            SetupPanelBase(panel, panelRt, new Vector2(900, 700));

            var title = CreateText(panelRt, "TitleText", "🚀 星际速递", new Vector2(800, 80), new Vector2(0, 280), 56, COLOR_ACCENT);
            title.fontStyle = FontStyles.Bold;
            panel.titleText = title;

            var subtitle = CreateText(panelRt, "SubtitleText", "Space Courier", new Vector2(600, 40), new Vector2(0, 220), 28, COLOR_ACCENT2);
            panel.subtitleText = subtitle;
            panel.logoTransform = title.rectTransform;

            var startBtn = CreateButton(panelRt, "StartButton", "🎮 开始游戏", new Vector2(400, 70), new Vector2(0, 80), COLOR_ACCENT, Color.white, 26);
            panel.startButton = startBtn;

            var continueBtn = CreateButton(panelRt, "ContinueButton", "📂 继续游戏", new Vector2(400, 70), new Vector2(0, -10), new Color(0.3f, 0.5f, 0.8f), Color.white, 24);
            panel.continueButton = continueBtn;

            var settingsBtn = CreateButton(panelRt, "SettingsButton", "⚙️ 设置", new Vector2(400, 70), new Vector2(0, -100), new Color(0.3f, 0.35f, 0.5f), Color.white, 24);
            panel.settingsButton = settingsBtn;

            var quitBtn = CreateButton(panelRt, "QuitButton", "🚪 退出游戏", new Vector2(400, 70), new Vector2(0, -190), COLOR_RED, Color.white, 24);
            panel.quitButton = quitBtn;

            var levelSelectObj = new GameObject("LevelSelectContainer", typeof(RectTransform));
            levelSelectObj.transform.SetParent(panelRt, false);
            var lsRt = levelSelectObj.GetComponent<RectTransform>();
            lsRt.anchorMin = Vector2.zero;
            lsRt.anchorMax = Vector2.one;
            lsRt.offsetMin = Vector2.zero;
            lsRt.offsetMax = Vector2.zero;
            var lsBg = levelSelectObj.AddComponent<Image>();
            lsBg.color = COLOR_PANEL_BG;
            lsBg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            panel.levelSelectContainer = levelSelectObj;

            var lsTitle = CreateText(lsRt, "LSTitle", "选择关卡", new Vector2(400, 50), new Vector2(0, 280), 36, COLOR_ACCENT2);

            var lsContainerObj = new GameObject("LevelButtonContainer", typeof(RectTransform));
            lsContainerObj.transform.SetParent(lsRt, false);
            var lsContainerRt = lsContainerObj.GetComponent<RectTransform>();
            lsContainerRt.sizeDelta = new Vector2(700, 400);
            lsContainerRt.anchoredPosition = new Vector2(0, 30);
            panel.levelButtonContainer = lsContainerRt;

            levelButtonPrefab = CreateLevelButtonPrefab();
            panel.levelButtonPrefab = levelButtonPrefab;

            var lsBackBtn = CreateButton(lsRt, "LSBackButton", "← 返回", new Vector2(200, 60), new Vector2(0, -250), new Color(0.4f, 0.4f, 0.5f), Color.white, 20);
            panel.levelSelectBackButton = lsBackBtn;

            levelSelectObj.SetActive(false);

            panel.backgroundImage = bgImg;

            return panel;
        }

        private LevelButtonItem CreateLevelButtonPrefab()
        {
            var prefabObj = new GameObject("LevelButtonPrefab", typeof(RectTransform));
            prefabObj.transform.SetParent(mainCanvas.transform, false);
            prefabObj.SetActive(false);
            var prefabRt = prefabObj.GetComponent<RectTransform>();
            prefabRt.sizeDelta = new Vector2(680, 100);

            var bgImg = CreateImage(prefabRt, "BG", new Vector2(680, 100), Vector2.zero, new Color(0.15f, 0.25f, 0.35f, 0.9f));
            bgImg.rectTransform.anchorMin = Vector2.zero;
            bgImg.rectTransform.anchorMax = Vector2.one;
            bgImg.rectTransform.offsetMin = Vector2.zero;
            bgImg.rectTransform.offsetMax = Vector2.zero;

            var nameText = CreateText(prefabRt, "Name", "贸易走廊", new Vector2(400, 40), new Vector2(-130, 20), 24, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var descText = CreateText(prefabRt, "Desc", "新手教程任务", new Vector2(400, 30), new Vector2(-130, -20), 16, new Color(0.7f, 0.7f, 0.7f), TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var diffText = CreateText(prefabRt, "Diff", "教程", new Vector2(100, 40), new Vector2(270, 0), 20, new Color(0.8f, 0.7f, 1f), TextAlignmentOptions.Center);

            var diffIcon = CreateImage(prefabRt, "DiffIcon", new Vector2(20, 20), new Vector2(200, 0), new Color(0.8f, 0.7f, 1f));
            var lockIcon = CreateImage(prefabRt, "LockIcon", new Vector2(40, 40), new Vector2(-300, 0), new Color(0.5f, 0.5f, 0.5f));

            var btn = prefabObj.AddComponent<Button>();
            btn.targetGraphic = bgImg;
            var btnColors = btn.colors;
            btnColors.normalColor = new Color(0.15f, 0.25f, 0.35f, 0.9f);
            btnColors.highlightedColor = new Color(0.25f, 0.35f, 0.5f, 0.9f);
            btnColors.pressedColor = new Color(0.1f, 0.2f, 0.3f, 0.9f);
            btn.colors = btnColors;

            var item = prefabObj.AddComponent<LevelButtonItem>();
            item.button = btn;
            item.backgroundImage = bgImg;
            item.levelNameText = nameText;
            item.levelDescriptionText = descText;
            item.difficultyText = diffText;
            item.difficultyIcon = diffIcon;
            item.lockIcon = lockIcon;

            return item;
        }

        private HUDPanel CreateHUDPanel()
        {
            var panelObj = new GameObject("HUDPanel", typeof(RectTransform));
            panelObj.transform.SetParent(mainCanvas.transform, false);
            var panelRt = panelObj.GetComponent<RectTransform>();
            panelRt.anchorMin = Vector2.zero;
            panelRt.anchorMax = Vector2.one;
            panelRt.offsetMin = Vector2.zero;
            panelRt.offsetMax = Vector2.zero;

            var panel = panelObj.AddComponent<HUDPanel>();
            panel.panelRect = panelRt;
            var cg = panel.gameObject.GetComponent<CanvasGroup>();
            if (cg == null) cg = panel.gameObject.AddComponent<CanvasGroup>();
            panel.canvasGroup = cg;
            cg.alpha = 0f;
            cg.blocksRaycasts = false;
            cg.interactable = false;
            panel.CloseOnPanelOpened = false;
            panel.UseAnimation = false;
            panel.gameObject.SetActive(false);

            var topBar = CreateImage(panelRt, "TopBar", Vector2.zero, Vector2.zero, new Color(0.05f, 0.08f, 0.15f, 0.95f));
            var topBarRt = topBar.rectTransform;
            topBarRt.anchorMin = new Vector2(0, 1);
            topBarRt.anchorMax = new Vector2(1, 1);
            topBarRt.pivot = new Vector2(0.5f, 1);
            topBarRt.sizeDelta = new Vector2(0, 120);
            topBarRt.anchoredPosition = Vector2.zero;

            var fuelText = CreateText(topBarRt, "FuelText", "⛽ 50 / 100", new Vector2(250, 35), new Vector2(-780, -30), 20, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            panel.fuelText = fuelText;

            var fuelSlider = CreateSlider(topBarRt, "FuelSlider", new Vector2(250, 18), new Vector2(-780, -70), 0, 100, 50);
            panel.fuelSlider = fuelSlider;
            var fuelFill = fuelSlider.fillRect.GetComponent<Image>();
            fuelFill.color = COLOR_GREEN;
            panel.fuelFillImage = fuelFill;

            var fuelWarningText = CreateText(topBarRt, "FuelWarning", "⚠️ 燃料不足！", new Vector2(200, 25), new Vector2(-780, -95), 14, COLOR_RED, TextAlignmentOptions.Left);
            fuelWarningText.gameObject.SetActive(false);
            panel.fuelWarningText = fuelWarningText;

            var creditsText = CreateText(topBarRt, "CreditsText", "💰 1000", new Vector2(180, 35), new Vector2(-450, -30), 22, COLOR_ACCENT2, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            panel.creditsText = creditsText;

            var reputationText = CreateText(topBarRt, "RepText", "⭐ 50", new Vector2(150, 35), new Vector2(-250, -30), 22, COLOR_ACCENT2, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            panel.reputationText = reputationText;

            var repBarBg = CreateImage(topBarRt, "RepBarBG", new Vector2(150, 12), new Vector2(-250, -60), new Color(0.2f, 0.2f, 0.3f));
            var repBar = CreateImage(repBarBg.rectTransform, "RepBar", new Vector2(150, 12), Vector2.zero, COLOR_GREEN);
            repBar.rectTransform.anchorMin = new Vector2(0, 0);
            repBar.rectTransform.anchorMax = new Vector2(1, 1);
            repBar.rectTransform.pivot = new Vector2(0, 0.5f);
            panel.reputationBarImage = repBar;

            var repTierText = CreateText(topBarRt, "RepTierText", "友好", new Vector2(150, 25), new Vector2(-250, -85), 14, COLOR_GREEN, TextAlignmentOptions.Left);
            panel.reputationTierText = repTierText;

            var turnText = CreateText(topBarRt, "TurnText", "回合 1 / 30", new Vector2(200, 35), new Vector2(0, -30), 20, COLOR_ACCENT, TextAlignmentOptions.Center);
            panel.turnCounterText = turnText;

            var turnsRemainText = CreateText(topBarRt, "TurnsRemain", "剩余 29", new Vector2(150, 25), new Vector2(0, -60), 16, new Color(0.7f, 0.8f, 0.9f), TextAlignmentOptions.Center);
            panel.turnsRemainingText = turnsRemainText;

            var turnSlider = CreateSlider(topBarRt, "TurnSlider", new Vector2(200, 10), new Vector2(0, -90), 0, 30, 1);
            panel.turnProgressSlider = turnSlider;

            var currentNodeText = CreateText(topBarRt, "CurrentNode", "📍 阿尔法站", new Vector2(250, 35), new Vector2(400, -30), 18, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            panel.currentNodeText = currentNodeText;

            var currentNodeTypeText = CreateText(topBarRt, "CurrentNodeType", "空间站 ⛽ 安全", new Vector2(250, 25), new Vector2(400, -60), 14, new Color(0.7f, 0.7f, 0.7f), TextAlignmentOptions.Left);
            panel.currentNodeTypeText = currentNodeTypeText;

            var contractPanelObj = new GameObject("MainContractPanel", typeof(RectTransform));
            contractPanelObj.transform.SetParent(topBarRt, false);
            var cpRt = contractPanelObj.GetComponent<RectTransform>();
            cpRt.anchorMin = new Vector2(1, 0.5f);
            cpRt.anchorMax = new Vector2(1, 0.5f);
            cpRt.pivot = new Vector2(1, 0.5f);
            cpRt.sizeDelta = new Vector2(380, 100);
            cpRt.anchoredPosition = new Vector2(-20, -10);
            var cpBg = contractPanelObj.AddComponent<Image>();
            cpBg.color = new Color(0.12f, 0.18f, 0.28f, 0.9f);
            cpBg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            panel.mainContractPanel = contractPanelObj;

            var mcTitle = CreateText(cpRt, "MCTitle", "<b>医疗物资运输</b>  ★主线", new Vector2(360, 25), new Vector2(0, 30), 18, COLOR_ACCENT2, TextAlignmentOptions.Left);
            panel.mainContractTitle = mcTitle;

            var mcDest = CreateText(cpRt, "MCDest", "目的地: 贝塔星", new Vector2(360, 20), new Vector2(0, 5), 14, new Color(0.8f, 0.8f, 0.8f), TextAlignmentOptions.Left);
            panel.mainContractDestination = mcDest;

            var mcTimeText = CreateText(cpRt, "MCTime", "⏱ 剩余 25 回合", new Vector2(180, 20), new Vector2(-90, -20), 14, Color.white, TextAlignmentOptions.Left);
            panel.mainContractTimeText = mcTimeText;

            var mcSlider = CreateSlider(cpRt, "MCSlider", new Vector2(180, 10), new Vector2(-90, -40), 0, 30, 25);
            panel.mainContractTimerSlider = mcSlider;

            var mcCargo = CreateText(cpRt, "MCCargo", "📦 医疗物资 (完整度 100%)", new Vector2(200, 20), new Vector2(90, -20), 14, Color.white, TextAlignmentOptions.Right);
            panel.mainContractCargoText = mcCargo;

            var mcReward = CreateText(cpRt, "MCReward", "奖励: 2000💰 50⭐", new Vector2(200, 20), new Vector2(90, -40), 14, COLOR_ACCENT2, TextAlignmentOptions.Right);
            panel.mainContractRewardText = mcReward;

            var bottomBar = CreateImage(panelRt, "BottomBar", Vector2.zero, Vector2.zero, new Color(0.05f, 0.08f, 0.15f, 0.95f));
            var bottomBarRt = bottomBar.rectTransform;
            bottomBarRt.anchorMin = new Vector2(0, 0);
            bottomBarRt.anchorMax = new Vector2(1, 0);
            bottomBarRt.pivot = new Vector2(0.5f, 0);
            bottomBarRt.sizeDelta = new Vector2(0, 100);
            bottomBarRt.anchoredPosition = Vector2.zero;

            var confirmRouteBtn = CreateButton(bottomBarRt, "ConfirmRouteBtn", "确认航线", new Vector2(220, 65), new Vector2(-700, 0), COLOR_ACCENT, Color.white, 22);
            panel.confirmRouteButton = confirmRouteBtn;
            confirmRouteBtn.gameObject.SetActive(false);
            var crbText = confirmRouteBtn.GetComponentInChildren<TextMeshProUGUI>();
            panel.confirmRouteButtonText = crbText;

            var refuelBtn = CreateButton(bottomBarRt, "RefuelBtn", "⛽ 加油", new Vector2(180, 65), new Vector2(-430, 0), COLOR_GREEN, Color.white, 20);
            panel.refuelButton = refuelBtn;

            var contractsBtn = CreateButton(bottomBarRt, "ContractsBtn", "📋 合同", new Vector2(180, 65), new Vector2(-200, 0), COLOR_ACCENT2, Color.black, 20);
            panel.contractsButton = contractsBtn;

            var pauseBtn = CreateButton(bottomBarRt, "PauseBtn", "⏸ 暂停", new Vector2(150, 65), new Vector2(200, 0), new Color(0.4f, 0.4f, 0.55f), Color.white, 20);
            panel.pauseButton = pauseBtn;

            var menuBtn = CreateButton(bottomBarRt, "MenuBtn", "🏠 菜单", new Vector2(150, 65), new Vector2(400, 0), new Color(0.45f, 0.35f, 0.35f), Color.white, 20);
            panel.menuButton = menuBtn;

            var routePreviewText = CreateText(bottomBarRt, "RoutePreview", "", new Vector2(400, 60), new Vector2(750, 0), 18, COLOR_ACCENT, TextAlignmentOptions.Right | TextAlignmentOptions.Midline);
            panel.routePreviewText = routePreviewText;

            var feedbackBg = CreateImage(panelRt, "FeedbackBG", new Vector2(600, 60), new Vector2(0, -200), new Color(0.1f, 0.4f, 0.2f, 0.8f));
            var feedbackRt = feedbackBg.rectTransform;
            feedbackRt.anchorMin = new Vector2(0.5f, 0.5f);
            feedbackRt.anchorMax = new Vector2(0.5f, 0.5f);
            feedbackRt.pivot = new Vector2(0.5f, 0.5f);
            feedbackBg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            panel.feedbackBackground = feedbackBg;

            var feedbackText = CreateText(feedbackRt, "FeedbackText", "", new Vector2(560, 50), Vector2.zero, 20, Color.white);
            feedbackText.rectTransform.anchorMin = Vector2.zero;
            feedbackText.rectTransform.anchorMax = Vector2.one;
            feedbackText.rectTransform.offsetMin = Vector2.zero;
            feedbackText.rectTransform.offsetMax = Vector2.zero;
            panel.feedbackText = feedbackText;

            var feedbackCG = feedbackBg.gameObject.AddComponent<CanvasGroup>();
            feedbackCG.alpha = 0f;
            feedbackCG.blocksRaycasts = false;
            feedbackCG.interactable = false;
            panel.feedbackCanvasGroup = feedbackCG;

            return panel;
        }

        private ContractPanel CreateContractPanel()
        {
            var panelObj = new GameObject("ContractPanel", typeof(RectTransform));
            panelObj.transform.SetParent(mainCanvas.transform, false);
            var panelRt = panelObj.GetComponent<RectTransform>();

            var bgImg = CreateImage(panelRt, "PanelBG", Vector2.zero, Vector2.zero, COLOR_PANEL_BG);
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;

            var panel = panelObj.AddComponent<ContractPanel>();
            SetupPanelBase(panel, panelRt, new Vector2(1150, 820));

            var title = CreateText(panelRt, "Title", "📋 合同管理", new Vector2(400, 50), new Vector2(0, 360), 36, COLOR_ACCENT2, TextAlignmentOptions.Center);

            var availableTabBtn = CreateButton(panelRt, "AvailableTab", "可接合同", new Vector2(200, 50), new Vector2(-300, 280), COLOR_ACCENT, Color.white, 18);
            panel.availableTabButton = availableTabBtn;

            var activeTabBtn = CreateButton(panelRt, "ActiveTab", "进行中", new Vector2(200, 50), new Vector2(0, 280), new Color(0.25f, 0.3f, 0.45f), Color.white, 18);
            panel.activeTabButton = activeTabBtn;

            var completedTabBtn = CreateButton(panelRt, "CompletedTab", "已完成", new Vector2(200, 50), new Vector2(300, 280), new Color(0.25f, 0.3f, 0.45f), Color.white, 18);
            panel.completedTabButton = completedTabBtn;

            var availIndicator = CreateImage(panelRt, "AvailIndicator", new Vector2(200, 5), new Vector2(-300, 248), COLOR_ACCENT);
            panel.availableTabIndicator = availIndicator;

            var activeIndicator = CreateImage(panelRt, "ActiveIndicator", new Vector2(200, 5), new Vector2(0, 248), new Color(0.25f, 0.3f, 0.45f));
            panel.activeTabIndicator = activeIndicator;

            var completedIndicator = CreateImage(panelRt, "CompletedIndicator", new Vector2(200, 5), new Vector2(300, 248), new Color(0.25f, 0.3f, 0.45f));
            panel.completedTabIndicator = completedIndicator;

            var availContainerObj = new GameObject("AvailableContainer", typeof(RectTransform));
            availContainerObj.transform.SetParent(panelRt, false);
            var availRt = availContainerObj.GetComponent<RectTransform>();
            availRt.sizeDelta = new Vector2(1050, 480);
            availRt.anchoredPosition = new Vector2(0, 0);
            panel.availableContainer = availRt;

            var activeContainerObj = new GameObject("ActiveContainer", typeof(RectTransform));
            activeContainerObj.transform.SetParent(panelRt, false);
            var activeRt = activeContainerObj.GetComponent<RectTransform>();
            activeRt.sizeDelta = new Vector2(1050, 480);
            activeRt.anchoredPosition = new Vector2(0, 0);
            panel.activeContainer = activeRt;
            activeContainerObj.SetActive(false);

            var completedContainerObj = new GameObject("CompletedContainer", typeof(RectTransform));
            completedContainerObj.transform.SetParent(panelRt, false);
            var completedRt = completedContainerObj.GetComponent<RectTransform>();
            completedRt.sizeDelta = new Vector2(1050, 480);
            completedRt.anchoredPosition = new Vector2(0, 0);
            panel.completedContainer = completedRt;
            completedContainerObj.SetActive(false);

            contractItemPrefab = CreateContractItemPrefab();
            panel.contractItemPrefab = contractItemPrefab;

            var closeBtn = CreateButton(panelRt, "CloseBtn", "✕ 关闭", new Vector2(180, 55), new Vector2(0, -350), new Color(0.45f, 0.3f, 0.3f), Color.white, 18);
            panel.closeDetailButton = closeBtn;

            var detailPanelObj = new GameObject("DetailPanel", typeof(RectTransform));
            detailPanelObj.transform.SetParent(panelRt, false);
            var detailRt = detailPanelObj.GetComponent<RectTransform>();
            detailRt.anchorMin = Vector2.zero;
            detailRt.anchorMax = Vector2.one;
            detailRt.offsetMin = Vector2.zero;
            detailRt.offsetMax = Vector2.zero;
            var detailBg = detailPanelObj.AddComponent<Image>();
            detailBg.color = new Color(0.05f, 0.07f, 0.12f, 0.98f);
            detailBg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            panel.detailPanel = detailPanelObj;

            var detailTitle = CreateText(detailRt, "DetailTitle", "合同标题", new Vector2(900, 50), new Vector2(0, 330), 30, COLOR_ACCENT2, TextAlignmentOptions.Center);
            panel.detailTitle = detailTitle;

            var detailDesc = CreateText(detailRt, "DetailDesc", "合同描述内容...", new Vector2(900, 80), new Vector2(0, 250), 18, new Color(0.85f, 0.85f, 0.85f));
            detailDesc.enableWordWrapping = true;
            panel.detailDescription = detailDesc;

            var detailCargo = CreateText(detailRt, "DetailCargo", "货物类型: 医疗物资", new Vector2(450, 35), new Vector2(-250, 150), 18, Color.white, TextAlignmentOptions.Left);
            panel.detailCargoType = detailCargo;

            var detailFromTo = CreateText(detailRt, "DetailFromTo", "路线: 站点A → 站点B", new Vector2(450, 35), new Vector2(250, 150), 18, Color.white, TextAlignmentOptions.Left);
            panel.detailFromTo = detailFromTo;

            var detailTimeLimit = CreateText(detailRt, "DetailTime", "时限: 30 / 30 回合", new Vector2(450, 35), new Vector2(-250, 90), 18, Color.white, TextAlignmentOptions.Left);
            panel.detailTimeLimit = detailTimeLimit;

            var detailReward = CreateText(detailRt, "DetailReward", "报酬: 2000 💰   50 ⭐", new Vector2(450, 35), new Vector2(250, 90), 18, COLOR_ACCENT2, TextAlignmentOptions.Left);
            panel.detailReward = detailReward;

            var detailRisk = CreateText(detailRt, "DetailRisk", "风险: 低", new Vector2(250, 35), new Vector2(-350, 30), 18, COLOR_GREEN, TextAlignmentOptions.Left);
            panel.detailRisk = detailRisk;
            var riskColorImg = CreateImage(detailRt, "RiskColor", new Vector2(24, 24), new Vector2(-510, 30), COLOR_GREEN);
            panel.detailRiskColor = riskColorImg;

            var detailIntegrity = CreateText(detailRt, "DetailIntegrity", "货物完整度: 100%", new Vector2(450, 35), new Vector2(250, 30), 18, Color.white, TextAlignmentOptions.Left);
            panel.detailCargoIntegrity = detailIntegrity;

            var acceptBtn = CreateButton(detailRt, "AcceptBtn", "✅ 接受合同", new Vector2(250, 60), new Vector2(-150, -100), COLOR_GREEN, Color.white, 20);
            panel.acceptButton = acceptBtn;

            var closeDetailBtn = CreateButton(detailRt, "CloseDetailBtn", "← 返回", new Vector2(250, 60), new Vector2(150, -100), new Color(0.4f, 0.4f, 0.5f), Color.white, 20);

            detailPanelObj.SetActive(false);

            return panel;
        }

        private ContractItemView CreateContractItemPrefab()
        {
            var prefabObj = new GameObject("ContractItemPrefab", typeof(RectTransform));
            prefabObj.transform.SetParent(mainCanvas.transform, false);
            prefabObj.SetActive(false);
            var prefabRt = prefabObj.GetComponent<RectTransform>();
            prefabRt.sizeDelta = new Vector2(1030, 90);

            var bgImg = CreateImage(prefabRt, "BG", Vector2.zero, Vector2.zero, new Color(0.15f, 0.25f, 0.35f, 0.9f));
            bgImg.rectTransform.anchorMin = Vector2.zero;
            bgImg.rectTransform.anchorMax = Vector2.one;
            bgImg.rectTransform.offsetMin = Vector2.zero;
            bgImg.rectTransform.offsetMax = Vector2.zero;

            var statusIndicator = CreateImage(prefabRt, "StatusIndicator", new Vector2(6, 90), new Vector2(-512, 0), new Color(0.5f, 0.7f, 1f));
            statusIndicator.rectTransform.anchorMin = new Vector2(0, 0.5f);
            statusIndicator.rectTransform.anchorMax = new Vector2(0, 0.5f);
            statusIndicator.rectTransform.pivot = new Vector2(0, 0.5f);

            var titleText = CreateText(prefabRt, "Title", "合同标题", new Vector2(500, 35), new Vector2(-200, 20), 20, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var destText = CreateText(prefabRt, "Destination", "→ 目的地", new Vector2(250, 25), new Vector2(-325, -20), 14, new Color(0.75f, 0.75f, 0.75f), TextAlignmentOptions.Left);
            var timerText = CreateText(prefabRt, "Timer", "⏱ 30", new Vector2(120, 35), new Vector2(50, 0), 16, Color.white, TextAlignmentOptions.Center);
            var rewardText = CreateText(prefabRt, "Reward", "1000💰 30⭐", new Vector2(200, 35), new Vector2(250, 0), 16, COLOR_ACCENT2, TextAlignmentOptions.Center);
            var cargoText = CreateText(prefabRt, "CargoType", "医疗", new Vector2(100, 35), new Vector2(420, 0), 14, new Color(0.7f, 0.8f, 0.9f), TextAlignmentOptions.Center);
            var riskIndicator = CreateImage(prefabRt, "RiskIndicator", new Vector2(16, 16), new Vector2(500, 0), COLOR_GREEN);
            var mainBadge = CreateImage(prefabRt, "MainBadge", new Vector2(20, 20), new Vector2(-500, 0), COLOR_ACCENT2);

            var itemBtn = prefabObj.AddComponent<Button>();
            itemBtn.targetGraphic = bgImg;
            var btnColors = itemBtn.colors;
            btnColors.normalColor = new Color(0.15f, 0.25f, 0.35f, 0.9f);
            btnColors.highlightedColor = new Color(0.25f, 0.35f, 0.5f, 0.9f);
            btnColors.pressedColor = new Color(0.1f, 0.2f, 0.3f, 0.9f);
            itemBtn.colors = btnColors;

            var item = prefabObj.AddComponent<ContractItemView>();
            item.backgroundImage = bgImg;
            item.statusIndicator = statusIndicator;
            item.titleText = titleText;
            item.destinationText = destText;
            item.timerText = timerText;
            item.rewardText = rewardText;
            item.cargoTypeText = cargoText;
            item.riskIndicator = riskIndicator;
            item.mainContractBadge = mainBadge;
            item.itemButton = itemBtn;

            return item;
        }

        private EventCardPanel CreateEventCardPanel()
        {
            var panelObj = new GameObject("EventCardPanel", typeof(RectTransform));
            panelObj.transform.SetParent(mainCanvas.transform, false);
            var panelRt = panelObj.GetComponent<RectTransform>();

            var bgImg = CreateImage(panelRt, "PanelBG", Vector2.zero, Vector2.zero, COLOR_PANEL_BG);
            bgImg.rectTransform.anchorMin = Vector2.zero;
            bgImg.rectTransform.anchorMax = Vector2.one;
            bgImg.rectTransform.offsetMin = Vector2.zero;
            bgImg.rectTransform.offsetMax = Vector2.zero;

            var panel = panelObj.AddComponent<EventCardPanel>();
            SetupPanelBase(panel, panelRt, new Vector2(950, 800));

            var cardBg = CreateImage(panelRt, "CardBG", new Vector2(900, 350), new Vector2(0, 180), new Color(0.1f, 0.15f, 0.28f, 1f));
            panel.cardBackground = cardBg;

            var categoryIcon = CreateImage(panelRt, "CategoryIcon", new Vector2(60, 60), new Vector2(-400, 320), COLOR_ACCENT);
            panel.eventCategoryIcon = categoryIcon;

            var eventTitle = CreateText(panelRt, "EventTitle", "事件标题", new Vector2(700, 50), new Vector2(50, 310), 30, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            eventTitle.fontStyle = FontStyles.Bold;
            panel.eventTitleText = eventTitle;

            var eventCategory = CreateText(panelRt, "EventCategory", "太空天气", new Vector2(200, 30), new Vector2(-350, 260), 16, COLOR_ACCENT, TextAlignmentOptions.Left);
            panel.eventCategoryText = eventCategory;

            var eventSeverity = CreateText(panelRt, "Severity", "中等", new Vector2(100, 25), new Vector2(350, 260), 14, COLOR_ACCENT2, TextAlignmentOptions.Right);
            panel.eventSeverityText = eventSeverity;

            var severityBadge = CreateImage(panelRt, "SeverityBadge", new Vector2(8, 25), new Vector2(410, 260), COLOR_ACCENT2);
            panel.severityBadgeImage = severityBadge;

            var eventDesc = CreateText(panelRt, "EventDesc", "事件描述内容将会显示在这里，描述事件发生的背景和情况。", new Vector2(820, 180), new Vector2(0, 110), 18, new Color(0.9f, 0.9f, 0.9f));
            eventDesc.enableWordWrapping = true;
            panel.eventDescriptionText = eventDesc;

            var eventImg = CreateImage(panelRt, "EventImage", new Vector2(200, 120), new Vector2(0, -30), new Color(0.15f, 0.25f, 0.4f));
            panel.eventImage = eventImg;

            var choicesContainerObj = new GameObject("ChoicesContainer", typeof(RectTransform));
            choicesContainerObj.transform.SetParent(panelRt, false);
            var ccRt = choicesContainerObj.GetComponent<RectTransform>();
            ccRt.sizeDelta = new Vector2(880, 260);
            ccRt.anchoredPosition = new Vector2(0, -230);
            panel.choicesContainer = ccRt;

            eventChoiceButtonPrefab = CreateEventChoiceButtonPrefab();
            panel.choiceButtonPrefab = eventChoiceButtonPrefab;

            var outcomePanelObj = new GameObject("OutcomePanel", typeof(RectTransform));
            outcomePanelObj.transform.SetParent(panelRt, false);
            var opRt = outcomePanelObj.GetComponent<RectTransform>();
            opRt.anchorMin = Vector2.zero;
            opRt.anchorMax = Vector2.one;
            opRt.offsetMin = Vector2.zero;
            opRt.offsetMax = Vector2.zero;
            var opBg = outcomePanelObj.AddComponent<Image>();
            opBg.color = new Color(0.05f, 0.08f, 0.14f, 0.98f);
            opBg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            panel.outcomePanel = outcomePanelObj;

            var outcomeIcon = CreateImage(opRt, "OutcomeIcon", new Vector2(80, 80), new Vector2(0, 280), COLOR_GREEN);
            panel.outcomeIcon = outcomeIcon;

            var outcomeTitle = CreateText(opRt, "OutcomeTitle", "✨ 好事发生！", new Vector2(700, 60), new Vector2(0, 200), 32, COLOR_GREEN, TextAlignmentOptions.Center);
            outcomeTitle.fontStyle = FontStyles.Bold;
            panel.outcomeTitleText = outcomeTitle;

            var outcomeDesc = CreateText(opRt, "OutcomeDesc", "结果描述内容", new Vector2(780, 150), new Vector2(0, 90), 20, new Color(0.9f, 0.9f, 0.9f));
            outcomeDesc.enableWordWrapping = true;
            panel.outcomeDescriptionText = outcomeDesc;

            var outcomeEffects = CreateText(opRt, "OutcomeEffects", "效果列表", new Vector2(780, 60), new Vector2(0, -20), 18, COLOR_ACCENT2, TextAlignmentOptions.Center);
            panel.outcomeEffectsText = outcomeEffects;

            var continueBtn = CreateButton(opRt, "ContinueBtn", "继续 →", new Vector2(300, 70), new Vector2(0, -200), COLOR_ACCENT, Color.white, 22);
            panel.continueButton = continueBtn;

            outcomePanelObj.SetActive(false);

            return panel;
        }

        private EventChoiceButton CreateEventChoiceButtonPrefab()
        {
            var prefabObj = new GameObject("EventChoiceButtonPrefab", typeof(RectTransform));
            prefabObj.transform.SetParent(mainCanvas.transform, false);
            prefabObj.SetActive(false);
            var prefabRt = prefabObj.GetComponent<RectTransform>();
            prefabRt.sizeDelta = new Vector2(850, 80);

            var bgImg = CreateImage(prefabRt, "BG", Vector2.zero, Vector2.zero, new Color(0.15f, 0.3f, 0.45f, 1f));
            bgImg.rectTransform.anchorMin = Vector2.zero;
            bgImg.rectTransform.anchorMax = Vector2.one;
            bgImg.rectTransform.offsetMin = Vector2.zero;
            bgImg.rectTransform.offsetMax = Vector2.zero;

            var choiceText = CreateText(prefabRt, "ChoiceText", "选项文本", new Vector2(700, 35), new Vector2(-50, 12), 18, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var requirementText = CreateText(prefabRt, "RequirementText", "需求", new Vector2(700, 20), new Vector2(-50, -18), 14, new Color(0.8f, 0.8f, 0.8f), TextAlignmentOptions.Left);

            var choiceIndicator = CreateImage(prefabRt, "ChoiceIndicator", new Vector2(20, 20), new Vector2(410, 0), new Color(0.4f, 1f, 0.6f, 0.8f));

            var btn = prefabObj.AddComponent<Button>();
            btn.targetGraphic = bgImg;
            var btnColors = btn.colors;
            btnColors.normalColor = new Color(0.15f, 0.3f, 0.45f, 1f);
            btnColors.highlightedColor = new Color(0.25f, 0.5f, 0.7f, 1f);
            btnColors.pressedColor = new Color(0.1f, 0.2f, 0.35f, 1f);
            btn.colors = btnColors;

            var cg = prefabObj.AddComponent<CanvasGroup>();

            var ecb = prefabObj.AddComponent<EventChoiceButton>();
            ecb.button = btn;
            ecb.backgroundImage = bgImg;
            ecb.choiceText = choiceText;
            ecb.requirementText = requirementText;
            ecb.choiceIndicator = choiceIndicator;
            ecb.canvasGroup = cg;

            return ecb;
        }

        private ResultPanel CreateResultPanel()
        {
            var panelObj = new GameObject("ResultPanel", typeof(RectTransform));
            panelObj.transform.SetParent(mainCanvas.transform, false);
            var panelRt = panelObj.GetComponent<RectTransform>();

            var bgImg = CreateImage(panelRt, "PanelBG", Vector2.zero, Vector2.zero, COLOR_PANEL_BG);
            bgImg.rectTransform.anchorMin = Vector2.zero;
            bgImg.rectTransform.anchorMax = Vector2.one;
            bgImg.rectTransform.offsetMin = Vector2.zero;
            bgImg.rectTransform.offsetMax = Vector2.zero;

            var panel = panelObj.AddComponent<ResultPanel>();
            SetupPanelBase(panel, panelRt, new Vector2(900, 850));

            var resultIcon = CreateImage(panelRt, "ResultIcon", new Vector2(100, 100), new Vector2(0, 360), COLOR_GREEN);
            panel.resultIcon = resultIcon;

            var resultTitle = CreateText(panelRt, "ResultTitle", "🎉 任务成功！", new Vector2(700, 70), new Vector2(0, 280), 44, COLOR_GREEN, TextAlignmentOptions.Center);
            resultTitle.fontStyle = FontStyles.Bold;
            panel.resultTitleText = resultTitle;

            var resultReason = CreateText(panelRt, "ResultReason", "成功完成所有主线合同", new Vector2(800, 40), new Vector2(0, 220), 22, new Color(0.85f, 0.85f, 0.85f), TextAlignmentOptions.Center);
            panel.resultReasonText = resultReason;

            var starsContainer = new GameObject("StarsContainer", typeof(RectTransform));
            starsContainer.transform.SetParent(panelRt, false);
            var starsRt = starsContainer.GetComponent<RectTransform>();
            starsRt.sizeDelta = new Vector2(300, 80);
            starsRt.anchoredPosition = new Vector2(0, 140);

            var starIcons = new Image[3];
            for (int i = 0; i < 3; i++)
            {
                var starObj = new GameObject($"Star{i}", typeof(RectTransform));
                starObj.transform.SetParent(starsRt, false);
                var starRt = starObj.GetComponent<RectTransform>();
                starRt.sizeDelta = new Vector2(70, 70);
                starRt.anchoredPosition = new Vector2((i - 1) * 100, 0);
                var starImg = starObj.AddComponent<Image>();
                starImg.color = new Color(0.3f, 0.3f, 0.3f, 0.5f);
                starImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
                starIcons[i] = starImg;
            }
            panel.starRatingIcons = starIcons;

            var scoreLabel = CreateText(panelRt, "ScoreLabel", "最终得分", new Vector2(300, 30), new Vector2(0, 50), 18, new Color(0.7f, 0.7f, 0.7f), TextAlignmentOptions.Center);

            var totalScore = CreateText(panelRt, "TotalScore", "3,250", new Vector2(500, 80), new Vector2(-120, -5), 56, COLOR_ACCENT2, TextAlignmentOptions.Center);
            totalScore.fontStyle = FontStyles.Bold;
            panel.totalScoreText = totalScore;

            var scoreRank = CreateText(panelRt, "ScoreRank", "B", new Vector2(120, 80), new Vector2(220, -5), 56, COLOR_ACCENT2, TextAlignmentOptions.Center);
            scoreRank.fontStyle = FontStyles.Bold;
            panel.scoreRankText = scoreRank;

            var scoreRankIcon = CreateImage(panelRt, "ScoreRankIcon", new Vector2(20, 80), new Vector2(300, -5), COLOR_ACCENT2);
            panel.scoreRankIcon = scoreRankIcon;

            var breakdownObj = new GameObject("BreakdownContainer", typeof(RectTransform));
            breakdownObj.transform.SetParent(panelRt, false);
            var bdRt = breakdownObj.GetComponent<RectTransform>();
            bdRt.sizeDelta = new Vector2(760, 180);
            bdRt.anchoredPosition = new Vector2(0, -180);
            var bdBg = breakdownObj.AddComponent<Image>();
            bdBg.color = new Color(0.08f, 0.12f, 0.2f, 0.8f);
            bdBg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            panel.breakdownContainer = bdRt;

            breakdownItemPrefab = CreateBreakdownItemPrefab();
            panel.breakdownItemPrefab = breakdownItemPrefab;

            var statsObj = new GameObject("StatsGrid", typeof(RectTransform));
            statsObj.transform.SetParent(panelRt, false);
            var statsRt = statsObj.GetComponent<RectTransform>();
            statsRt.sizeDelta = new Vector2(760, 120);
            statsRt.anchoredPosition = new Vector2(0, -340);

            var deliveries = CreateText(statsRt, "Deliveries", "运输: 3", new Vector2(250, 40), new Vector2(-190, 35), 16, Color.white, TextAlignmentOptions.Left);
            panel.deliveriesText = deliveries;
            var failures = CreateText(statsRt, "Failures", "失败: 0", new Vector2(250, 40), new Vector2(190, 35), 16, Color.white, TextAlignmentOptions.Left);
            panel.failuresText = failures;
            var turnsUsed = CreateText(statsRt, "TurnsUsed", "回合: 15/30", new Vector2(250, 40), new Vector2(-190, -15), 16, Color.white, TextAlignmentOptions.Left);
            panel.turnsUsedText = turnsUsed;
            var fuelUsed = CreateText(statsRt, "FuelUsed", "耗燃: 45", new Vector2(250, 40), new Vector2(190, -15), 16, Color.white, TextAlignmentOptions.Left);
            panel.fuelUsedText = fuelUsed;
            var events = CreateText(statsRt, "Events", "事件: 2", new Vector2(250, 40), new Vector2(-190, -65), 16, Color.white, TextAlignmentOptions.Left);
            panel.eventsTriggeredText = events;
            var playTime = CreateText(statsRt, "PlayTime", "时长: 05:30", new Vector2(250, 40), new Vector2(190, -65), 16, Color.white, TextAlignmentOptions.Left);
            panel.playTimeText = playTime;
            var criticalChoices = CreateText(statsRt, "CriticalChoices", "关键: 2", new Vector2(250, 40), new Vector2(0, -65), 16, Color.white, TextAlignmentOptions.Left);
            panel.criticalChoicesText = criticalChoices;

            var retryBtn = CreateButton(panelRt, "RetryBtn", "🔄 重试", new Vector2(220, 65), new Vector2(-180, -470), COLOR_ACCENT, Color.white, 22);
            panel.retryButton = retryBtn;

            var returnBtn = CreateButton(panelRt, "ReturnBtn", "🏠 主菜单", new Vector2(220, 65), new Vector2(180, -470), new Color(0.45f, 0.35f, 0.35f), Color.white, 22);
            panel.returnToMenuButton = returnBtn;

            var saveBtn = CreateButton(panelRt, "SaveBtn", "💾 保存记录", new Vector2(200, 50), new Vector2(0, -550), new Color(0.3f, 0.35f, 0.5f), Color.white, 16);
            panel.saveRecordButton = saveBtn;

            return panel;
        }

        private GameObject CreateBreakdownItemPrefab()
        {
            var prefabObj = new GameObject("BreakdownItemPrefab", typeof(RectTransform));
            prefabObj.transform.SetParent(mainCanvas.transform, false);
            prefabObj.SetActive(false);
            var prefabRt = prefabObj.GetComponent<RectTransform>();
            prefabRt.sizeDelta = new Vector2(720, 35);

            var labelObj = new GameObject("Label", typeof(RectTransform));
            labelObj.transform.SetParent(prefabRt, false);
            var labelRt = labelObj.GetComponent<RectTransform>();
            labelRt.anchorMin = new Vector2(0, 0);
            labelRt.anchorMax = new Vector2(0.6f, 1);
            labelRt.offsetMin = new Vector2(20, 0);
            labelRt.offsetMax = Vector2.zero;
            var labelTmp = labelObj.AddComponent<TextMeshProUGUI>();
            labelTmp.text = "项目";
            labelTmp.fontSize = 16;
            labelTmp.color = Color.white;
            labelTmp.alignment = TextAlignmentOptions.Left | TextAlignmentOptions.Midline;
            labelTmp.font = GetDefaultFont();

            var valueObj = new GameObject("Value", typeof(RectTransform));
            valueObj.transform.SetParent(prefabRt, false);
            var valueRt = valueObj.GetComponent<RectTransform>();
            valueRt.anchorMin = new Vector2(0.6f, 0);
            valueRt.anchorMax = new Vector2(1, 1);
            valueRt.offsetMin = Vector2.zero;
            valueRt.offsetMax = new Vector2(-20, 0);
            var valueTmp = valueObj.AddComponent<TextMeshProUGUI>();
            valueTmp.text = "+1,000";
            valueTmp.fontSize = 16;
            valueTmp.color = COLOR_ACCENT2;
            valueTmp.alignment = TextAlignmentOptions.Right | TextAlignmentOptions.Midline;
            valueTmp.font = GetDefaultFont();

            return prefabObj;
        }

        private SettingsPanel CreateSettingsPanel()
        {
            var panelObj = new GameObject("SettingsPanel", typeof(RectTransform));
            panelObj.transform.SetParent(mainCanvas.transform, false);
            var panelRt = panelObj.GetComponent<RectTransform>();

            var bgImg = CreateImage(panelRt, "PanelBG", Vector2.zero, Vector2.zero, COLOR_PANEL_BG);
            bgImg.rectTransform.anchorMin = Vector2.zero;
            bgImg.rectTransform.anchorMax = Vector2.one;
            bgImg.rectTransform.offsetMin = Vector2.zero;
            bgImg.rectTransform.offsetMax = Vector2.zero;

            var panel = panelObj.AddComponent<SettingsPanel>();
            SetupPanelBase(panel, panelRt, new Vector2(950, 800));

            var title = CreateText(panelRt, "Title", "⚙️ 游戏设置", new Vector2(500, 50), new Vector2(0, 340), 36, COLOR_ACCENT2, TextAlignmentOptions.Center);
            title.fontStyle = FontStyles.Bold;

            var audioTitle = CreateText(panelRt, "AudioTitle", "🔊 音频设置", new Vector2(800, 35), new Vector2(-50, 270), 22, COLOR_ACCENT, TextAlignmentOptions.Left);

            var masterSlider = CreateSlider(panelRt, "MasterVolume", new Vector2(500, 20), new Vector2(50, 210), 0, 1, 1);
            panel.masterVolumeSlider = masterSlider;
            var masterLabel = CreateText(panelRt, "MasterLabel", "主音量", new Vector2(200, 30), new Vector2(-300, 210), 16, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var masterValue = CreateText(panelRt, "MasterValue", "100%", new Vector2(80, 30), new Vector2(370, 210), 16, COLOR_ACCENT2, TextAlignmentOptions.Right);
            panel.masterVolumeValue = masterValue;

            var musicSlider = CreateSlider(panelRt, "MusicVolume", new Vector2(500, 20), new Vector2(50, 160), 0, 1, 0.8f);
            panel.musicVolumeSlider = musicSlider;
            var musicLabel = CreateText(panelRt, "MusicLabel", "音乐音量", new Vector2(200, 30), new Vector2(-300, 160), 16, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var musicValue = CreateText(panelRt, "MusicValue", "80%", new Vector2(80, 30), new Vector2(370, 160), 16, COLOR_ACCENT2, TextAlignmentOptions.Right);
            panel.musicVolumeValue = musicValue;

            var sfxSlider = CreateSlider(panelRt, "SfxVolume", new Vector2(500, 20), new Vector2(50, 110), 0, 1, 0.9f);
            panel.sfxVolumeSlider = sfxSlider;
            var sfxLabel = CreateText(panelRt, "SfxLabel", "音效音量", new Vector2(200, 30), new Vector2(-300, 110), 16, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var sfxValue = CreateText(panelRt, "SfxValue", "90%", new Vector2(80, 30), new Vector2(370, 110), 16, COLOR_ACCENT2, TextAlignmentOptions.Right);
            panel.sfxVolumeValue = sfxValue;

            var muteToggle = CreateToggle(panelRt, "MuteToggle", "🔇 静音所有音频", new Vector2(350, 40), new Vector2(-225, 55), false);
            panel.muteToggle = muteToggle;

            var displayTitle = CreateText(panelRt, "DisplayTitle", "🖥️ 显示设置", new Vector2(800, 35), new Vector2(-50, -5), 22, COLOR_ACCENT, TextAlignmentOptions.Left);

            var fullscreenToggle = CreateToggle(panelRt, "FullscreenToggle", "全屏显示", new Vector2(300, 40), new Vector2(-275, -55), true);
            panel.fullscreenToggle = fullscreenToggle;

            var resLabel = CreateText(panelRt, "ResLabel", "分辨率", new Vector2(120, 40), new Vector2(-100, -55), 16, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var resDropdown = CreateTMPDropdown(panelRt, "ResolutionDropdown", new Vector2(280, 40), new Vector2(210, -55));
            panel.resolutionDropdown = resDropdown;

            var qualityLabel = CreateText(panelRt, "QualityLabel", "画质", new Vector2(120, 40), new Vector2(-100, -105), 16, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var qualityDropdown = CreateTMPDropdown(panelRt, "QualityDropdown", new Vector2(280, 40), new Vector2(210, -105));
            panel.qualityDropdown = qualityDropdown;

            var gameplayTitle = CreateText(panelRt, "GameplayTitle", "🎮 游戏设置", new Vector2(800, 35), new Vector2(-50, -180), 22, COLOR_ACCENT, TextAlignmentOptions.Left);

            var animToggle = CreateToggle(panelRt, "AnimToggle", "启用事件动画", new Vector2(300, 40), new Vector2(-275, -230), true);
            panel.eventAnimationsToggle = animToggle;

            var routeToggle = CreateToggle(panelRt, "RouteToggle", "启用航线预览", new Vector2(300, 40), new Vector2(125, -230), true);
            panel.routePreviewToggle = routeToggle;

            var textSpeedSlider = CreateSlider(panelRt, "TextSpeed", new Vector2(400, 20), new Vector2(0, -290), 0.5f, 2, 1);
            panel.textSpeedSlider = textSpeedSlider;
            var tsLabel = CreateText(panelRt, "TSLabel", "文字速度", new Vector2(200, 30), new Vector2(-300, -290), 16, Color.white, TextAlignmentOptions.Left | TextAlignmentOptions.Midline);
            var tsValue = CreateText(panelRt, "TSValue", "100%", new Vector2(80, 30), new Vector2(370, -290), 16, COLOR_ACCENT2, TextAlignmentOptions.Right);
            panel.textSpeedValue = tsValue;

            var applyBtn = CreateButton(panelRt, "ApplyBtn", "💾 应用设置", new Vector2(220, 60), new Vector2(-260, -430), COLOR_GREEN, Color.white, 20);
            panel.applyButton = applyBtn;

            var resetBtn = CreateButton(panelRt, "ResetBtn", "↺ 重置默认", new Vector2(220, 60), new Vector2(0, -430), new Color(0.4f, 0.4f, 0.5f), Color.white, 20);
            panel.resetButton = resetBtn;

            var deleteSaveBtn = CreateButton(panelRt, "DeleteSaveBtn", "🗑️ 清除存档", new Vector2(220, 60), new Vector2(260, -430), COLOR_RED, Color.white, 20);
            panel.deleteSaveButton = deleteSaveBtn;

            var exportBtn = CreateButton(panelRt, "ExportBtn", "📤 导出数据", new Vector2(220, 50), new Vector2(0, -510), new Color(0.35f, 0.3f, 0.5f), Color.white, 16);
            panel.exportDataButton = exportBtn;

            return panel;
        }
    }
}

