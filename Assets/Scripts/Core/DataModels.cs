using System;

namespace PixelPlantLab
{
    [Flags]
    public enum MutationTrait
    {
        None        = 0,
        Glowing     = 1 << 0,
        Crystalline = 1 << 1,
        Poisonous   = 1 << 2,
        Giant       = 1 << 3,
        Miniature   = 1 << 4,
        Spiky       = 1 << 5,
        Fruity      = 1 << 6,
        Burning     = 1 << 7,
        Frozen      = 1 << 8,
        Electric    = 1 << 9,
        Invisible   = 1 << 10,
        MultiHead   = 1 << 11,
        Winged      = 1 << 12,
        Metallic    = 1 << 13,
        Rainbow     = 1 << 14,
        Withered    = 1 << 15,
        Moldy       = 1 << 16,
        Stunted     = 1 << 17
    }

    public enum Rarity
    {
        Failure = -1,
        Common  = 0,
        Rare    = 1,
        Legendary = 2
    }

    public enum ExperimentStatus
    {
        Idle,
        Running,
        Completed,
        Aborted,
        Failed
    }

    [Serializable]
    public class ExperimentParams
    {
        public float LightLevel;
        public float WaterLevel;
        public float SoilNitrogen;
        public float SoilPhosphorus;
        public float SoilPotassium;
        public float CultureTime;

        public ExperimentParams Clone()
        {
            return (ExperimentParams)MemberwiseClone();
        }

        public string ToParamString()
        {
            return $"L:{LightLevel:F1} W:{WaterLevel:F1} N:{SoilNitrogen:F1} P:{SoilPhosphorus:F1} K:{SoilPotassium:F1} T:{CultureTime:F1}";
        }
    }

    [Serializable]
    public class PlantMutation
    {
        public string Id;
        public string DisplayName;
        public string Description;
        public Rarity Rarity;
        public MutationTrait Traits;
        public string SpriteId;

        public PlantMutation(string id, string displayName, string description, Rarity rarity, MutationTrait traits, string spriteId)
        {
            Id = id;
            DisplayName = displayName;
            Description = description;
            Rarity = rarity;
            Traits = traits;
            SpriteId = spriteId;
        }

        public bool HasTrait(MutationTrait trait)
        {
            return (Traits & trait) != 0;
        }
    }
}
