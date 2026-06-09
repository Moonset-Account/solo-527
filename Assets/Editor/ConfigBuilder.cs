#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using KitchenChaos.Config;

namespace KitchenChaos.EditorTools
{
    public static class ConfigBuilder
    {
        const string ConfigDir = "Assets/Resources/Config";

        [MenuItem("KitchenChaos/Config/Create GameConfig")]
        public static void CreateGameConfig()
        {
            Directory().Create();
            var path = $"{ConfigDir}/GameConfig.asset";
            if (AssetDatabase.AssetPathToGUID(path) != null)
            {
                Debug.LogWarning("GameConfig 已存在");
                return;
            }
            var cfg = ScriptableObject.CreateInstance<GameConfig>();
            AssetDatabase.CreateAsset(cfg, path);
            AssetDatabase.SaveAssets();
            Selection.activeObject = cfg;
        }

        [MenuItem("KitchenChaos/Config/Build 3 Demo Levels")]
        public static void BuildDemoLevels()
        {
            var dir = Directory();
            dir.Create();
            AssetDatabase.Refresh();

            var levels = new[]
            {
                BuildLevel(0, "新手厨房", 180, new[]{100, 250, 500}, 5, "Salad", "Soup"),
                BuildLevel(1, "热锅挑战", 180, new[]{200, 450, 800}, 5, "Soup", "Burger", "Pasta"),
                BuildLevel(2, "主厨高峰", 240, new[]{350, 700, 1200}, 4, "Burger", "Pasta", "Steak", "Pizza", "FishFry"),
            };

            for (int i = 0; i < levels.Length; i++)
                AssetDatabase.CreateAsset(levels[i], $"{ConfigDir}/Level_{i:D2}.asset");

            var gameCfg = AssetDatabase.LoadAssetAtPath<GameConfig>($"{ConfigDir}/GameConfig.asset");
            if (gameCfg == null)
            {
                gameCfg = ScriptableObject.CreateInstance<GameConfig>();
                AssetDatabase.CreateAsset(gameCfg, $"{ConfigDir}/GameConfig.asset");
            }
            gameCfg.Levels = levels;
            gameCfg.MaxPlayers = 4;
            gameCfg.PlayerMoveSpeed = 4f;
            gameCfg.PlayerInteractionRange = 1.5f;
            gameCfg.PerfectDeliveryBonus = 50;
            gameCfg.ComboMultiplierPerStack = 25;
            gameCfg.MaxComboBonus = 500;
            gameCfg.ComboTimeWindow = 8f;
            gameCfg.FailPenaltyScore = 100;
            gameCfg.EnableDebugPanel = true;

            EditorUtility.SetDirty(gameCfg);
            AssetDatabase.SaveAssets();
            Debug.Log("✅ Demo 关卡配置生成完毕");
        }

        static LevelConfig BuildLevel(int idx, string name, float duration, int[] stars, int maxFailed, params string[] recipes)
        {
            var lvl = ScriptableObject.CreateInstance<LevelConfig>();
            lvl.LevelIndex = idx;
            lvl.LevelName = name;
            lvl.Duration = duration;
            lvl.StarThresholds = stars;
            lvl.TargetScore = stars[1];
            lvl.MaxFailedOrders = maxFailed;
            lvl.MaxPlayersInLevel = Mathf.Min(4, idx + 2);
            lvl.PlayerSpawnPoints = new[]
            {
                new Vector3(-3f, -0.5f, 0),
                new Vector3(3f, -0.5f, 0),
                new Vector3(-3f, 0.5f, 0),
                new Vector3(3f, 0.5f, 0)
            };
            lvl.OrderSpawnInterval = Mathf.Max(6, 12f - idx * 2f);
            lvl.OrderSpawnIntervalVariance = 3f;
            lvl.MaxActiveOrders = 4 + idx;
            lvl.OrderTimeLimitBase = 45f - idx * 4f;
            lvl.OrderTimeLimitPerIngredient = 8f;
            lvl.AvailableRecipeNames = recipes;
            lvl.LevelTips = new[]
            {
                "💡 WASD / 方向键 移动，E 交互，Q 副交互，F 丢弃",
                "💡 单人模式按 Tab 切换不同角色",
                "💡 注意火焰颜色变化，红色说明正在烧焦"
            };
            lvl.StationPlacements = new[]
            {
                new StationPlacement { StationType = "IngredientBox", Position = new Vector3(-5.5f, 1.8f, 0), IngredientsProvided = new[] { "Lettuce", "Tomato", "Potato", "Carrot" } },
                new StationPlacement { StationType = "IngredientBox", Position = new Vector3(-5.5f, -1.8f, 0), IngredientsProvided = new[] { "Beef", "Onion", "Cheese", "Bun" } },
                new StationPlacement { StationType = "CuttingStation", Position = new Vector3(-2.2f, 1.8f, 0) },
                new StationPlacement { StationType = "CuttingStation", Position = new Vector3(-2.2f, -1.8f, 0) },
                new StationPlacement { StationType = "CookingStation", Position = new Vector3(0.5f, 1.8f, 0) },
                new StationPlacement { StationType = "CookingStation", Position = new Vector3(0.5f, -1.8f, 0) },
                new StationPlacement { StationType = "PlateStation", Position = new Vector3(3.2f, 1.8f, 0) },
                new StationPlacement { StationType = "WashingStation", Position = new Vector3(3.2f, -1.8f, 0) },
                new StationPlacement { StationType = "DeliveryStation", Position = new Vector3(6.5f, 0, 0) }
            };

            if (idx == 2)
            {
                lvl.Mechanics = new[]
                {
                    new LevelMechanic { Type = LevelMechanicType.TightCorridor, Enabled = true, Intensity = 1.1f },
                    new LevelMechanic { Type = LevelMechanicType.FireHazard, Enabled = true, Intensity = 0.9f }
                };
            }
            else
            {
                lvl.Mechanics = System.Array.Empty<LevelMechanic>();
            }
            return lvl;
        }

        static System.IO.DirectoryInfo Directory()
        {
            var full = System.IO.Path.Combine(UnityEngine.Application.dataPath, "Resources/Config");
            return System.IO.Directory.CreateDirectory(full);
        }
    }
}
#endif
