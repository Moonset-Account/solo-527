#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using Kitchen.Config;

namespace Kitchen.EditorTools
{
    public static class ConfigAssetFactory
    {
        [MenuItem("Kitchen/Config/Generate Default Assets")]
        public static void GenerateDefaultAssets()
        {
            string rootFolder = "Assets/Resources/Config";
            if (!System.IO.Directory.Exists(rootFolder))
                System.IO.Directory.CreateDirectory(rootFolder);

            IngredientConfig tomato = CreateIngredient("Ingredient_Tomato", "番茄", new Color(1f, 0.3f, 0.3f), true, false, 1.2f);
            IngredientConfig lettuce = CreateIngredient("Ingredient_Lettuce", "生菜", new Color(0.3f, 0.8f, 0.3f), true, false, 1.0f);
            IngredientConfig meat = CreateIngredient("Ingredient_Meat", "肉排", new Color(0.8f, 0.4f, 0.3f), true, true, 1.5f, 4f, 10f);
            IngredientConfig fish = CreateIngredient("Ingredient_Fish", "鱼排", new Color(0.6f, 0.7f, 0.9f), false, true, 2f, 3f, 8f);
            IngredientConfig cheese = CreateIngredient("Ingredient_Cheese", "奶酪", new Color(1f, 0.9f, 0.4f), true, false, 0.8f);
            IngredientConfig bread = CreateIngredient("Ingredient_Bread", "面包", new Color(0.9f, 0.7f, 0.4f), false, false, 0.5f);
            IngredientConfig egg = CreateIngredient("Ingredient_Egg", "鸡蛋", new Color(1f, 0.95f, 0.7f), false, true, 0.8f, 2.5f, 6f);
            IngredientConfig mushroom = CreateIngredient("Ingredient_Mushroom", "蘑菇", new Color(0.7f, 0.6f, 0.5f), true, true, 1f, 3f, 9f);

            RecipeConfig salad = CreateRecipe(
                "Recipe_Salad", "田园沙拉", 120, 50f, 15,
                new List<RecipeIngredient>
                {
                    new RecipeIngredient { ingredient = lettuce, amount = 1, requiredState = IngredientState.Chopped },
                    new RecipeIngredient { ingredient = tomato, amount = 1, requiredState = IngredientState.Chopped },
                }, 15, 1.0f);

            RecipeConfig burger = CreateRecipe(
                "Recipe_Burger", "经典汉堡", 200, 70f, 20,
                new List<RecipeIngredient>
                {
                    new RecipeIngredient { ingredient = bread, amount = 1, requiredState = IngredientState.Raw },
                    new RecipeIngredient { ingredient = meat, amount = 1, requiredState = IngredientState.Cooked },
                    new RecipeIngredient { ingredient = lettuce, amount = 1, requiredState = IngredientState.Chopped },
                    new RecipeIngredient { ingredient = cheese, amount = 1, requiredState = IngredientState.Chopped },
                }, 25, 1.8f);

            RecipeConfig steak = CreateRecipe(
                "Recipe_Steak", "香煎牛排", 300, 90f, 30,
                new List<RecipeIngredient>
                {
                    new RecipeIngredient { ingredient = meat, amount = 1, requiredState = IngredientState.Cooked },
                    new RecipeIngredient { ingredient = mushroom, amount = 1, requiredState = IngredientState.Cooked },
                }, 35, 2.2f);

            RecipeConfig fishDish = CreateRecipe(
                "Recipe_Fish", "烤鱼肉排", 250, 80f, 25,
                new List<RecipeIngredient>
                {
                    new RecipeIngredient { ingredient = fish, amount = 1, requiredState = IngredientState.Cooked },
                    new RecipeIngredient { ingredient = lettuce, amount = 1, requiredState = IngredientState.Chopped },
                }, 30, 1.8f);

            RecipeConfig omelette = CreateRecipe(
                "Recipe_Omelette", "煎蛋卷", 150, 45f, 12,
                new List<RecipeIngredient>
                {
                    new RecipeIngredient { ingredient = egg, amount = 1, requiredState = IngredientState.Cooked },
                    new RecipeIngredient { ingredient = cheese, amount = 1, requiredState = IngredientState.Chopped },
                }, 20, 1.3f);

            CreateLevel_1_Tutorial(salad, tomato, lettuce, cheese, bread);
            CreateLevel_2_Basic(salad, burger, omelette, tomato, lettuce, cheese, bread, meat, egg);
            CreateLevel_3_Kitchen(salad, burger, steak, omelette, tomato, lettuce, cheese, bread, meat, egg, mushroom);
            CreateLevel_4_Expert(burger, steak, fishDish, salad, meat, fish, lettuce, tomato, cheese, bread, mushroom);
            CreateLevel_5_Frenzy(steak, fishDish, burger, meat, fish, mushroom, lettuce, tomato, cheese, bread, egg);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[Kitchen] Default config assets generated!");
        }

        private static IngredientConfig CreateIngredient(string id, string name, Color color,
            bool needsChop, bool needsCook, float chopTime = 1.5f, float cookTime = 3f, float burnTime = 8f)
        {
            string path = $"Assets/Resources/Config/{id}.asset";
            IngredientConfig asset = AssetDatabase.LoadAssetAtPath<IngredientConfig>(path);
            if (asset == null)
            {
                asset = ScriptableObject.CreateInstance<IngredientConfig>();
                AssetDatabase.CreateAsset(asset, path);
            }
            asset.id = id;
            asset.displayName = name;
            asset.color = color;
            asset.requiresChopping = needsChop;
            asset.requiresCooking = needsCook;
            asset.chopTime = chopTime;
            asset.cookTime = cookTime;
            asset.burnTime = burnTime;
            asset.defaultState = IngredientState.Raw;
            EditorUtility.SetDirty(asset);
            return asset;
        }

        private static RecipeConfig CreateRecipe(string id, string name, int baseScore,
            float timeLimit, float prepareTime, List<RecipeIngredient> ingredients,
            int rewardCoins, float difficultyWeight)
        {
            string path = $"Assets/Resources/Config/{id}.asset";
            RecipeConfig asset = AssetDatabase.LoadAssetAtPath<RecipeConfig>(path);
            if (asset == null)
            {
                asset = ScriptableObject.CreateInstance<RecipeConfig>();
                AssetDatabase.CreateAsset(asset, path);
            }
            asset.id = id;
            asset.displayName = name;
            asset.baseScore = baseScore;
            asset.timeLimitSeconds = timeLimit;
            asset.prepareTime = prepareTime;
            asset.requiredIngredients = ingredients;
            asset.rewardCoins = rewardCoins;
            asset.difficultyWeight = difficultyWeight;
            EditorUtility.SetDirty(asset);
            return asset;
        }

        private static void CreateLevel_1_Tutorial(params ScriptableObject[] deps)
        {
            RecipeConfig salad = FindByName<RecipeConfig>("Recipe_Salad");
            IngredientConfig tomato = FindByName<IngredientConfig>("Ingredient_Tomato");
            IngredientConfig lettuce = FindByName<IngredientConfig>("Ingredient_Lettuce");
            IngredientConfig cheese = FindByName<IngredientConfig>("Ingredient_Cheese");
            IngredientConfig bread = FindByName<IngredientConfig>("Ingredient_Bread");

            string path = "Assets/Resources/Config/Level_1_Tutorial.asset";
            LevelConfig lv = AssetDatabase.LoadAssetAtPath<LevelConfig>(path);
            if (lv == null) { lv = ScriptableObject.CreateInstance<LevelConfig>(); AssetDatabase.CreateAsset(lv, path); }

            lv.levelId = "Level_1";
            lv.displayName = "第1关：入门厨房";
            lv.description = "学习基本操作：取食材、切菜、装盘和出餐";
            lv.orderIndex = 1;
            lv.maxPlayers = 2;
            lv.minPlayers = 1;
            lv.levelDurationSeconds = 180f;
            lv.targetScore = 500;
            lv.oneStarScore = 500;
            lv.twoStarScore = 900;
            lv.threeStarScore = 1400;
            lv.orderSpawnInterval = 20f;
            lv.maxActiveOrders = 2;
            lv.isUnlockedByDefault = true;

            lv.availableRecipes = new List<RecipeConfig> { salad };
            lv.availableIngredients = new List<IngredientConfig> { tomato, lettuce, cheese, bread };

            lv.stations = new List<StationConfig>
            {
                new StationConfig { id = "box_lettuce", type = StationType.IngredientBox, position = new Vector3(-4,0,-2), storedIngredient = lettuce, interactionRadius = 1.5f },
                new StationConfig { id = "box_tomato", type = StationType.IngredientBox, position = new Vector3(-4,0,0), storedIngredient = tomato },
                new StationConfig { id = "box_cheese", type = StationType.IngredientBox, position = new Vector3(-4,0,2), storedIngredient = cheese },
                new StationConfig { id = "cut1", type = StationType.CuttingBoard, position = new Vector3(-1,0,-1.5f) },
                new StationConfig { id = "cut2", type = StationType.CuttingBoard, position = new Vector3(-1,0,1.5f) },
                new StationConfig { id = "plates", type = StationType.PlateStack, position = new Vector3(2,0,0) },
                new StationConfig { id = "serve", type = StationType.ServingWindow, position = new Vector3(5,0,0) },
                new StationConfig { id = "sink", type = StationType.Sink, position = new Vector3(2,0,3) },
                new StationConfig { id = "trash", type = StationType.Trash, position = new Vector3(-4,0,4) },
            };

            lv.hazards = new List<LevelHazard>();
            lv.difficultyCurve = new DifficultyCurve
            {
                orderSpawnMultiplier = 0.98f,
                minOrderSpawnInterval = 12,
                scoreMultiplierIncrease = 0.03f,
                maxComplexityIncrease = 2
            };

            lv.tutorial = new TutorialConfig
            {
                enableTutorial = true,
                autoAdvanceDelay = 1.5f,
                requireInputToAdvance = true,
                steps = new List<TutorialStep>
                {
                    new TutorialStep { id = "t1", instructionText = "欢迎来到限时厨房！使用 WASD 或方向键移动角色", requiredAction = TutorialAction.PressMove, timeLimit = 10f, showArrow = false },
                    new TutorialStep { id = "t2", instructionText = "走到生菜箱前按 E 键拿取生菜", requiredAction = TutorialAction.PickUpIngredient, targetObjectId = "box_lettuce", timeLimit = 20f, showArrow = true },
                    new TutorialStep { id = "t3", instructionText = "走到菜板按 E 键开始切菜", requiredAction = TutorialAction.ChopIngredient, targetObjectId = "cut1", timeLimit = 20f, showArrow = true },
                    new TutorialStep { id = "t4", instructionText = "切好后取到生菜，然后走到盘堆装盘", requiredAction = TutorialAction.PlateFood, targetObjectId = "plates", timeLimit = 20f, showArrow = true },
                    new TutorialStep { id = "t5", instructionText = "端到出餐窗口完成配送！", requiredAction = TutorialAction.ServeOrder, targetObjectId = "serve", timeLimit = 20f, showArrow = true },
                    new TutorialStep { id = "t6", instructionText = "单人模式下按 Tab 可切换角色", requiredAction = TutorialAction.SwitchCharacter, timeLimit = 15f, showArrow = false },
                }
            };

            EditorUtility.SetDirty(lv);
        }

        private static void CreateLevel_2_Basic(params ScriptableObject[] deps)
        {
            string path = "Assets/Resources/Config/Level_2_Basic.asset";
            LevelConfig lv = AssetDatabase.LoadAssetAtPath<LevelConfig>(path);
            if (lv == null) { lv = ScriptableObject.CreateInstance<LevelConfig>(); AssetDatabase.CreateAsset(lv, path); }

            lv.levelId = "Level_2";
            lv.displayName = "第2关：忙碌午餐";
            lv.description = "现在有更多订单和灶台了，尝试分工合作！";
            lv.orderIndex = 2;
            lv.maxPlayers = 4;
            lv.minPlayers = 1;
            lv.levelDurationSeconds = 210f;
            lv.targetScore = 1000;
            lv.oneStarScore = 1000;
            lv.twoStarScore = 1600;
            lv.threeStarScore = 2200;
            lv.orderSpawnInterval = 16f;
            lv.maxActiveOrders = 3;
            lv.isUnlockedByDefault = false;

            lv.availableRecipes = new List<RecipeConfig>
            {
                FindByName<RecipeConfig>("Recipe_Salad"),
                FindByName<RecipeConfig>("Recipe_Burger"),
                FindByName<RecipeConfig>("Recipe_Omelette"),
            };
            lv.availableIngredients = new List<IngredientConfig>
            {
                FindByName<IngredientConfig>("Ingredient_Tomato"),
                FindByName<IngredientConfig>("Ingredient_Lettuce"),
                FindByName<IngredientConfig>("Ingredient_Cheese"),
                FindByName<IngredientConfig>("Ingredient_Bread"),
                FindByName<IngredientConfig>("Ingredient_Meat"),
                FindByName<IngredientConfig>("Ingredient_Egg"),
            };

            lv.stations = GenerateKitchenStations(4, true, lv.availableIngredients);

            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.CrowdedSpace, triggerTime = 90f, duration = 60f, magnitude = 0.5f, description = "空间拥挤，食材堆放受限" },
            };

            lv.difficultyCurve = new DifficultyCurve
            {
                orderSpawnMultiplier = 0.96f,
                minOrderSpawnInterval = 9,
                scoreMultiplierIncrease = 0.04f,
                maxComplexityIncrease = 3
            };

            lv.tutorial = new TutorialConfig { enableTutorial = false };
            EditorUtility.SetDirty(lv);
        }

        private static void CreateLevel_3_Kitchen(params ScriptableObject[] deps)
        {
            string path = "Assets/Resources/Config/Level_3_Kitchen.asset";
            LevelConfig lv = AssetDatabase.LoadAssetAtPath<LevelConfig>(path);
            if (lv == null) { lv = ScriptableObject.CreateInstance<LevelConfig>(); AssetDatabase.CreateAsset(lv, path); }

            lv.levelId = "Level_3";
            lv.displayName = "第3关：热火灶台";
            lv.description = "小心烹饪时间过长会烧糊！注意火灾风险";
            lv.orderIndex = 3;
            lv.maxPlayers = 4;
            lv.minPlayers = 1;
            lv.levelDurationSeconds = 240f;
            lv.targetScore = 1500;
            lv.oneStarScore = 1500;
            lv.twoStarScore = 2200;
            lv.threeStarScore = 3000;
            lv.orderSpawnInterval = 14f;
            lv.maxActiveOrders = 3;
            lv.isUnlockedByDefault = false;

            lv.availableRecipes = new List<RecipeConfig>
            {
                FindByName<RecipeConfig>("Recipe_Salad"),
                FindByName<RecipeConfig>("Recipe_Burger"),
                FindByName<RecipeConfig>("Recipe_Steak"),
                FindByName<RecipeConfig>("Recipe_Omelette"),
            };
            lv.availableIngredients = new List<IngredientConfig>
            {
                FindByName<IngredientConfig>("Ingredient_Tomato"),
                FindByName<IngredientConfig>("Ingredient_Lettuce"),
                FindByName<IngredientConfig>("Ingredient_Cheese"),
                FindByName<IngredientConfig>("Ingredient_Bread"),
                FindByName<IngredientConfig>("Ingredient_Meat"),
                FindByName<IngredientConfig>("Ingredient_Egg"),
                FindByName<IngredientConfig>("Ingredient_Mushroom"),
            };

            lv.stations = GenerateKitchenStations(6, true, lv.availableIngredients);

            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.Fire, triggerTime = 80f, duration = 10f, magnitude = 1f, description = "灶台火灾！" },
                new LevelHazard { type = HazardType.PowerOutage, triggerTime = 160f, duration = 8f, magnitude = 0.5f, description = "短暂停电" },
            };

            lv.difficultyCurve = new DifficultyCurve
            {
                orderSpawnMultiplier = 0.94f,
                minOrderSpawnInterval = 8,
                scoreMultiplierIncrease = 0.05f,
                maxComplexityIncrease = 4
            };

            lv.tutorial = new TutorialConfig { enableTutorial = false };
            EditorUtility.SetDirty(lv);
        }

        private static void CreateLevel_4_Expert(params ScriptableObject[] deps)
        {
            string path = "Assets/Resources/Config/Level_4_Expert.asset";
            LevelConfig lv = AssetDatabase.LoadAssetAtPath<LevelConfig>(path);
            if (lv == null) { lv = ScriptableObject.CreateInstance<LevelConfig>(); AssetDatabase.CreateAsset(lv, path); }

            lv.levelId = "Level_4";
            lv.displayName = "第4关：美食专家";
            lv.description = "鱼排、牛排、汉堡全部上场，保持冷静！";
            lv.orderIndex = 4;
            lv.maxPlayers = 4;
            lv.minPlayers = 2;
            lv.levelDurationSeconds = 270f;
            lv.targetScore = 2200;
            lv.oneStarScore = 2200;
            lv.twoStarScore = 3200;
            lv.threeStarScore = 4200;
            lv.orderSpawnInterval = 12f;
            lv.maxActiveOrders = 4;
            lv.isUnlockedByDefault = false;

            lv.availableRecipes = new List<RecipeConfig>
            {
                FindByName<RecipeConfig>("Recipe_Burger"),
                FindByName<RecipeConfig>("Recipe_Steak"),
                FindByName<RecipeConfig>("Recipe_Fish"),
                FindByName<RecipeConfig>("Recipe_Salad"),
            };
            lv.availableIngredients = new List<IngredientConfig>
            {
                FindByName<IngredientConfig>("Ingredient_Meat"),
                FindByName<IngredientConfig>("Ingredient_Fish"),
                FindByName<IngredientConfig>("Ingredient_Lettuce"),
                FindByName<IngredientConfig>("Ingredient_Tomato"),
                FindByName<IngredientConfig>("Ingredient_Cheese"),
                FindByName<IngredientConfig>("Ingredient_Bread"),
                FindByName<IngredientConfig>("Ingredient_Mushroom"),
            };

            lv.stations = GenerateKitchenStations(8, true, lv.availableIngredients);

            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.MovingTable, triggerTime = 70f, duration = 25f, magnitude = 1.5f, description = "工作台移动中！" },
                new LevelHazard { type = HazardType.Fire, triggerTime = 150f, duration = 12f, magnitude = 1.2f, description = "多处火灾！" },
                new LevelHazard { type = HazardType.SlipperyFloor, triggerTime = 200f, duration = 20f, magnitude = 1f, description = "地面湿滑！" },
            };

            lv.difficultyCurve = new DifficultyCurve
            {
                orderSpawnMultiplier = 0.92f,
                minOrderSpawnInterval = 7,
                scoreMultiplierIncrease = 0.05f,
                maxComplexityIncrease = 5
            };

            lv.tutorial = new TutorialConfig { enableTutorial = false };
            EditorUtility.SetDirty(lv);
        }

        private static void CreateLevel_5_Frenzy(params ScriptableObject[] deps)
        {
            string path = "Assets/Resources/Config/Level_5_Frenzy.asset";
            LevelConfig lv = AssetDatabase.LoadAssetAtPath<LevelConfig>(path);
            if (lv == null) { lv = ScriptableObject.CreateInstance<LevelConfig>(); AssetDatabase.CreateAsset(lv, path); }

            lv.levelId = "Level_5";
            lv.displayName = "第5关：疯狂厨房";
            lv.description = "所有食谱、所有机关，你准备好了吗？";
            lv.orderIndex = 5;
            lv.maxPlayers = 4;
            lv.minPlayers = 2;
            lv.levelDurationSeconds = 300f;
            lv.targetScore = 3500;
            lv.oneStarScore = 3500;
            lv.twoStarScore = 5000;
            lv.threeStarScore = 6500;
            lv.orderSpawnInterval = 10f;
            lv.maxActiveOrders = 5;
            lv.isUnlockedByDefault = false;

            lv.availableRecipes = new List<RecipeConfig>
            {
                FindByName<RecipeConfig>("Recipe_Steak"),
                FindByName<RecipeConfig>("Recipe_Fish"),
                FindByName<RecipeConfig>("Recipe_Burger"),
            };
            lv.availableIngredients = new List<IngredientConfig>
            {
                FindByName<IngredientConfig>("Ingredient_Meat"),
                FindByName<IngredientConfig>("Ingredient_Fish"),
                FindByName<IngredientConfig>("Ingredient_Mushroom"),
                FindByName<IngredientConfig>("Ingredient_Lettuce"),
                FindByName<IngredientConfig>("Ingredient_Tomato"),
                FindByName<IngredientConfig>("Ingredient_Cheese"),
                FindByName<IngredientConfig>("Ingredient_Bread"),
                FindByName<IngredientConfig>("Ingredient_Egg"),
            };

            lv.stations = GenerateKitchenStations(10, true, lv.availableIngredients);

            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.PowerOutage, triggerTime = 50f, duration = 6f, magnitude = 0.8f, description = "停电！" },
                new LevelHazard { type = HazardType.MovingTable, triggerTime = 100f, duration = 30f, magnitude = 2f, description = "工作台剧烈晃动！" },
                new LevelHazard { type = HazardType.Fire, triggerTime = 170f, duration = 15f, magnitude = 1.5f, description = "大火！" },
                new LevelHazard { type = HazardType.SlipperyFloor, triggerTime = 220f, duration = 25f, magnitude = 1.2f, description = "大面积湿滑！" },
                new LevelHazard { type = HazardType.CrowdedSpace, triggerTime = 260f, duration = 40f, magnitude = 1f, description = "通道拥挤！" },
            };

            lv.difficultyCurve = new DifficultyCurve
            {
                orderSpawnMultiplier = 0.9f,
                minOrderSpawnInterval = 5,
                scoreMultiplierIncrease = 0.06f,
                maxComplexityIncrease = 5
            };

            lv.tutorial = new TutorialConfig { enableTutorial = false };
            EditorUtility.SetDirty(lv);
        }

        private static List<StationConfig> GenerateKitchenStations(int stoveCount, bool hasSink, List<IngredientConfig> ingredients)
        {
            List<StationConfig> stations = new List<StationConfig>();
            float z = -3f;
            foreach (var ing in ingredients)
            {
                stations.Add(new StationConfig
                {
                    id = $"box_{ing.id}",
                    type = StationType.IngredientBox,
                    position = new Vector3(-5, 0, z),
                    storedIngredient = ing
                });
                z += 1.2f;
            }

            for (int i = 0; i < 3; i++)
            {
                stations.Add(new StationConfig
                {
                    id = $"cut_{i}",
                    type = StationType.CuttingBoard,
                    position = new Vector3(-1.5f, 0, -2.5f + i * 2.5f)
                });
            }

            for (int i = 0; i < stoveCount; i++)
            {
                stations.Add(new StationConfig
                {
                    id = $"stove_{i}",
                    type = StationType.Stove,
                    position = new Vector3(0.5f, 0, -3f + i * 1.0f)
                });
            }

            stations.Add(new StationConfig { id = "plates", type = StationType.PlateStack, position = new Vector3(3f, 0, -1f) });
            stations.Add(new StationConfig { id = "plates_2", type = StationType.PlateStack, position = new Vector3(3f, 0, 1f) });
            stations.Add(new StationConfig { id = "serve", type = StationType.ServingWindow, position = new Vector3(6f, 0, 0) });
            stations.Add(new StationConfig { id = "serve_2", type = StationType.ServingWindow, position = new Vector3(6f, 0, 2.5f) });
            if (hasSink)
            {
                stations.Add(new StationConfig { id = "sink", type = StationType.Sink, position = new Vector3(3f, 0, 3.5f) });
            }
            stations.Add(new StationConfig { id = "trash", type = StationType.Trash, position = new Vector3(5.5f, 0, -3f) });
            return stations;
        }

        private static T FindByName<T>(string name) where T : ScriptableObject
        {
            string[] guids = AssetDatabase.FindAssets(name);
            foreach (var g in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(g);
                T asset = AssetDatabase.LoadAssetAtPath<T>(path);
                if (asset != null) return asset;
            }
            return null;
        }
    }
}
#endif
