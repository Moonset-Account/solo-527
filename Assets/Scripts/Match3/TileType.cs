using UnityEngine;

namespace DecorMatch3.Match3
{
    public enum TileType
    {
        None = 0,
        PaintRed = 1,
        PaintBlue = 2,
        PaintYellow = 3,
        PaintGreen = 4,
        PaintPurple = 5,
        PaintOrange = 6,
        WoodLight = 10,
        WoodDark = 11,
        Fabric = 12,
        Metal = 13,
        Tile = 14,
        Wallpaper = 15,
        Obstacle = 98,
        Empty = 99
    }

    public enum TileState
    {
        Idle,
        Selected,
        Swapping,
        Falling,
        Matched,
        Removing,
        Disabled
    }

    public enum MaterialCategory
    {
        Paint,
        Wood,
        Fabric,
        Metal,
        Tile,
        Wallpaper
    }

    public static class TileTypeExtensions
    {
        public static MaterialCategory? GetMaterialCategory(this TileType type)
        {
            switch (type)
            {
                case TileType.PaintRed:
                case TileType.PaintBlue:
                case TileType.PaintYellow:
                case TileType.PaintGreen:
                case TileType.PaintPurple:
                case TileType.PaintOrange:
                    return MaterialCategory.Paint;

                case TileType.WoodLight:
                case TileType.WoodDark:
                    return MaterialCategory.Wood;

                case TileType.Fabric:
                    return MaterialCategory.Fabric;

                case TileType.Metal:
                    return MaterialCategory.Metal;

                case TileType.Tile:
                    return MaterialCategory.Tile;

                case TileType.Wallpaper:
                    return MaterialCategory.Wallpaper;

                default:
                    return null;
            }
        }

        public static int GetMaterialId(this TileType type)
        {
            return (int)type;
        }

        public static Color GetTileColor(this TileType type)
        {
            switch (type)
            {
                case TileType.PaintRed: return new Color(0.9f, 0.3f, 0.3f);
                case TileType.PaintBlue: return new Color(0.3f, 0.5f, 0.9f);
                case TileType.PaintYellow: return new Color(0.95f, 0.85f, 0.3f);
                case TileType.PaintGreen: return new Color(0.3f, 0.8f, 0.4f);
                case TileType.PaintPurple: return new Color(0.7f, 0.4f, 0.85f);
                case TileType.PaintOrange: return new Color(0.95f, 0.6f, 0.2f);
                case TileType.WoodLight: return new Color(0.85f, 0.7f, 0.5f);
                case TileType.WoodDark: return new Color(0.55f, 0.35f, 0.2f);
                case TileType.Fabric: return new Color(0.8f, 0.75f, 0.65f);
                case TileType.Metal: return new Color(0.7f, 0.72f, 0.75f);
                case TileType.Tile: return new Color(0.95f, 0.95f, 0.92f);
                case TileType.Wallpaper: return new Color(0.95f, 0.88f, 0.82f);
                default: return Color.white;
            }
        }
    }
}
