using UnityEngine;
using System.Collections.Generic;

public static class RuntimeDataFactory
{
    private static Dictionary<string, Ingredient> ingredientCache = new Dictionary<string, Ingredient>();
    private static Dictionary<string, Recipe> recipeCache = new Dictionary<string, Recipe>();

    public static LevelData CreateLevelData(int levelIndex)
    {
        switch (levelIndex)
        {
            case 0: return CreateLevel0();
            case 1: return CreateLevel1();
            case 2: return CreateLevel2();
            default: return null;
        }
    }

    public static Ingredient CreateIngredient(string name, float prep, float cook, float burn)
    {
        if (ingredientCache.TryGetValue(name, out Ingredient existing))
            return existing;

        Ingredient ingredient = ScriptableObject.CreateInstance<Ingredient>();
        ingredient.ingredientName = name;
        ingredient.prepTime = prep;
        ingredient.cookTime = cook;
        ingredient.burnTime = burn;
        ingredientCache[name] = ingredient;
        return ingredient;
    }

    public static Recipe CreateRecipe(string name, int scoreValue, List<Ingredient> ingredients, float cookTime)
    {
        if (recipeCache.TryGetValue(name, out Recipe existing))
            return existing;

        Recipe recipe = ScriptableObject.CreateInstance<Recipe>();
        recipe.recipeName = name;
        recipe.scoreValue = scoreValue;
        recipe.requiredIngredients = new List<Ingredient>(ingredients);
        recipe.cookTime = cookTime;
        recipe.platingTime = 1f;
        recipeCache[name] = recipe;
        return recipe;
    }

    public static List<LevelData> CreateAllLevels()
    {
        List<LevelData> levels = new List<LevelData>();
        for (int i = 0; i < 3; i++)
        {
            LevelData level = CreateLevelData(i);
            if (level != null)
                levels.Add(level);
        }
        return levels;
    }

    private static LevelData CreateLevel0()
    {
        LevelData data = ScriptableObject.CreateInstance<LevelData>();
        data.levelName = "烹饪入门";
        data.levelIndex = 0;
        data.description = "学习基本操作：取食材、切菜、烹饪和装盘";
        data.timeLimit = 180f;
        data.orderInterval = 30f;
        data.maxOrders = 2;
        data.targetScore = 100;
        data.targetScore2Stars = 200;
        data.targetScore3Stars = 300;
        data.hasConveyorBelt = false;
        data.conveyorSpeed = 0f;
        data.isTutorialLevel = true;

        Ingredient tomato = CreateIngredient("tomato", 2f, 0f, 0f);
        Ingredient lettuce = CreateIngredient("lettuce", 1f, 0f, 0f);

        Recipe tomatoSalad = CreateRecipe("番茄沙拉", 50, new List<Ingredient> { tomato, lettuce }, 0f);

        data.availableIngredients = new List<Ingredient> { tomato, lettuce };
        data.availableRecipes = new List<Recipe> { tomatoSalad };

        data.stationLayout = new List<StationLayoutEntry>
        {
            new StationLayoutEntry { stationType = StationType.Ingredient, position = new Vector3(0, -2, 0), rotation = 0f, stationName = "食材站", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Prep, position = new Vector3(-2, 0, 0), rotation = 0f, stationName = "备菜台", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Cooking, position = new Vector3(2, 0, 0), rotation = 0f, stationName = "灶台", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Plating, position = new Vector3(0, 2, 0), rotation = 0f, stationName = "装盘台", isLocked = false }
        };

        data.spatialConstraints = new List<SpatialConstraint>();

        data.tutorialSteps = new List<TutorialStep>
        {
            new TutorialStep { stepIndex = 0, description = "走向食材站，按E取食材", targetStationType = StationType.Ingredient, requiredAction = "Interact", isCompleted = false, highlightPosition = new Vector2(0, -2), highlightRadius = 1.5f },
            new TutorialStep { stepIndex = 1, description = "走到备菜台，按E切菜", targetStationType = StationType.Prep, requiredAction = "Interact", isCompleted = false, highlightPosition = new Vector2(-2, 0), highlightRadius = 1.5f },
            new TutorialStep { stepIndex = 2, description = "走到装盘台，按E装盘（沙拉无需烹饪）", targetStationType = StationType.Plating, requiredAction = "Interact", isCompleted = false, highlightPosition = new Vector2(0, 2), highlightRadius = 1.5f },
            new TutorialStep { stepIndex = 3, description = "按E送餐完成订单！", targetStationType = StationType.Plating, requiredAction = "Interact", isCompleted = false, highlightPosition = new Vector2(0, 2), highlightRadius = 1.5f }
        };

        return data;
    }

    private static LevelData CreateLevel1()
    {
        LevelData data = ScriptableObject.CreateInstance<LevelData>();
        data.levelName = "忙碌早餐";
        data.levelIndex = 1;
        data.description = "在时间限制内完成早餐订单，注意灶台别烧焦！";
        data.timeLimit = 150f;
        data.orderInterval = 20f;
        data.maxOrders = 4;
        data.targetScore = 300;
        data.targetScore2Stars = 500;
        data.targetScore3Stars = 800;
        data.hasConveyorBelt = false;
        data.conveyorSpeed = 0f;
        data.isTutorialLevel = false;

        Ingredient tomato = CreateIngredient("tomato", 2f, 0f, 0f);
        Ingredient lettuce = CreateIngredient("lettuce", 1f, 0f, 0f);
        Ingredient egg = CreateIngredient("egg", 1f, 3f, 5f);
        Ingredient vegetable = CreateIngredient("vegetable", 2f, 4f, 6f);

        Recipe tomatoSalad = CreateRecipe("番茄沙拉", 50, new List<Ingredient> { tomato, lettuce }, 0f);
        Recipe friedEgg = CreateRecipe("煎蛋", 80, new List<Ingredient> { egg }, 3f);
        Recipe stirFry = CreateRecipe("炒菜", 100, new List<Ingredient> { vegetable }, 4f);

        data.availableIngredients = new List<Ingredient> { tomato, lettuce, egg, vegetable };
        data.availableRecipes = new List<Recipe> { tomatoSalad, friedEgg, stirFry };

        data.stationLayout = new List<StationLayoutEntry>
        {
            new StationLayoutEntry { stationType = StationType.Ingredient, position = new Vector3(-3, -3, 0), rotation = 0f, stationName = "食材站A", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Ingredient, position = new Vector3(3, -3, 0), rotation = 0f, stationName = "食材站B", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Prep, position = new Vector3(-3, 0, 0), rotation = 0f, stationName = "备菜台", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Cooking, position = new Vector3(-1, 3, 0), rotation = 0f, stationName = "灶台A", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Cooking, position = new Vector3(1, 3, 0), rotation = 0f, stationName = "灶台B", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Plating, position = new Vector3(3, 0, 0), rotation = 0f, stationName = "装盘台", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Cleaning, position = new Vector3(3, 3, 0), rotation = 0f, stationName = "清洗台", isLocked = false }
        };

        data.spatialConstraints = new List<SpatialConstraint>
        {
            new SpatialConstraint { constraintName = "中央障碍", constraintType = SpatialConstraint.ConstraintType.BlockedArea, position = new Vector2(0, 0), size = new Vector2(2, 2), moveSpeed = 0f, moveRange = 0f }
        };

        data.tutorialSteps = new List<TutorialStep>();

        return data;
    }

    private static LevelData CreateLevel2()
    {
        LevelData data = ScriptableObject.CreateInstance<LevelData>();
        data.levelName = "传送带挑战";
        data.levelIndex = 2;
        data.description = "传送带会移动食材，注意把握时机！";
        data.timeLimit = 120f;
        data.orderInterval = 15f;
        data.maxOrders = 5;
        data.targetScore = 500;
        data.targetScore2Stars = 800;
        data.targetScore3Stars = 1200;
        data.hasConveyorBelt = true;
        data.conveyorSpeed = 1.5f;
        data.isTutorialLevel = false;

        Ingredient tomato = CreateIngredient("tomato", 2f, 0f, 0f);
        Ingredient lettuce = CreateIngredient("lettuce", 1f, 0f, 0f);
        Ingredient egg = CreateIngredient("egg", 1f, 3f, 5f);
        Ingredient vegetable = CreateIngredient("vegetable", 2f, 4f, 6f);
        Ingredient meat = CreateIngredient("meat", 3f, 6f, 8f);

        Recipe tomatoSalad = CreateRecipe("番茄沙拉", 50, new List<Ingredient> { tomato, lettuce }, 0f);
        Recipe friedEgg = CreateRecipe("煎蛋", 80, new List<Ingredient> { egg }, 3f);
        Recipe stirFry = CreateRecipe("炒菜", 100, new List<Ingredient> { vegetable }, 4f);
        Recipe thickSoup = CreateRecipe("浓汤", 120, new List<Ingredient> { meat }, 6f);

        data.availableIngredients = new List<Ingredient> { tomato, lettuce, egg, vegetable, meat };
        data.availableRecipes = new List<Recipe> { tomatoSalad, friedEgg, stirFry, thickSoup };

        data.stationLayout = new List<StationLayoutEntry>
        {
            new StationLayoutEntry { stationType = StationType.Ingredient, position = new Vector3(-4, -3, 0), rotation = 0f, stationName = "食材站", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Prep, position = new Vector3(-2, -1, 0), rotation = 0f, stationName = "备菜台", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Prep, position = new Vector3(-2, 1, 0), rotation = 0f, stationName = "备菜台B", isLocked = true },
            new StationLayoutEntry { stationType = StationType.Cooking, position = new Vector3(2, -1, 0), rotation = 0f, stationName = "灶台A", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Cooking, position = new Vector3(2, 1, 0), rotation = 0f, stationName = "灶台B", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Plating, position = new Vector3(4, 0, 0), rotation = 0f, stationName = "装盘台", isLocked = false },
            new StationLayoutEntry { stationType = StationType.Cleaning, position = new Vector3(0, 3, 0), rotation = 0f, stationName = "清洗台", isLocked = false }
        };

        data.spatialConstraints = new List<SpatialConstraint>
        {
            new SpatialConstraint { constraintName = "移动障碍", constraintType = SpatialConstraint.ConstraintType.MovingObstacle, position = new Vector2(0, -1), size = new Vector2(3, 1), moveSpeed = 2f, moveRange = 4f }
        };

        data.tutorialSteps = new List<TutorialStep>();

        return data;
    }
}
