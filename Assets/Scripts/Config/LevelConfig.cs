using UnityEngine;
using System.Collections.Generic;

namespace KitchenChaos.Config
{
    public enum LevelMechanicType
    {
        None = 0,
        ConveyorBelt = 1,
        MovingPlatform = 2,
        SlidingFloor = 3,
        TightCorridor = 4,
        FireHazard = 5,
        TimeWarp = 6,
        SplitKitchen = 7,
        Tornado = 8
    }

    [System.Serializable]
    public class LevelMechanic
    {
        public LevelMechanicType Type;
        public bool Enabled;
        public float Intensity = 1f;
        public string TriggerZoneTag;
    }

    [CreateAssetMenu(fileName = "LevelConfig", menuName = "KitchenChaos/LevelConfig", order = 1)]
    public class LevelConfig : ScriptableObject
    {
        [Header("Level Info")]
        public string LevelName = "Level 1";
        public int LevelIndex = 0;
        public Sprite LevelIcon;

        [Header("Time & Score")]
        public float Duration = 180f;
        public int[] StarThresholds = { 100, 300, 600 };
        public int TargetScore = 300;
        public int MaxFailedOrders = 5;

        [Header("Players")]
        [Range(1, 4)] public int MaxPlayersInLevel = 4;
        public Vector3[] PlayerSpawnPoints;

        [Header("Order Generation")]
        public float OrderSpawnInterval = 12f;
        public float OrderSpawnIntervalVariance = 3f;
        public int MaxActiveOrders = 5;
        public float OrderTimeLimitBase = 45f;
        public float OrderTimeLimitPerIngredient = 8f;

        [Header("Recipe Pool")]
        public string[] AvailableRecipeNames;

        [Header("Mechanics")]
        public LevelMechanic[] Mechanics;

        [Header("Stations Layout")]
        public StationPlacement[] StationPlacements;

        [Header("Tutorial Tips")]
        [TextArea] public string[] LevelTips;

        public static LevelConfig Default => new()
        {
            LevelName = "Default",
            Duration = 180f,
            StarThresholds = new[] { 100, 300, 600 },
            MaxFailedOrders = 5,
            MaxPlayersInLevel = 2,
            PlayerSpawnPoints = new[] { new Vector3(-2, 0, 0), new Vector3(2, 0, 0) },
            OrderSpawnInterval = 12f,
            OrderSpawnIntervalVariance = 3f,
            MaxActiveOrders = 4,
            OrderTimeLimitBase = 40f,
            OrderTimeLimitPerIngredient = 8f,
            AvailableRecipeNames = new[] { "Salad", "Soup", "Burger" },
            Mechanics = System.Array.Empty<LevelMechanic>(),
            StationPlacements = System.Array.Empty<StationPlacement>()
        };
    }

    [System.Serializable]
    public class StationPlacement
    {
        public string StationType;
        public Vector3 Position;
        public Vector3 RotationEuler;
        public string[] IngredientsProvided;
    }
}
