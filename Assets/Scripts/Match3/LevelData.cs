using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Match3
{
    [CreateAssetMenu(fileName = "NewLevelData", menuName = "DecorMatch3/Level Data", order = 0)]
    public class LevelData : ScriptableObject
    {
        [Header("基础信息")]
        public int LevelId;
        public string LevelName;
        public string Description;
        public Sprite LevelIcon;

        [Header("棋盘配置")]
        public int BoardWidth = 8;
        public int BoardHeight = 8;
        public float TileSize = 100f;
        public float TileSpacing = 5f;

        [Header("关卡限制")]
        public int MaxMoves = 30;
        public float TimeLimitSeconds = 120f;
        public LevelLimitType LimitType = LevelLimitType.Moves;

        [Header("目标分数")]
        public int OneStarScore = 1000;
        public int TwoStarScore = 2500;
        public int ThreeStarScore = 5000;

        [Header("收集目标（材料ID -> 数量）")]
        public List<MaterialRequirement> CollectionTargets = new List<MaterialRequirement>();

        [Header("可用方块类型")]
        public List<TileType> AvailableTileTypes = new List<TileType>
        {
            TileType.PaintRed,
            TileType.PaintBlue,
            TileType.PaintYellow,
            TileType.PaintGreen,
            TileType.PaintPurple,
            TileType.PaintOrange
        };

        [Header("特殊方块配置")]
        [Range(0f, 0.1f)] public float ObstacleSpawnRate = 0f;
        public List<Vector2Int> PredefinedObstacles = new List<Vector2Int>();

        [Header("奖励")]
        public int BaseCoinsReward = 50;
        public int PerStarCoinBonus = 30;
        public int GemReward = 0;

        [Header("连击配置")]
        public int ComboMultiplier2Match = 2;
        public int ComboMultiplier3Match = 4;
        public int ComboMultiplier4PlusMatch = 8;

        public int GetStarsForScore(int score)
        {
            if (score >= ThreeStarScore) return 3;
            if (score >= TwoStarScore) return 2;
            if (score >= OneStarScore) return 1;
            return 0;
        }

        public int GetTileScore(TileType type, int comboLevel = 1)
        {
            int baseScore = 10;
            switch (type)
            {
                case TileType.PaintRed:
                case TileType.PaintBlue:
                case TileType.PaintYellow:
                case TileType.PaintGreen:
                case TileType.PaintPurple:
                case TileType.PaintOrange:
                    baseScore = 10;
                    break;
                case TileType.WoodLight:
                case TileType.WoodDark:
                    baseScore = 20;
                    break;
                case TileType.Fabric:
                case TileType.Metal:
                case TileType.Tile:
                case TileType.Wallpaper:
                    baseScore = 25;
                    break;
            }

            int multiplier = 1;
            if (comboLevel >= 4) multiplier = ComboMultiplier4PlusMatch;
            else if (comboLevel == 3) multiplier = ComboMultiplier3Match;
            else if (comboLevel == 2) multiplier = ComboMultiplier2Match;

            return baseScore * multiplier;
        }
    }

    [System.Serializable]
    public class MaterialRequirement
    {
        public int MaterialId;
        public TileType TileType;
        public int RequiredAmount;

        public MaterialRequirement() { }

        public MaterialRequirement(TileType type, int amount)
        {
            MaterialId = type.GetMaterialId();
            TileType = type;
            RequiredAmount = amount;
        }
    }

    public enum LevelLimitType
    {
        Moves,
        Time,
        Unlimited
    }
}
