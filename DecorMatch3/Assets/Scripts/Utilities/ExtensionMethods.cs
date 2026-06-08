using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3
{
    public static class ExtensionMethods
    {
        private static readonly System.Random _random = new System.Random();

        public static void Shuffle<T>(this List<T> list)
        {
            int n = list.Count;
            while (n > 1)
            {
                n--;
                int k = _random.Next(n + 1);
                (list[k], list[n]) = (list[n], list[k]);
            }
        }

        public static string ToHex(this Color color)
        {
            int r = Mathf.RoundToInt(color.r * 255f);
            int g = Mathf.RoundToInt(color.g * 255f);
            int b = Mathf.RoundToInt(color.b * 255f);
            return $"#{r:X2}{g:X2}{b:X2}";
        }

        public static Color FromHex(this Color _, string hex)
        {
            if (hex.StartsWith("#"))
                hex = hex.Substring(1);

            if (hex.Length == 6)
            {
                int r = Convert.ToInt32(hex.Substring(0, 2), 16);
                int g = Convert.ToInt32(hex.Substring(2, 2), 16);
                int b = Convert.ToInt32(hex.Substring(4, 2), 16);
                return new Color(r / 255f, g / 255f, b / 255f);
            }

            if (hex.Length == 8)
            {
                int r = Convert.ToInt32(hex.Substring(0, 2), 16);
                int g = Convert.ToInt32(hex.Substring(2, 2), 16);
                int b = Convert.ToInt32(hex.Substring(4, 2), 16);
                int a = Convert.ToInt32(hex.Substring(6, 2), 16);
                return new Color(r / 255f, g / 255f, b / 255f, a / 255f);
            }

            return Color.white;
        }

        public static int Clamp(this int value, int min, int max)
        {
            return Mathf.Clamp(value, min, max);
        }

        public static float Remap(this float value, float from1, float from2, float to1, float to2)
        {
            return to1 + (value - from1) / (from2 - from1) * (to2 - to1);
        }

        public static Vector2Int RoundToInt(this Vector2 value)
        {
            return new Vector2Int(Mathf.RoundToInt(value.x), Mathf.RoundToInt(value.y));
        }
    }
}
