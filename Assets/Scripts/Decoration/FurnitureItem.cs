using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Decoration
{
    public enum FurnitureType
    {
        Sofa,
        Table,
        Chair,
        Bed,
        Cabinet,
        Bookshelf,
        Lamp,
        Rug,
        Curtain,
        Decoration
    }

    [CreateAssetMenu(fileName = "NewFurniture", menuName = "DecorMatch3/Furniture Item", order = 12)]
    public class FurnitureItem : ScriptableObject
    {
        [Header("基础信息")]
        public int FurnitureId;
        public string FurnitureName;
        public FurnitureType Type;
        public Sprite PreviewImage;
        public GameObject Prefab;

        [Header("风格标签")]
        public DecorationStyle[] StyleTags;

        [Header("颜色属性")]
        public Color PrimaryColor;
        public Color SecondaryColor;

        [Header("材料")]
        public Match3.MaterialCategory PrimaryMaterial;
        public Match3.MaterialCategory SecondaryMaterial;

        [Header("价格与费用")]
        public int Cost;
        public Dictionary<int, int> MaterialCost = new Dictionary<int, int>();

        [Header("属性评分")]
        [Range(0, 100)] public int ComfortRating;
        [Range(0, 100)] public int DurabilityRating;
        [Range(0, 100)] public int AestheticRating;
        [Range(0, 100)] public int PracticalityRating;

        [Header("尺寸 (米)")]
        public Vector3 Dimensions;
    }

    [CreateAssetMenu(fileName = "NewColorPalette", menuName = "DecorMatch3/Color Palette", order = 13)]
    public class ColorPalette : ScriptableObject
    {
        [Header("基础信息")]
        public int PaletteId;
        public string PaletteName;

        [Header("墙面配色")]
        public Color WallPrimary;
        public Color WallAccent;
        public DecorationStyle[] WallStyleTags;
        public Match3.MaterialCategory WallMaterial = Match3.MaterialCategory.Paint;

        [Header("地板配色")]
        public Color FloorPrimary;
        public Color FloorPattern;
        public DecorationStyle[] FloorStyleTags;
        public Match3.MaterialCategory FloorMaterial = Match3.MaterialCategory.Tile;

        [Header("整体风格")]
        public DecorationStyle[] OverallStyleTags;

        [Header("材料消耗")]
        public int WallMaterialId;
        public int FloorMaterialId;
        public int WallMaterialAmount = 10;
        public int FloorMaterialAmount = 8;
    }
}
