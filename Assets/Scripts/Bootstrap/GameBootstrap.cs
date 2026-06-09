using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Input;
using KitchenChaos.Players;
using KitchenChaos.OrderSystem;
using KitchenChaos.Levels;
using KitchenChaos.Persistence;
using KitchenChaos.Leaderboards;
using KitchenChaos.Achievements;
using KitchenChaos.Config;

namespace KitchenChaos.Bootstrap
{
    public class GameBootstrap : MonoBehaviour
    {
        [SerializeField] GameConfig _gameConfig;
        [SerializeField] bool _spawnDebugPanel = true;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void PreBoot()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 1;
            Physics2D.queriesHitTriggers = true;
        }

        void Awake()
        {
            DontDestroyOnLoad(gameObject);

            EnsureCore<GameManager>();
            EnsureCore<InputManager>();
            EnsureCore<PlayerManager>();
            EnsureCore<OrderManager>();
            EnsureCore<ScoreManager>();
            EnsureCore<LevelMechanicManager>();
            EnsureCore<SaveSystem>();
            EnsureCore<AchievementManager>();
            EnsureCore<LeaderboardManager>();
            EnsureCore<DailyChallengeManager>();

            if (_gameConfig == null)
            {
                _gameConfig = Resources.Load<GameConfig>("Config/GameConfig") ?? CreateDefaultConfig();
            }

            var gm = GameManager.Instance;
            if (gm != null) gm.SetGameConfig(_gameConfig);

            if (_spawnDebugPanel)
            {
                var dgo = new GameObject("DebugPanel");
                dgo.transform.SetParent(transform, false);
                dgo.AddComponent<DebugTools.DebugPanel>();
            }

            BuildDefaultLayersIfNeeded();
        }

        static GameConfig CreateDefaultConfig()
        {
            var cfg = ScriptableObject.CreateInstance<GameConfig>();
            cfg.MaxPlayers = 4;
            cfg.PlayerMoveSpeed = 4f;
            cfg.PlayerInteractionRange = 1.5f;
            cfg.PerfectDeliveryBonus = 50;
            cfg.ComboMultiplierPerStack = 25;
            cfg.MaxComboBonus = 500;
            cfg.ComboTimeWindow = 8f;
            cfg.FailPenaltyScore = 100;
            cfg.EnableDebugPanel = true;
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
            lvl.MaxFailedOrders = 5;
            lvl.MaxPlayersInLevel = Mathf.Min(4, idx + 2);
            lvl.PlayerSpawnPoints = new[]
            {
                new Vector3(-3f, -0.5f, 0),
                new Vector3(3f, -0.5f, 0),
                new Vector3(-3f, 0.5f, 0),
                new Vector3(3f, 0.5f, 0)
            };
            lvl.OrderSpawnInterval = 12f - idx * 1.5f;
            lvl.OrderSpawnIntervalVariance = 3f;
            lvl.MaxActiveOrders = 4 + idx;
            lvl.OrderTimeLimitBase = 40f - idx * 3f;
            lvl.OrderTimeLimitPerIngredient = 8f;
            lvl.AvailableRecipeNames = recipes;
            lvl.Mechanics = idx == 2 ? new[]
            {
                new LevelMechanic { Type = LevelMechanicType.TightCorridor, Enabled = true, Intensity = 1f },
                new LevelMechanic { Type = LevelMechanicType.ConveyorBelt, Enabled = true, Intensity = 0.8f }
            } : System.Array.Empty<LevelMechanic>();
            lvl.LevelTips = new[]
            {
                "💡 使用 WASD / 方向键移动，按 E 交互",
                "💡 切菜需要靠近切菜站并持续按住",
                "💡 食材烧糊无法使用，注意烹饪站的火焰颜色"
            };
            lvl.StationPlacements = new[]
            {
                new StationPlacement { StationType = "IngredientBox", Position = new Vector3(-5, 1.5f, 0), IngredientsProvided = new[]{ "Lettuce", "Tomato", "Potato" } },
                new StationPlacement { StationType = "CuttingStation", Position = new Vector3(-2, 1.5f, 0) },
                new StationPlacement { StationType = "CookingStation", Position = new Vector3(0, 1.5f, 0) },
                new StationPlacement { StationType = "PlateStation", Position = new Vector3(2, 1.5f, 0) },
                new StationPlacement { StationType = "WashingStation", Position = new Vector3(-5, -1.5f, 0) },
                new StationPlacement { StationType = "DeliveryStation", Position = new Vector3(5, 0, 0) }
            };
            return lvl;
        }

        static T EnsureCore<T>() where T : MonoBehaviour
        {
            var exist = FindObjectOfType<T>();
            if (exist != null) return exist;
            var go = new GameObject(typeof(T).Name);
            return go.AddComponent<T>();
        }

        static void BuildDefaultLayersIfNeeded()
        {
            for (int i = 8; i <= 12; i++)
            {
                try
                {
                    var _ = LayerMask.LayerToName(i);
                }
                catch { }
            }
        }
    }
}
