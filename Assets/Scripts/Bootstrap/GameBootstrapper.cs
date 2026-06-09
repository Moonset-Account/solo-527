using UnityEngine;
using LakeSailing.Core;
using LakeSailing.UI;
using LakeSailing.Gameplay;
using LakeSailing.Audio;
using LakeSailing.Meta;
using LakeSailing.Data;

namespace LakeSailing.Bootstrap
{
    public class GameBootstrapper : PersistentSingleton<GameBootstrapper>
    {
        [SerializeField] private float bootTime = 0.1f;
        private bool isBooted;

        protected override void Awake()
        {
            base.Awake();
            Application.runInBackground = true;
        }

        private void Start()
        {
            Bootstrap();
        }

        private async void Bootstrap()
        {
            if (isBooted) return;
            isBooted = true;
            RuntimeUIBuilder.EnsureEventSystem();

            CreateCoreSystems();
            await SaveSystem.Instance.LoadAllData();

            AudioManager.Instance.ApplySettings(
                SaveSystem.Instance.CurrentSettings.masterVolume,
                SaveSystem.Instance.CurrentSettings.musicVolume,
                SaveSystem.Instance.CurrentSettings.sfxVolume,
                SaveSystem.Instance.CurrentSettings.ambientVolume);

            CreateGameplaySystems();
            LeaderboardSystem.Instance.Initialize();

            CreateUIRoot();
            CreateAllPanels();

            GameManager.Instance.ChangeState(GameState.Boot);
            Invoke(nameof(FinishBoot), bootTime);
        }

        private void CreateCoreSystems()
        {
            EnsureComponent<GameManager>("[GameManager]");
            EnsureComponent<SaveSystem>("[SaveSystem]");
            EnsureComponent<EventBusProxy>("[EventBusProxy]");
            EnsureComponent<AudioManager>("[AudioManager]");
        }

        private void CreateGameplaySystems()
        {
            EnsureComponent<WeatherSystem>("[WeatherSystem]");
            EnsureComponent<TaskSystem>("[TaskSystem]");
            EnsureComponent<GallerySystem>("[GallerySystem]");
            EnsureComponent<LeaderboardSystem>("[LeaderboardSystem]");
            EnsureComponent<AchievementSystem>("[AchievementSystem]");
            EnsureComponent<LevelSceneManager>("[LevelSceneManager]");
            EnsureComponent<InputController>("[InputController]");
        }

        private void CreateUIRoot()
        {
            var canvasGO = new GameObject("[UICanvas]");
            DontDestroyOnLoad(canvasGO);
            canvasGO.layer = 5;

            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            canvas.pixelPerfect = true;

            var scaler = canvasGO.AddComponent<UnityEngine.UI.CanvasScaler>();
            scaler.uiScaleMode = UnityEngine.UI.CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            scaler.screenMatchMode = UnityEngine.UI.CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;

            var raycaster = canvasGO.AddComponent<UnityEngine.UI.GraphicRaycaster>();
            raycaster.ignoreReversedGraphics = true;

            var mgrGO = new GameObject("UIManager");
            mgrGO.transform.SetParent(canvasGO.transform, false);
            var mgr = mgrGO.AddComponent<UIManager>();

            var rootField = typeof(UIManager).GetField("uiRoot",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            var canvasField = typeof(UIManager).GetField("mainCanvas",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            rootField?.SetValue(mgr, canvasGO.transform as RectTransform);
            canvasField?.SetValue(mgr, canvas);
        }

        private void CreateAllPanels()
        {
            var canvasTF = UIManager.Instance.UIRoot;
            UIManager.Instance.RegisterPanel(UIType.MainMenu, CreatePanelRuntime<MainMenuPanel>(canvasTF, "MainMenuPanel"));
            UIManager.Instance.RegisterPanel(UIType.HUD, CreatePanelRuntime<HUDPanel>(canvasTF, "HUDPanel"));
            UIManager.Instance.RegisterPanel(UIType.PauseMenu, CreatePanelRuntime<PauseMenuPanel>(canvasTF, "PauseMenuPanel"));
            UIManager.Instance.RegisterPanel(UIType.SettingsMenu, CreatePanelRuntime<SettingsMenuPanel>(canvasTF, "SettingsMenuPanel"));
            UIManager.Instance.RegisterPanel(UIType.Tutorial, CreatePanelRuntime<TutorialPanel>(canvasTF, "TutorialPanel"));
            UIManager.Instance.RegisterPanel(UIType.LevelSelect, CreatePanelRuntime<LevelSelectPanel>(canvasTF, "LevelSelectPanel"));
            var victory = CreatePanelRuntime<ResultPanel>(canvasTF, "VictoryPanel");
            victory.SetVictoryFlag(true);
            UIManager.Instance.RegisterPanel(UIType.Victory, victory);
            var defeat = CreatePanelRuntime<ResultPanel>(canvasTF, "DefeatPanel");
            defeat.SetVictoryFlag(false);
            UIManager.Instance.RegisterPanel(UIType.Defeat, defeat);
            UIManager.Instance.RegisterPanel(UIType.Gallery, CreatePanelRuntime<GalleryPanel>(canvasTF, "GalleryPanel"));
            UIManager.Instance.RegisterPanel(UIType.Achievements, CreatePanelRuntime<AchievementsPanel>(canvasTF, "AchievementsPanel"));
            UIManager.Instance.RegisterPanel(UIType.Leaderboard, CreatePanelRuntime<LeaderboardPanel>(canvasTF, "LeaderboardPanel"));
            UIManager.Instance.RegisterPanel(UIType.DailyChallenge, CreatePanelRuntime<DailyChallengePanel>(canvasTF, "DailyChallengePanel"));
            UIManager.Instance.RegisterPanel(UIType.RoutePlanner, CreatePanelRuntime<RoutePlannerPanel>(canvasTF, "RoutePlannerPanel"));
        }

        private T CreatePanelRuntime<T>(Transform parent, string name) where T : UIPanelBase
        {
            var panelGO = RuntimeUIBuilder.CreatePanel(parent, name);
            var contentGO = RuntimeUIBuilder.CreateContent(panelGO.transform);
            var panel = panelGO.AddComponent<T>();

            var contentField = typeof(UIPanelBase).GetField("panelContent",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            contentField?.SetValue(panel, contentGO);

            panelGO.SetActive(false);
            return panel;
        }

        private void FinishBoot()
        {
            Debug.Log("[Bootstrap] 系统启动完成，进入主菜单");
            GameManager.Instance?.ChangeState(GameState.MainMenu);
            UIManager.Instance.OpenPanel(UIType.MainMenu);
            SubscribeGlobalEvents();
        }

        private void SubscribeGlobalEvents()
        {
            EventBus.Subscribe<RequestUIPanelEvent>(OnRequestUIPanel);
            EventBus.Subscribe<RequestTogglePauseEvent>(OnRequestTogglePause);
            EventBus.Subscribe<ShowUINotificationEvent>(OnShowUINotification);
            EventBus.Subscribe<RequestReturnToPreviousPanelEvent>(OnRequestReturnPrevious);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<RequestUIPanelEvent>(OnRequestUIPanel);
            EventBus.Unsubscribe<RequestTogglePauseEvent>(OnRequestTogglePause);
            EventBus.Unsubscribe<ShowUINotificationEvent>(OnShowUINotification);
            EventBus.Unsubscribe<RequestReturnToPreviousPanelEvent>(OnRequestReturnPrevious);
        }

        private static UIType MapRequestType(UIRequestPanel rp) => rp switch
        {
            UIRequestPanel.RoutePlanner => UIType.RoutePlanner,
            UIRequestPanel.PauseMenu => UIType.PauseMenu,
            UIRequestPanel.SettingsMenu => UIType.SettingsMenu,
            UIRequestPanel.Tutorial => UIType.Tutorial,
            UIRequestPanel.HUD => UIType.HUD,
            UIRequestPanel.MainMenu => UIType.MainMenu,
            UIRequestPanel.LevelSelect => UIType.LevelSelect,
            UIRequestPanel.Gallery => UIType.Gallery,
            UIRequestPanel.Achievements => UIType.Achievements,
            UIRequestPanel.Leaderboard => UIType.Leaderboard,
            UIRequestPanel.DailyChallenge => UIType.DailyChallenge,
            _ => UIType.None
        };

        private void OnRequestUIPanel(RequestUIPanelEvent e)
        {
            if (UIManager.Instance == null) return;
            var t = MapRequestType(e.Panel);
            if (e.Panel == UIRequestPanel.None && !e.Open) { UIManager.Instance.ReturnToPreviousPanel(); return; }
            if (t == UIType.None) return;
            if (e.Open)
            {
                if (e.ClosePrevious) UIManager.Instance.ClosePanel(t);
                UIManager.Instance.OpenPanel(t);
            }
            else UIManager.Instance.ClosePanel(t);
        }

        private void OnRequestTogglePause(RequestTogglePauseEvent e)
        {
            GameManager.Instance?.TogglePause();
            if (GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Paused)
                UIManager.Instance?.OpenPanel(UIType.PauseMenu);
        }

        private void OnShowUINotification(ShowUINotificationEvent e)
        {
            UIManager.Instance?.ShowNotification(e.Message, e.Duration);
        }

        private void OnRequestReturnPrevious(RequestReturnToPreviousPanelEvent e)
        {
            UIManager.Instance?.ReturnToPreviousPanel();
        }

        private T EnsureComponent<T>(string goName) where T : Component
        {
            var existing = Object.FindObjectOfType<T>();
            if (existing != null)
            {
                existing.transform.SetParent(transform, false);
                return existing;
            }
            var go = new GameObject(goName);
            go.transform.SetParent(transform, false);
            return go.AddComponent<T>();
        }
    }

    public class EventBusProxy : MonoBehaviour { }
}
