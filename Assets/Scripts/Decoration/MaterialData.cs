using UnityEngine;

namespace DecorMatch3.Decoration
{
    [CreateAssetMenu(fileName = "NewMaterial", menuName = "DecorMatch3/Material", order = 10)]
    public class MaterialData : ScriptableObject
    {
        [Header("基础信息")]
        public int MaterialId;
        public string MaterialName;
        public string Description;
        public Sprite Icon;

        [Header("类型")]
        public Match3.MaterialCategory Category;
        public Match3.TileType SourceTileType;

        [Header("属性")]
        public Color MaterialColor;
        public int RarityLevel;

        [Header("使用场景")]
        public bool UsedForWalls;
        public bool UsedForFloors;
        public bool UsedForFurniture;
        public bool UsedForDecorations;

        [Header("风格标签")]
        public DecorationStyle[] StyleTags;

        public int GetMaterialId()
        {
            return MaterialId;
        }
    }

    public enum DecorationStyle
    {
        Modern,
        Classic,
        Minimalist,
        Scandinavian,
        Industrial,
        Bohemian,
        Retro,
        Luxurious,
        Cozy,
        Fresh,
        Warm,
        Cool
    }
}
