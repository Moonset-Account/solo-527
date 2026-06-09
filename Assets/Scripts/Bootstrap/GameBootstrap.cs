using UnityEngine;
using UnityEngine.SceneManagement;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Input;
using KitchenChaos.Players;
using KitchenChaos.OrderSystem;
using KitchenChaos.Scoring;
using KitchenChaos.Levels;
using KitchenChaos.Persistence;
using KitchenChaos.Leaderboards;
using KitchenChaos.Achievements;
using KitchenChaos.Config;
using KitchenChaos.UI;
using KitchenChaos.World;

namespace KitchenChaos.Bootstrap
{
    [DefaultExecutionOrder(-1000)]
    public class GameBootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void PreBoot()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 1;
            Physics2D.queriesHitTriggers = true;
            Physics2D.gravity = Vector2.zero;
            SceneManager.sceneLoaded += OnSceneLoadedFirstBoot;
            SpawnPersistentManagers();
        }

        static void OnSceneLoadedFirstBoot(Scene scene, LoadSceneMode mode)
        {
            SceneManager.sceneLoaded -= OnSceneLoadedFirstBoot;
            BuildSceneRuntimeObjects(scene);
            SceneManager.sceneLoaded += OnSceneLoadedLater;
        }

        static void OnSceneLoadedLater(Scene scene, LoadSceneMode mode)
        {
            BuildSceneRuntimeObjects(scene);
        }

        static void SpawnPersistentManagers()
        {
            var root = new GameObject("[~Bootstrap~]");
            DontDestroyOnLoad(root);
            root.AddComponent<GameBootstrap>();

            EnsureCore<GameManager>(root.transform);
            EnsureCore<InputManager>(root.transform);
            EnsureCore<PlayerManager>(root.transform);
            EnsureCore<OrderManager>(root.transform);
            EnsureCore<ScoreManager>(root.transform);
            EnsureCore<LevelMechanicManager>(root.transform);
            EnsureCore<SaveSystem>(root.transform);
            EnsureCore<AchievementManager>(root.transform);
            EnsureCore<LeaderboardManager>(root.transform);
            EnsureCore<DailyChallengeManager>(root.transform);

            root.AddComponent<GameCoordinator>();
        }

        static T EnsureCore<T>(Transform parent) where T : MonoBehaviour
        {
            var exist = FindObjectOfType<T>();
            if (exist != null) return exist;
            var go = new GameObject(typeof(T).Name);
            go.transform.SetParent(parent, false);
            return go.AddComponent<T>();
        }

        static void BuildSceneRuntimeObjects(Scene scene)
        {
            if (scene.name != "Main") return;

            var canvas = FindInScene(scene, "Canvas");
            if (canvas != null)
            {
                EnsurePanel<MainMenuPanel>(canvas.transform, "MainMenuPanel", true);
                EnsurePanel<HUDPanel>(canvas.transform, "HUDPanel", false);
                EnsurePanel<ResultPanel>(canvas.transform, "ResultPanel", false);
            }

            var worldRoot = FindInScene(scene, "WorldRoot");
            if (worldRoot == null)
            {
                worldRoot = new GameObject("WorldRoot");
                SceneManager.MoveGameObjectToScene(worldRoot, scene);
            }
            var builder = worldRoot.GetComponent<LevelSceneBuilder>();
            if (builder == null)
            {
                builder = worldRoot.AddComponent<LevelSceneBuilder>();
            }
            var spawner = worldRoot.GetComponent<StationSpawner>();
            if (spawner == null) worldRoot.AddComponent<StationSpawner>();

            var cam = Camera.main;
            if (cam != null)
            {
                cam.orthographic = true;
                cam.orthographicSize = 7;
                cam.backgroundColor = new Color(0.1f, 0.12f, 0.15f, 1);
            }

            ApplyDefaultConfigIfMissing();
        }

        static GameObject FindInScene(Scene scene, string name)
        {
            foreach (var go in scene.GetRootGameObjects())
            {
                if (go.name == name) return go;
                var child = go.transform.Find(name);
                if (child != null) return child.gameObject;
            }
            return null;
        }

        static T EnsurePanel<T>(Transform parent, string panelName, bool startActive) where T : MonoBehaviour
        {
            var existing = parent.Find(panelName);
            GameObject go;
            if (existing != null)
            {
                go = existing.gameObject;
            }
            else
            {
                go = new GameObject(panelName, typeof(RectTransform));
                go.transform.SetParent(parent, false);
                var rt = (RectTransform)go.transform;
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero;
                rt.offsetMax = Vector2.zero;
            }
            var comp = go.GetComponent<T>();
            if (comp == null) comp = go.AddComponent<T>();
            go.SetActive(startActive);
            return comp;
        }

        static void ApplyDefaultConfigIfMissing()
        {
            var gm = GameManager.Instance;
            if (gm == null) return;
            if (gm.Config != null && gm.Config.Levels != null && gm.Config.Levels.Length > 0) return;
            gm.SetGameConfig(CreateDefaultConfig());
        }

        public static GameConfig CreateDefaultConfig()
        {
            var cfg = ScriptableObject.CreateInstance<GameConfig>();
            cfg.MaxPlayers = 4;
            cfg.PlayerMoveSpeed = 4f;
            cfg.PlayerInteractionRange = 1.5f;
            cfg.ThrowForce = 6f;
            cfg.PerfectDeliveryBonus = 50;
            cfg.PerfectDeliveryTimeRatio = 0.5f;
            cfg.ComboMultiplierPerStack = 25;
            cfg.MaxComboBonus = 500;
            cfg.ComboTimeWindow = 8f;
            cfg.FailPenaltyScore = 100;
            cfg.EnableDebugPanel = true;
            cfg.GodMode = false;
            cfg.Levels = new[]
            {
                DemoLevel(0, "新手厨房", 180, new[]{100, 250, 500}, "Salad", "Soup"),
                DemoLevel(1, "热锅挑战", 180, new[]{200, 450, 800}, "Soup", "Burger", "Pasta"),
                DemoLevel(2, "主厨高峰", 240, new[]{350, 700, 1200}, "Burger", "Pasta", "Steak", "Pizza")
            };
            return cfg;
        }

        static LevelConfig DemoLevel(int idx, string name, float duration, int[] stars, params string[] recipes)
        {
            var lvl = ScriptableObject.CreateInstance<LevelConfig>();
            lvl.LevelIndex = idx;
            lvl.LevelName = name;
            lvl.Duration = duration;
            lvl.StarThresholds = stars;
            lvl.TargetScore = stars[0];
            lvl.MaxFailedOrders = 5;
            lvl.MaxPlayersInLevel = Mathf.Min(4, idx + 2);
            lvl.PlayerSpawnPoints = new[]
            {
                new Vector3(-3f, -0.5f, 0),
                new Vector3(3f, -0.5f, 0),
                new Vector3(-3f, 0.5f, 0),
                new Vector3(3f, 0.5f, 0)
            };
            lvl.OrderSpawnInterval = Mathf.Max(5f, 12f - idx * 1.5f);
            lvl.OrderSpawnIntervalVariance = 3f;
            lvl.MaxActiveOrders = Mathf.Min(8, 4 + idx);
            lvl.OrderTimeLimitBase = Mathf.Max(20f, 40f - idx * 3f);
            lvl.OrderTimeLimitPerIngredient = 8f;
            lvl.AvailableRecipeNames = recipes;
            lvl.Mechanics = idx == 2 ? new[]
            {
                new LevelMechanic { Type = LevelMechanicType.TightCorridor, Enabled = true, Intensity = 1f },
                new LevelMechanic { Type = LevelMechanicType.ConveyorBelt, Enabled = true, Intensity = 0.8f }
            } : System.Array.Empty<LevelMechanic>();
            lvl.LevelTips = new[]
            {
                "使用 WASD / 方向键移动，按 E 交互",
                "切菜站需按住 E 直到进度完成",
                "食材烧糊不可用，注意烹饪站状态"
            };
            lvl.StationPlacements = new[]
            {
                new StationPlacement { StationType = "IngredientBox", Position = new Vector3(-5, 1.5f, 0), IngredientsProvided = new[]{ "Lettuce", "Tomato", "Potato", "Onion", "Carrot" } },
                new StationPlacement { StationType = "IngredientBox", Position = new Vector3(-5, -1.5f, 0), IngredientsProvided = new[]{ "Beef", "Chicken", "Cheese", "Bread", "Fish" } },
                new StationPlacement { StationType = "CuttingStation", Position = new Vector3(-2, 1.5f, 0) },
                new StationPlacement { StationType = "CuttingStation", Position = new Vector3(-2, -1.5f, 0) },
                new StationPlacement { StationType = "CookingStation", Position = new Vector3(0, 1.5f, 0) },
                new StationPlacement { StationType = "CookingStation", Position = new Vector3(0, -1.5f, 0) },
                new StationPlacement { StationType = "PlateStation", Position = new Vector3(2, 1.5f, 0) },
                new StationPlacement { StationType = "WashingStation", Position = new Vector3(2, -1.5f, 0) },
                new StationPlacement { StationType = "DeliveryStation", Position = new Vector3(5, 0, 0) }
            };
            return lvl;
        }
    }

    [DefaultExecutionOrder(-990)]
    public class GameCoordinator : MonoBehaviour
    {
        void OnEnable()
        {
            EventBus.Subscribe<RequestInitializeLevelEvent>(OnRequestInitializeLevel);
            EventBus.Subscribe<RequestResetComboEvent>(OnRequestResetCombo);
            EventBus.Subscribe<RequestApplyLevelMechanicsEvent>(OnRequestApplyMechanics);
            EventBus.Subscribe<RequestSaveLevelResultEvent>(OnRequestSaveResult);
            EventBus.Subscribe<RequestCheckAchievementsEvent>(OnRequestCheckAchievements);
            EventBus.Subscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Subscribe<OrderFailedEvent>(OnOrderFailed);
        }

        void OnDisable()
        {
            EventBus.Unsubscribe<RequestInitializeLevelEvent>(OnRequestInitializeLevel);
            EventBus.Unsubscribe<RequestResetComboEvent>(OnRequestResetCombo);
            EventBus.Unsubscribe<RequestApplyLevelMechanicsEvent>(OnRequestApplyMechanics);
            EventBus.Unsubscribe<RequestSaveLevelResultEvent>(OnRequestSaveResult);
            EventBus.Unsubscribe<RequestCheckAchievementsEvent>(OnRequestCheckAchievements);
            EventBus.Unsubscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Unsubscribe<OrderFailedEvent>(OnOrderFailed);
        }

        void OnRequestInitializeLevel(RequestInitializeLevelEvent e)
        {
            var gm = ServiceLocator.Get<GameManager>();
            var levelCfg = gm != null ? gm.CurrentLevelConfig : LevelConfig.Default;

            var players = ServiceLocator.Get<PlayerManager>();
            players?.SpawnPlayersForLevel(levelCfg, e.IsSinglePlayer);

            var orders = ServiceLocator.Get<OrderManager>();
            orders?.InitializeForLevel(levelCfg);
        }

        void OnRequestResetCombo(RequestResetComboEvent _)
        {
            ServiceLocator.TryGet(out ScoreManager sm);
            sm?.ResetCombo();
        }

        void OnRequestApplyMechanics(RequestApplyLevelMechanicsEvent e)
        {
            var gm = ServiceLocator.Get<GameManager>();
            var levelCfg = gm != null ? gm.CurrentLevelConfig : null;
            if (levelCfg == null) return;
            ServiceLocator.TryGet(out LevelMechanicManager lm);
            lm?.ApplyLevelMechanics(levelCfg);
        }

        void OnRequestSaveResult(RequestSaveLevelResultEvent e)
        {
            ServiceLocator.TryGet(out SaveSystem save);
            save?.SaveLevelResult(e.LevelIndex, e.Score, e.Stars, e.Victory);
            if (e.Victory)
            {
                ServiceLocator.TryGet(out LeaderboardManager lb);
                lb?.SubmitScore($"level_{e.LevelIndex}", e.Score, e.Stars);
            }
        }

        void OnRequestCheckAchievements(RequestCheckAchievementsEvent e)
        {
            ServiceLocator.TryGet(out AchievementManager ach);
            ach?.CheckScoreAchievements(e.Score, e.Stars);
            ach?.CheckLevelAchievements(e.LevelIndex, e.Victory);
        }

        void OnGameStateChanged(GameStateChangedEvent e)
        {
            var main = GameObject.Find("MainMenuPanel");
            var hud = GameObject.Find("HUDPanel");
            var result = GameObject.Find("ResultPanel");
            switch (e.NewState)
            {
                case GameState.MainMenu:
                    if (main) main.SetActive(true);
                    if (hud) hud.SetActive(false);
                    if (result) result.SetActive(false);
                    break;
                case GameState.LevelSelect:
                case GameState.PreGame:
                    if (main) main.SetActive(true);
                    if (hud) hud.SetActive(false);
                    if (result) result.SetActive(false);
                    break;
                case GameState.Playing:
                    if (main) main.SetActive(false);
                    if (hud) hud.SetActive(true);
                    if (result) result.SetActive(false);
                    break;
                case GameState.LevelEnd:
                    if (main) main.SetActive(false);
                    if (hud) hud.SetActive(false);
                    if (result) result.SetActive(true);
                    break;
            }
        }

        void OnOrderFailed(OrderFailedEvent e)
        {
            ServiceLocator.TryGet(out ScoreManager sm);
            sm?.OnOrderFailed(e.PenaltyScore);
        }
    }
}
