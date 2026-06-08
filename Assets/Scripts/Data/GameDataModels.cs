using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Data
{
    public enum GemType
    {
        Red = 0,
        Blue = 1,
        Green = 2,
        Yellow = 3,
        Purple = 4,
        Orange = 5,
        Rainbow = 6,
        None = 7
    }

    public enum MaterialType
    {
        Paint,
        Fabric,
        Wood,
        Metal,
        Tile,
        Wallpaper
    }

    public enum FurnitureCategory
    {
        Sofa,
        Table,
        Chair,
        Bed,
        Cabinet,
        Lamp,
        Rug,
        Decoration
    }

    public enum ColorStyle
    {
        Warm,
        Cool,
        Neutral,
        Vibrant,
        Pastel,
        Earthy
    }

    public enum RoomType
    {
        LivingRoom,
        Bedroom,
        Kitchen,
        Bathroom,
        Study
    }

    [Serializable]
    public class LevelObjective
    {
        public GemType TargetGem;
        public int RequiredCount;
        [HideInInspector] public int CurrentCount;
    }

    [Serializable]
    public class LevelData
    {
        public int LevelId;
        public string LevelName;
        public string Description;

        [Header("Board Settings")]
        public int BoardWidth = 8;
        public int BoardHeight = 8;
        public int MovesLimit = 30;
        public int TargetScore = 5000;

        [Header("Gem Types Available")]
        public List<GemType> AvailableGems = new List<GemType>
        {
            GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple
        };

        [Header("Objectives")]
        public List<LevelObjective> Objectives = new List<LevelObjective>();

        [Header("Rewards")]
        public int CoinReward = 100;
        public int XpReward = 50;
        public List<MaterialReward> MaterialRewards = new List<MaterialReward>();

        [Header("Difficulty")]
        [Range(1, 5)] public int DifficultyRating = 1;
    }

    [Serializable]
    public class MaterialReward
    {
        public MaterialType MaterialType;
        public int Amount;
    }

    [Serializable]
    public class CustomerPreference
    {
        public ColorStyle PreferredColorStyle;
        public List<ColorStyle> DislikedColorStyles = new List<ColorStyle>();

        [Range(0, 100)]
        public int ColorImportance = 70;

        [Range(0, 100)]
        public int FurnitureStyleImportance = 50;

        [Range(0, 100)]
        public int MaterialQualityImportance = 60;

        public List<FurnitureCategory> PreferredFurniture = new List<FurnitureCategory>();
        public List<FurnitureCategory> RequiredFurniture = new List<FurnitureCategory>();
        public int BudgetMin = 500;
        public int BudgetMax = 5000;
    }

    [Serializable]
    public class CustomerData
    {
        public int CustomerId;
        public string Name;
        public string AvatarSpritePath;
        public string Description;
        public RoomType TargetRoom;
        public CustomerPreference Preferences;
        public List<string> StoryDialogue = new List<string>();
        public List<string> PositiveFeedback = new List<string>();
        public List<string> NegativeFeedback = new List<string>();
    }

    [Serializable]
    public class ColorOption
    {
        public string ColorId;
        public string ColorName;
        public Color HexColor;
        public ColorStyle Style;
        public MaterialType MaterialType;
        public int Cost;
        public int QualityRating;
    }

    [Serializable]
    public class FurnitureItem
    {
        public string FurnitureId;
        public string Name;
        public FurnitureCategory Category;
        public string PrefabPath;
        public string IconPath;
        public int Cost;
        public int QualityRating;
        public ColorStyle PrimaryColorStyle;
        public string Description;
    }

    [Serializable]
    public class MaterialItem
    {
        public MaterialType MaterialType;
        public int CurrentAmount;
        public int MaxStorage = 999;
    }

    [Serializable]
    public class DecorationSlot
    {
        public string SlotId;
        public string SlotName;
        public FurnitureCategory AcceptedCategory;
        public Vector3 Position;
        public Vector3 Rotation;
        public Vector3 Scale;
        [HideInInspector] public FurnitureItem AssignedFurniture;
        [HideInInspector] public ColorOption AssignedColor;
    }

    [Serializable]
    public class RoomData
    {
        public RoomType RoomType;
        public string RoomName;
        public string BackgroundPath;
        public List<DecorationSlot> DecorationSlots = new List<DecorationSlot>();
        public ColorOption BaseWallColor;
        public ColorOption BaseFloorColor;
    }

    [Serializable]
    public class OrderData
    {
        public int OrderId;
        public CustomerData Customer;
        public RoomData TargetRoom;
        public int LinkedLevelId;
        public bool IsCompleted;
        public int FinalScore;
        public string CustomerReview;
        public DateTime CompletionDate;
    }

    [Serializable]
    public class Match3Stats
    {
        public int TotalMovesMade;
        public int TotalGemsCleared;
        public int TotalCombos;
        public int BestCombo;
        public int Score;
    }
}
