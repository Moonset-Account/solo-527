using UnityEngine;
using UnityEngine.UI;

namespace LakeNavigation
{
    public static class UIHelper
    {
        private static Font _cachedFont;

        public static Font DefaultFont
        {
            get
            {
                if (_cachedFont == null)
                {
                    _cachedFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                    if (_cachedFont == null)
                        _cachedFont = Resources.GetBuiltinResource<Font>("Arial.ttf");
                }
                return _cachedFont;
            }
        }

        public static ColorBlock MakeColorBlock(Color32 baseColor)
        {
            return new ColorBlock
            {
                normalColor = baseColor,
                highlightedColor = Lighten(baseColor, 30),
                pressedColor = Darken(baseColor, 20),
                selectedColor = Lighten(baseColor, 30),
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
        }

        public static Color32 Lighten(Color32 c, int amount)
        {
            return new Color32(
                (byte)Mathf.Min(c.r + amount, 255),
                (byte)Mathf.Min(c.g + amount, 255),
                (byte)Mathf.Min(c.b + amount, 255),
                c.a);
        }

        public static Color32 Darken(Color32 c, int amount)
        {
            return new Color32(
                (byte)Mathf.Max(c.r - amount, 0),
                (byte)Mathf.Max(c.g - amount, 0),
                (byte)Mathf.Max(c.b - amount, 0),
                c.a);
        }
    }
}
