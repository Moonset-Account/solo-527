using System.Collections.Generic;
using UnityEngine;

namespace Kitchen.Config
{
    [CreateAssetMenu(fileName = "Level_", menuName = "Kitchen/Config/Level", order = 2)]
    public class LevelConfig : ScriptableObject
    {
        public string levelId;
        public string displayName;
        [TextArea] public string description;
        public int orderIndex;
        public int maxPlayers = 4;
        public int minPlayers = 1;
        public float levelDurationSeconds = 180f;
        public int targetScore = 1000;
        public int threeStarScore = 2500;
        public int twoStarScore = 1800;
        public int oneStarScore = 1000;
        public float orderSpawnInterval = 15f;
        public int maxActiveOrders = 4;
        public int startingCoins = 0;
        public List<RecipeConfig> availableRecipes = new List<RecipeConfig>();
        public List<IngredientConfig> availableIngredients = new List<IngredientConfig>();
        public List<StationConfig> stations = new List<StationConfig>();
        public List<LevelHazard> hazards = new List<LevelHazard>();
        public DifficultyCurve difficultyCurve = new DifficultyCurve();
        public TutorialConfig tutorial;
        public bool isUnlockedByDefault = false;
    }

    [System.Serializable]
    public class StationConfig
    {
        public StationType type;
        public Vector3 position;
        public string id;
        public IngredientConfig storedIngredient;
        public float interactionRadius = 1.5f;
    }

    [System.Serializable]
    public class LevelHazard
    {
        public HazardType type;
        public float triggerTime;
        public float duration;
        public float magnitude = 1f;
        public string description;
    }

    [System.Serializable]
    public class DifficultyCurve
    {
        public float orderSpawnMultiplier = 0.95f;
        public int minOrderSpawnInterval = 5;
        public float scoreMultiplierIncrease = 0.05f;
        public int maxComplexityIncrease = 5;
    }

    public enum StationType
    {
        IngredientBox,
        CuttingBoard,
        Stove,
        PlateStack,
        ServingWindow,
        Sink,
        Trash,
        Counter
    }

    public enum HazardType
    {
        None,
        Fire,
        MovingTable,
        ConveyorSpeed,
        PowerOutage,
        CrowdedSpace,
        SlipperyFloor
    }

    public static class LevelConfigRegistry
    {
        public static System.Func<LevelConfig[]> GetAllLevels = () => new LevelConfig[0];
    }
}
