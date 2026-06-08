using System;

namespace DecorMatch3
{
    [Serializable]
    public class LevelConfigData
    {
        public int levelId;
        public int boardWidth;
        public int boardHeight;
        public int movesLimit;
        public int targetScore;
        public TileType[] availableTypes;
        public int star1Score;
        public int star2Score;
        public int star3Score;
        public string customerId;
        public float difficultyMultiplier;
        public bool hasTutorial;
    }

    [Serializable]
    public class CustomerOrderData
    {
        public string customerId;
        public string roomType;
        public string stylePreference;
        public ColorPreferenceData[] colorPreferences;
        public FurnitureRequirementData[] furnitureRequirements;
        public int budget;
    }

    [Serializable]
    public class ColorPreferenceData
    {
        public string colorName;
        public float weight;
        public string hexCode;
    }

    [Serializable]
    public class FurnitureRequirementData
    {
        public string furnitureId;
        public string slotName;
        public bool required;
        public string[] preferredStyles;
    }

    [Serializable]
    public class FurnitureData
    {
        public string furnitureId;
        public string displayName;
        public string category;
        public string style;
        public string[] compatibleColors;
        public int cost;
        public float comfortScore;
        public float aestheticScore;
        public float functionalityScore;
    }

    [Serializable]
    public class ColorPaletteData
    {
        public string paletteId;
        public string displayName;
        public string style;
        public string[] hexColors;
        public float harmonyScore;
    }

    [Serializable]
    public class CustomerData
    {
        public string customerId;
        public string displayName;
        public string personality;
        public string preferredStyle;
        public string[] likedColors;
        public string[] dislikedColors;
        public float strictness;
        public string portraitSprite;
    }

    [Serializable]
    public class RoomSlotData
    {
        public string slotName;
        public string furnitureId;
        public string appliedColorHex;
    }

    [Serializable]
    public class RoomStateData
    {
        public string roomType;
        public RoomSlotData[] slots;
        public string appliedPaletteId;
    }
}
