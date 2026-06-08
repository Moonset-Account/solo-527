using UnityEngine;

namespace RainAlley.Core
{
    public enum UmbrellaColorType
    {
        None,
        Blue,
        Pink,
        Green,
        Yellow
    }

    public static class UmbrellaColor
    {
        public static readonly Color BlueColor = new Color(0.25f, 0.55f, 0.95f, 1f);
        public static readonly Color PinkColor = new Color(0.95f, 0.45f, 0.65f, 1f);
        public static readonly Color GreenColor = new Color(0.35f, 0.85f, 0.5f, 1f);
        public static readonly Color YellowColor = new Color(0.98f, 0.88f, 0.3f, 1f);

        public static Color ToUnityColor(UmbrellaColorType colorType)
        {
            switch (colorType)
            {
                case UmbrellaColorType.Blue: return BlueColor;
                case UmbrellaColorType.Pink: return PinkColor;
                case UmbrellaColorType.Green: return GreenColor;
                case UmbrellaColorType.Yellow: return YellowColor;
                default: return Color.white;
            }
        }

        public static bool Matches(UmbrellaColorType umbrella, UmbrellaColorType obstacle)
        {
            return umbrella == obstacle;
        }
    }
}
