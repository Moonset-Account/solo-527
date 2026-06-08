using UnityEngine;
using System.Collections.Generic;
using System.IO;

public class LevelConfigLoader : MonoBehaviour
{
    [SerializeField] private string configPath = "LevelConfigs";

    public LevelData LoadLevelConfig(string fileName)
    {
        string fullPath = Path.Combine(Application.streamingAssetsPath, configPath, fileName + ".json");

        if (File.Exists(fullPath))
        {
            string json = File.ReadAllText(fullPath);
            LevelConfigDTO dto = JsonUtility.FromJson<LevelConfigDTO>(json);
            if (dto != null)
                return FromDTO(dto);
        }

        int levelIndex;
        if (int.TryParse(fileName.Replace("level_", "").Split('_')[0], out levelIndex))
            return RuntimeDataFactory.CreateLevelData(levelIndex);

        return RuntimeDataFactory.CreateLevelData(0);
    }

    public static List<LevelData> GetAllLevelConfigs()
    {
        string directoryPath = Path.Combine(Application.streamingAssetsPath, "LevelConfigs");
        List<LevelData> configs = new List<LevelData>();

        if (Directory.Exists(directoryPath))
        {
            string[] files = Directory.GetFiles(directoryPath, "*.json");
            LevelConfigLoader instance = new LevelConfigLoader();

            foreach (string file in files)
            {
                string json = File.ReadAllText(file);
                LevelConfigDTO dto = JsonUtility.FromJson<LevelConfigDTO>(json);
                if (dto != null)
                {
                    LevelData levelData = instance.FromDTO(dto);
                    if (levelData != null)
                        configs.Add(levelData);
                }
            }
        }

        if (configs.Count == 0)
            return RuntimeDataFactory.CreateAllLevels();

        return configs;
    }

    private LevelData FromDTO(LevelConfigDTO dto)
    {
        LevelData data = ScriptableObject.CreateInstance<LevelData>();
        data.levelName = dto.levelName;
        data.levelIndex = dto.levelIndex;
        data.description = dto.description;
        data.timeLimit = dto.timeLimit;
        data.orderInterval = dto.orderInterval;
        data.maxOrders = dto.maxOrders;
        data.targetScore = dto.targetScore;
        data.targetScore2Stars = dto.targetScore2Stars;
        data.targetScore3Stars = dto.targetScore3Stars;
        data.hasConveyorBelt = dto.hasConveyorBelt;
        data.conveyorSpeed = dto.conveyorSpeed;
        data.isTutorialLevel = dto.isTutorialLevel;
        data.requireAllDishesCleaned = dto.requireAllDishesCleaned;

        data.stationLayout = new List<StationLayoutEntry>();
        if (dto.stationLayout != null)
        {
            foreach (var s in dto.stationLayout)
            {
                data.stationLayout.Add(new StationLayoutEntry
                {
                    stationType = (StationType)s.stationType,
                    position = new Vector3(s.positionX, s.positionY, s.positionZ),
                    rotation = s.rotation,
                    stationName = s.stationName,
                    isLocked = s.isLocked
                });
            }
        }

        data.spatialConstraints = new List<SpatialConstraint>();
        if (dto.spatialConstraints != null)
        {
            foreach (var c in dto.spatialConstraints)
            {
                data.spatialConstraints.Add(new SpatialConstraint
                {
                    constraintName = c.constraintName,
                    constraintType = (SpatialConstraint.ConstraintType)c.constraintType,
                    position = new Vector2(c.positionX, c.positionY),
                    size = new Vector2(c.sizeX, c.sizeY),
                    moveSpeed = c.moveSpeed,
                    moveRange = c.moveRange
                });
            }
        }

        data.tutorialSteps = new List<TutorialStep>();
        if (dto.tutorialSteps != null)
        {
            foreach (var t in dto.tutorialSteps)
            {
                data.tutorialSteps.Add(new TutorialStep
                {
                    stepIndex = t.stepIndex,
                    description = t.description,
                    targetStationType = (StationType)t.targetStationType,
                    requiredAction = t.requiredAction,
                    isCompleted = false,
                    highlightPosition = new Vector2(t.highlightX, t.highlightY),
                    highlightRadius = t.highlightRadius
                });
            }
        }

        data.availableIngredients = new List<Ingredient>();
        if (dto.ingredientConfigs != null)
        {
            foreach (var ic in dto.ingredientConfigs)
            {
                data.availableIngredients.Add(RuntimeDataFactory.CreateIngredient(ic.name, ic.prepTime, ic.cookTime, ic.burnTime));
            }
        }

        data.availableRecipes = new List<Recipe>();
        if (dto.recipeNames != null)
        {
            Dictionary<string, Ingredient> ingredientLookup = new Dictionary<string, Ingredient>();
            foreach (var ing in data.availableIngredients)
                ingredientLookup[ing.ingredientName] = ing;

            foreach (string recipeName in dto.recipeNames)
            {
                Recipe recipe = FindRecipeByName(recipeName, ingredientLookup);
                if (recipe != null)
                    data.availableRecipes.Add(recipe);
            }
        }

        return data;
    }

    private static Recipe FindRecipeByName(string name, Dictionary<string, Ingredient> ingredientLookup)
    {
        switch (name)
        {
            case "番茄沙拉":
                return RuntimeDataFactory.CreateRecipe("番茄沙拉", 50,
                    new List<Ingredient> { GetIngredient("tomato", ingredientLookup), GetIngredient("lettuce", ingredientLookup) }, 0f);
            case "煎蛋":
                return RuntimeDataFactory.CreateRecipe("煎蛋", 80,
                    new List<Ingredient> { GetIngredient("egg", ingredientLookup) }, 3f);
            case "炒菜":
                return RuntimeDataFactory.CreateRecipe("炒菜", 100,
                    new List<Ingredient> { GetIngredient("vegetable", ingredientLookup) }, 4f);
            case "浓汤":
                return RuntimeDataFactory.CreateRecipe("浓汤", 120,
                    new List<Ingredient> { GetIngredient("meat", ingredientLookup) }, 6f);
            default:
                return null;
        }
    }

    private static Ingredient GetIngredient(string name, Dictionary<string, Ingredient> lookup)
    {
        if (lookup.TryGetValue(name, out Ingredient ing))
            return ing;
        return null;
    }
}
