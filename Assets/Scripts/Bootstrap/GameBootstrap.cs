using System;
using System.Collections.Generic;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;
using SpaceCourier.Gameplay;
using SpaceCourier.StarMap;
using SpaceCourier.UI;
using SpaceCourier.SaveSystem;
using SpaceCourier.Audio;
using SpaceCourier.AnimationSystem;

namespace SpaceCourier.Bootstrap
{
    public class GameBootstrap : MonoBehaviour
    {
        [Header("Core Systems")]
        public GameManager gameManager;
        public AnimationController animationController;

        [Header("Scene-Specific References (可在Inspector绑定)")]
        public StarMapController starMapController;
        public GameplayController gameplayController;

        [Header("UI Panels")]
        public MainMenuPanel mainMenuPanel;
        public HUDPanel hudPanel;
        public ContractPanel contractPanel;
        public EventCardPanel eventCardPanel;
        public ResultPanel resultPanel;
        public SettingsPanel settingsPanel;
        public NotificationToast notificationToast;

        [Header("Prefabs")]
        public GameObject starNodePrefab;
        public GameObject connectionPrefab;
        public GameObject shipObject;
        public LineRenderer routeLineRenderer;

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

        private void Awake()
        {
            Application.targetFrameRate = 60;
            InitializeSystems();
        }

        private void Start()
        {
            SetupUIConnections();
            ShowMainMenu();
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

            uiManager.notificationToast = notificationToast;

            if (mainMenuPanel != null)
            {
                uiManager.RegisterPanel("MainMenu", mainMenuPanel);

                mainMenuPanel.OnStartLevelSelected += HandleStartLevel;
                mainMenuPanel.OnContinueClicked += HandleContinueGame;
                mainMenuPanel.OnSettingsClicked += () => uiManager.OpenPanel("Settings");
            }

            if (hudPanel != null)
            {
                uiManager.RegisterPanel("HUD", hudPanel);

                hudPanel.OnConfirmRouteClicked += HandleConfirmRoute;
                hudPanel.OnRefuelClicked += HandleRefuel;
                hudPanel.OnContractsClicked += () => uiManager.OpenPanel("Contract");
                hudPanel.OnPauseClicked += () => uiManager.OpenPanel("Pause");
                hudPanel.OnMenuClicked += HandleReturnToMenu;
            }

            if (contractPanel != null)
            {
                uiManager.RegisterPanel("Contract", contractPanel);

                contractPanel.OnContractAccepted += HandleAcceptContract;
            }

            if (eventCardPanel != null)
            {
                uiManager.RegisterPanel("EventCard", eventCardPanel);
                eventCardPanel.OnContinueClicked += HandleEventContinue;
            }

            if (resultPanel != null)
            {
                uiManager.RegisterPanel("Result", resultPanel);
                resultPanel.notificationToast = notificationToast;

                resultPanel.OnRetryClicked += () => StartLevel(currentLevelId);
                resultPanel.OnReturnToMenuClicked += HandleReturnToMenu;
            }

            if (settingsPanel != null)
            {
                uiManager.RegisterPanel("Settings", settingsPanel);
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
                    starMapController.GetPreviewRouteFuelCost() <= fuelManager?.CurrentFuel
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
    }
}
