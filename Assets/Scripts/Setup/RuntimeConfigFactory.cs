using System.Collections.Generic;
using Kitchen.Config;
using Kitchen.Core;
using UnityEngine;

namespace Kitchen.Setup
{
    public static class RuntimeConfigFactory
    {
        private static Dictionary<string, IngredientConfig> _ingredients;
        private static Dictionary<string, RecipeConfig> _recipes;
        private static Dictionary<string, LevelConfig> _levels;
        private static bool _initialized;

        public static IReadOnlyDictionary<string, IngredientConfig> Ingredients => _ingredients;
        public static IReadOnlyDictionary<string, RecipeConfig> Recipes => _recipes;
        public static IReadOnlyDictionary<string, LevelConfig> Levels => _levels;

        public static void EnsureInitialized()
        {
            if (_initialized) return;
            _initialized = true;

            _ingredients = new Dictionary<string, IngredientConfig>();
            _recipes = new Dictionary<string, RecipeConfig>();
            _levels = new Dictionary<string, LevelConfig>();

            BuildIngredients();
            BuildRecipes();
            BuildLevels();

            GameManager.GetAllConfiguredLevels = GetAllLevelsSorted;
            LevelConfigRegistry.GetAllLevels = GetAllLevelsSorted;
        }

        private static IngredientConfig AddIng(string id, string name, Color color,
            bool chop, bool cook, float chopT = 1.5f, float cookT = 3f, float burnT = 8f)
        {
            var ing = ScriptableObject.CreateInstance<IngredientConfig>();
            ing.id = id; ing.displayName = name; ing.color = color;
            ing.requiresChopping = chop; ing.requiresCooking = cook;
            ing.chopTime = chopT; ing.cookTime = cookT; ing.burnTime = burnT;
            ing.defaultState = IngredientState.Raw;
            _ingredients[id] = ing;
            return ing;
        }

        private static void BuildIngredients()
        {
            AddIng("Ingredient_Tomato", "番茄", new Color(1f, 0.3f, 0.3f), true, false, 1.2f);
            AddIng("Ingredient_Lettuce", "生菜", new Color(0.3f, 0.8f, 0.3f), true, false, 1.0f);
            AddIng("Ingredient_Meat", "肉排", new Color(0.8f, 0.4f, 0.3f), true, true, 1.5f, 4f, 10f);
            AddIng("Ingredient_Fish", "鱼排", new Color(0.6f, 0.7f, 0.9f), false, true, 2f, 3f, 8f);
            AddIng("Ingredient_Cheese", "奶酪", new Color(1f, 0.9f, 0.4f), true, false, 0.8f);
            AddIng("Ingredient_Bread", "面包", new Color(0.9f, 0.7f, 0.4f), false, false, 0.5f);
            AddIng("Ingredient_Egg", "鸡蛋", new Color(1f, 0.95f, 0.7f), false, true, 0.8f, 2.5f, 6f);
            AddIng("Ingredient_Mushroom", "蘑菇", new Color(0.7f, 0.6f, 0.5f), true, true, 1f, 3f, 9f);
        }

        private static RecipeConfig AddRecipe(string id, string name, int baseS, float timeL, int coins,
            List<RecipeIngredient> ings, float difficulty)
        {
            var r = ScriptableObject.CreateInstance<RecipeConfig>();
            r.id = id; r.displayName = name; r.baseScore = baseS;
            r.timeLimitSeconds = timeL; r.prepareTime = 10f;
            r.requiredIngredients = ings; r.rewardCoins = coins; r.difficultyWeight = difficulty;
            _recipes[id] = r;
            return r;
        }

        private static RecipeIngredient RI(string ingId, int amt, IngredientState state)
        {
            return new RecipeIngredient { ingredient = _ingredients[ingId], amount = amt, requiredState = state };
        }

        private static void BuildRecipes()
        {
            AddRecipe("Recipe_Salad", "田园沙拉", 120, 50f, 15, new List<RecipeIngredient>
            {
                RI("Ingredient_Lettuce", 1, IngredientState.Chopped),
            }, 1.0f);

            AddRecipe("Recipe_Omelette", "煎蛋卷", 150, 45f, 20, new List<RecipeIngredient>
            {
                RI("Ingredient_Egg", 1, IngredientState.Cooked),
                RI("Ingredient_Cheese", 1, IngredientState.Chopped),
            }, 1.3f);

            AddRecipe("Recipe_Burger", "经典汉堡", 200, 70f, 25, new List<RecipeIngredient>
            {
                RI("Ingredient_Bread", 1, IngredientState.Raw),
                RI("Ingredient_Meat", 1, IngredientState.Cooked),
                RI("Ingredient_Lettuce", 1, IngredientState.Chopped),
                RI("Ingredient_Cheese", 1, IngredientState.Chopped),
            }, 1.8f);

            AddRecipe("Recipe_Fish", "烤鱼肉排", 250, 80f, 30, new List<RecipeIngredient>
            {
                RI("Ingredient_Fish", 1, IngredientState.Cooked),
                RI("Ingredient_Lettuce", 1, IngredientState.Chopped),
            }, 1.8f);

            AddRecipe("Recipe_Steak", "香煎牛排", 300, 90f, 35, new List<RecipeIngredient>
            {
                RI("Ingredient_Meat", 1, IngredientState.Cooked),
                RI("Ingredient_Mushroom", 1, IngredientState.Cooked),
            }, 2.2f);
        }

        private static void BuildLevels()
        {
            _levels["Level_1"] = BuildLevel1();
            _levels["Level_2"] = BuildLevel2();
            _levels["Level_3"] = BuildLevel3();
            _levels["Level_4"] = BuildLevel4();
            _levels["Level_5"] = BuildLevel5();
        }

        private static StationConfig S(StationType t, float x, float z, IngredientConfig ing = null, string id = null)
        {
            return new StationConfig
            {
                id = id ?? t.ToString() + "_" + x + "_" + z,
                type = t,
                position = new Vector3(x, 0, z),
                storedIngredient = ing,
                interactionRadius = 1.5f
            };
        }

        private static LevelConfig BuildLevel1()
        {
            var lv = ScriptableObject.CreateInstance<LevelConfig>();
            lv.levelId = "Level_1"; lv.displayName = "第1关：入门厨房";
            lv.description = "学习基本操作：取食材、切菜、装盘和出餐";
            lv.orderIndex = 1; lv.maxPlayers = 2; lv.minPlayers = 1;
            lv.levelDurationSeconds = 180f;
            lv.targetScore = 500; lv.oneStarScore = 500; lv.twoStarScore = 900; lv.threeStarScore = 1400;
            lv.orderSpawnInterval = 20f; lv.maxActiveOrders = 2; lv.isUnlockedByDefault = true;
            lv.availableRecipes = new List<RecipeConfig> { _recipes["Recipe_Salad"] };
            lv.availableIngredients = new List<IngredientConfig> { _ingredients["Ingredient_Lettuce"], _ingredients["Ingredient_Cheese"] };
            lv.stations = new List<StationConfig>
            {
                S(StationType.IngredientBox, -5.5f, -2.5f, _ingredients["Ingredient_Lettuce"], "box_lettuce"),
                S(StationType.IngredientBox, -5.5f, 0, _ingredients["Ingredient_Tomato"], "box_tomato"),
                S(StationType.IngredientBox, -5.5f, 2.5f, _ingredients["Ingredient_Cheese"], "box_cheese"),
                S(StationType.CuttingBoard, -2.5f, -2, null, "cut1"),
                S(StationType.CuttingBoard, -2.5f, 2, null, "cut2"),
                S(StationType.PlateStack, 1, -1, null, "plates"),
                S(StationType.PlateStack, 1, 1, null, "plates2"),
                S(StationType.ServingWindow, 5, 0, null, "serve"),
                S(StationType.Sink, 4.5f, -3, null, "sink"),
                S(StationType.Trash, -5.5f, 4.5f, null, "trash"),
            };
            lv.hazards = new List<LevelHazard>();
            lv.difficultyCurve = new DifficultyCurve { orderSpawnMultiplier = 0.98f, minOrderSpawnInterval = 12, scoreMultiplierIncrease = 0.03f, maxComplexityIncrease = 2 };
            lv.tutorial = new TutorialConfig
            {
                enableTutorial = true,
                autoAdvanceDelay = 1.5f,
                requireInputToAdvance = true,
                steps = new List<TutorialStep>
                {
                    new TutorialStep { id = "t1", instructionText = "【教程 1/6】使用 WASD 移动角色（P2：方向键）。移动一下继续。", requiredAction = TutorialAction.PressMove, timeLimit = 15f, showArrow = false },
                    new TutorialStep { id = "t2", instructionText = "【教程 2/6】走到生菜箱(绿)前按 E 取生菜", requiredAction = TutorialAction.PickUpIngredient, targetObjectId = "box_lettuce", timeLimit = 25f, showArrow = true },
                    new TutorialStep { id = "t3", instructionText = "【教程 3/6】走到菜板前按 E 开始切菜，等它切完。", requiredAction = TutorialAction.ChopIngredient, targetObjectId = "cut1", timeLimit = 25f, showArrow = true },
                    new TutorialStep { id = "t4", instructionText = "【教程 4/6】切好后自动持有，走到盘堆按 E 装盘成沙拉。", requiredAction = TutorialAction.PlateFood, targetObjectId = "plates", timeLimit = 25f, showArrow = true },
                    new TutorialStep { id = "t5", instructionText = "【教程 5/6】端到出餐窗口(最右)完成配送！", requiredAction = TutorialAction.ServeOrder, targetObjectId = "serve", timeLimit = 25f, showArrow = true },
                    new TutorialStep { id = "t6", instructionText = "【教程 6/6】单人模式下按 Tab 切换角色（当前可切菜的角色）", requiredAction = TutorialAction.SwitchCharacter, timeLimit = 15f, showArrow = false },
                }
            };
            return lv;
        }

        private static LevelConfig BuildLevel2()
        {
            var lv = ScriptableObject.CreateInstance<LevelConfig>();
            lv.levelId = "Level_2"; lv.displayName = "第2关：忙碌午餐";
            lv.description = "新增汉堡和煎蛋卷，更多订单！";
            lv.orderIndex = 2; lv.maxPlayers = 4; lv.minPlayers = 1;
            lv.levelDurationSeconds = 210f;
            lv.targetScore = 1000; lv.oneStarScore = 1000; lv.twoStarScore = 1600; lv.threeStarScore = 2200;
            lv.orderSpawnInterval = 16f; lv.maxActiveOrders = 3; lv.isUnlockedByDefault = false;
            lv.availableRecipes = new List<RecipeConfig> { _recipes["Recipe_Salad"], _recipes["Recipe_Omelette"], _recipes["Recipe_Burger"] };
            lv.availableIngredients = new List<IngredientConfig>
            { _ingredients["Ingredient_Lettuce"], _ingredients["Ingredient_Tomato"], _ingredients["Ingredient_Cheese"],
              _ingredients["Ingredient_Bread"], _ingredients["Ingredient_Meat"], _ingredients["Ingredient_Egg"] };
            lv.stations = BuildKitchenStations(3, true, lv.availableIngredients);
            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.CrowdedSpace, triggerTime = 90f, duration = 60f, magnitude = 0.5f, description = "空间拥挤" },
            };
            lv.difficultyCurve = new DifficultyCurve { orderSpawnMultiplier = 0.96f, minOrderSpawnInterval = 9, scoreMultiplierIncrease = 0.04f, maxComplexityIncrease = 3 };
            lv.tutorial = new TutorialConfig { enableTutorial = false };
            return lv;
        }

        private static LevelConfig BuildLevel3()
        {
            var lv = ScriptableObject.CreateInstance<LevelConfig>();
            lv.levelId = "Level_3"; lv.displayName = "第3关：热火灶台";
            lv.description = "小心烹饪时间过长会烧糊！";
            lv.orderIndex = 3; lv.maxPlayers = 4; lv.minPlayers = 1;
            lv.levelDurationSeconds = 240f;
            lv.targetScore = 1500; lv.oneStarScore = 1500; lv.twoStarScore = 2200; lv.threeStarScore = 3000;
            lv.orderSpawnInterval = 14f; lv.maxActiveOrders = 3; lv.isUnlockedByDefault = false;
            lv.availableRecipes = new List<RecipeConfig> { _recipes["Recipe_Salad"], _recipes["Recipe_Burger"], _recipes["Recipe_Steak"], _recipes["Recipe_Omelette"] };
            lv.availableIngredients = new List<IngredientConfig>
            { _ingredients["Ingredient_Lettuce"], _ingredients["Ingredient_Tomato"], _ingredients["Ingredient_Cheese"],
              _ingredients["Ingredient_Bread"], _ingredients["Ingredient_Meat"], _ingredients["Ingredient_Egg"], _ingredients["Ingredient_Mushroom"] };
            lv.stations = BuildKitchenStations(5, true, lv.availableIngredients);
            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.Fire, triggerTime = 80f, duration = 10f, magnitude = 1f, description = "火灾" },
                new LevelHazard { type = HazardType.PowerOutage, triggerTime = 160f, duration = 8f, magnitude = 0.5f, description = "停电" },
            };
            lv.difficultyCurve = new DifficultyCurve { orderSpawnMultiplier = 0.94f, minOrderSpawnInterval = 8, scoreMultiplierIncrease = 0.05f, maxComplexityIncrease = 4 };
            lv.tutorial = new TutorialConfig { enableTutorial = false };
            return lv;
        }

        private static LevelConfig BuildLevel4()
        {
            var lv = ScriptableObject.CreateInstance<LevelConfig>();
            lv.levelId = "Level_4"; lv.displayName = "第4关：美食专家";
            lv.description = "鱼排、牛排、汉堡全部上场！";
            lv.orderIndex = 4; lv.maxPlayers = 4; lv.minPlayers = 2;
            lv.levelDurationSeconds = 270f;
            lv.targetScore = 2200; lv.oneStarScore = 2200; lv.twoStarScore = 3200; lv.threeStarScore = 4200;
            lv.orderSpawnInterval = 12f; lv.maxActiveOrders = 4; lv.isUnlockedByDefault = false;
            lv.availableRecipes = new List<RecipeConfig> { _recipes["Recipe_Burger"], _recipes["Recipe_Steak"], _recipes["Recipe_Fish"], _recipes["Recipe_Salad"] };
            lv.availableIngredients = new List<IngredientConfig>
            { _ingredients["Ingredient_Meat"], _ingredients["Ingredient_Fish"], _ingredients["Ingredient_Lettuce"],
              _ingredients["Ingredient_Tomato"], _ingredients["Ingredient_Cheese"], _ingredients["Ingredient_Bread"], _ingredients["Ingredient_Mushroom"] };
            lv.stations = BuildKitchenStations(7, true, lv.availableIngredients);
            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.MovingTable, triggerTime = 70f, duration = 25f, magnitude = 1.5f, description = "工作台移动" },
                new LevelHazard { type = HazardType.Fire, triggerTime = 150f, duration = 12f, magnitude = 1.2f, description = "火灾" },
                new LevelHazard { type = HazardType.SlipperyFloor, triggerTime = 200f, duration = 20f, magnitude = 1f, description = "湿滑" },
            };
            lv.difficultyCurve = new DifficultyCurve { orderSpawnMultiplier = 0.92f, minOrderSpawnInterval = 7, scoreMultiplierIncrease = 0.05f, maxComplexityIncrease = 5 };
            lv.tutorial = new TutorialConfig { enableTutorial = false };
            return lv;
        }

        private static LevelConfig BuildLevel5()
        {
            var lv = ScriptableObject.CreateInstance<LevelConfig>();
            lv.levelId = "Level_5"; lv.displayName = "第5关：疯狂厨房";
            lv.description = "终极挑战，所有机关同时出现！";
            lv.orderIndex = 5; lv.maxPlayers = 4; lv.minPlayers = 2;
            lv.levelDurationSeconds = 300f;
            lv.targetScore = 3500; lv.oneStarScore = 3500; lv.twoStarScore = 5000; lv.threeStarScore = 6500;
            lv.orderSpawnInterval = 10f; lv.maxActiveOrders = 5; lv.isUnlockedByDefault = false;
            lv.availableRecipes = new List<RecipeConfig> { _recipes["Recipe_Steak"], _recipes["Recipe_Fish"], _recipes["Recipe_Burger"] };
            lv.availableIngredients = new List<IngredientConfig>
            { _ingredients["Ingredient_Meat"], _ingredients["Ingredient_Fish"], _ingredients["Ingredient_Mushroom"],
              _ingredients["Ingredient_Lettuce"], _ingredients["Ingredient_Tomato"], _ingredients["Ingredient_Cheese"],
              _ingredients["Ingredient_Bread"], _ingredients["Ingredient_Egg"] };
            lv.stations = BuildKitchenStations(9, true, lv.availableIngredients);
            lv.hazards = new List<LevelHazard>
            {
                new LevelHazard { type = HazardType.PowerOutage, triggerTime = 50f, duration = 6f, magnitude = 0.8f, description = "停电" },
                new LevelHazard { type = HazardType.MovingTable, triggerTime = 100f, duration = 30f, magnitude = 2f, description = "晃动" },
                new LevelHazard { type = HazardType.Fire, triggerTime = 170f, duration = 15f, magnitude = 1.5f, description = "大火" },
                new LevelHazard { type = HazardType.SlipperyFloor, triggerTime = 220f, duration = 25f, magnitude = 1.2f, description = "湿滑" },
                new LevelHazard { type = HazardType.CrowdedSpace, triggerTime = 260f, duration = 40f, magnitude = 1f, description = "拥挤" },
            };
            lv.difficultyCurve = new DifficultyCurve { orderSpawnMultiplier = 0.9f, minOrderSpawnInterval = 5, scoreMultiplierIncrease = 0.06f, maxComplexityIncrease = 5 };
            lv.tutorial = new TutorialConfig { enableTutorial = false };
            return lv;
        }

        private static List<StationConfig> BuildKitchenStations(int stoves, bool hasSink, List<IngredientConfig> ingredients)
        {
            var list = new List<StationConfig>();
            float z = -3.5f;
            foreach (var ing in ingredients)
            {
                list.Add(S(StationType.IngredientBox, -6f, z, ing, "box_" + ing.id));
                z += 1.1f;
            }
            list.Add(S(StationType.CuttingBoard, -2.5f, -2.8f, null, "cut1"));
            list.Add(S(StationType.CuttingBoard, -2.5f, 0, null, "cut2"));
            list.Add(S(StationType.CuttingBoard, -2.5f, 2.8f, null, "cut3"));
            float sz = -3f;
            for (int i = 0; i < stoves; i++)
            {
                list.Add(S(StationType.Stove, 0.5f, sz, null, "stove" + i));
                sz += 1.0f;
            }
            list.Add(S(StationType.PlateStack, 3.5f, -1.2f, null, "plates1"));
            list.Add(S(StationType.PlateStack, 3.5f, 1.2f, null, "plates2"));
            list.Add(S(StationType.ServingWindow, 6.5f, -1f, null, "serve1"));
            list.Add(S(StationType.ServingWindow, 6.5f, 1.8f, null, "serve2"));
            if (hasSink) list.Add(S(StationType.Sink, 4, 4f, null, "sink"));
            list.Add(S(StationType.Trash, 6.5f, -4f, null, "trash"));
            return list;
        }

        public static LevelConfig[] GetAllLevelsSorted()
        {
            EnsureInitialized();
            var all = new List<LevelConfig>(_levels.Values);
            all.Sort((a, b) => a.orderIndex.CompareTo(b.orderIndex));
            return all.ToArray();
        }

        public static LevelConfig GetLevelById(string id)
        {
            EnsureInitialized();
            return _levels.TryGetValue(id, out var lv) ? lv : null;
        }
    }
}
