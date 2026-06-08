using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DecorMatch3
{
    public class ColorScheme
    {
        public string PaletteId { get; private set; }
        public string DisplayName { get; private set; }
        public string Style { get; private set; }
        public List<Color> Colors { get; private set; }
        public float HarmonyScore { get; private set; }

        public ColorScheme()
        {
            Colors = new List<Color>();
        }

        public static ColorScheme FromData(ColorPaletteData data)
        {
            if (data == null) return null;
            var scheme = new ColorScheme
            {
                PaletteId = data.paletteId,
                DisplayName = data.displayName,
                Style = data.style,
                HarmonyScore = data.harmonyScore,
                Colors = new List<Color>()
            };
            if (data.hexColors != null)
            {
                foreach (var hex in data.hexColors)
                {
                    scheme.Colors.Add(HexToColor(hex));
                }
            }
            return scheme;
        }

        public float CalculateHarmonyWith(ColorScheme other)
        {
            if (other == null || other.Colors == null || Colors == null || Colors.Count == 0 || other.Colors.Count == 0) return 0f;
            float totalDist = 0f;
            int pairs = 0;
            foreach (var c1 in Colors)
            {
                float minDist = float.MaxValue;
                foreach (var c2 in other.Colors)
                {
                    float dist = ColorDistance(c1, c2);
                    if (dist < minDist) minDist = dist;
                }
                totalDist += minDist;
                pairs++;
            }
            if (pairs == 0) return 0f;
            float avgDist = totalDist / pairs;
            return Mathf.Clamp01(1f - avgDist);
        }

        public float CalculatePreferenceScore(string[] likedColors, string[] dislikedColors)
        {
            if (Colors == null || Colors.Count == 0) return 0f;
            float score = 0f;
            foreach (var color in Colors)
            {
                string hex = ColorToHex(color);
                if (likedColors != null && likedColors.Contains(hex))
                {
                    score += 1f;
                }
                else if (dislikedColors != null && dislikedColors.Contains(hex))
                {
                    score -= 0.5f;
                }
                else
                {
                    bool isLiked = false;
                    if (likedColors != null)
                    {
                        foreach (var liked in likedColors)
                        {
                            if (ColorDistance(color, HexToColor(liked)) < 0.2f)
                            {
                                isLiked = true;
                                break;
                            }
                        }
                    }
                    if (isLiked) score += 0.7f;
                    else score += 0.3f;
                }
            }
            return Mathf.Clamp01(score / Colors.Count);
        }

        public static Color HexToColor(string hex)
        {
            if (string.IsNullOrEmpty(hex)) return Color.white;
            hex = hex.Replace("#", "");
            if (hex.Length == 6)
            {
                hex = "FF" + hex;
            }
            byte a = byte.Parse(hex.Substring(0, 2), System.Globalization.NumberStyles.HexNumber);
            byte r = byte.Parse(hex.Substring(2, 2), System.Globalization.NumberStyles.HexNumber);
            byte g = byte.Parse(hex.Substring(4, 2), System.Globalization.NumberStyles.HexNumber);
            byte b = byte.Parse(hex.Substring(6, 2), System.Globalization.NumberStyles.HexNumber);
            return new Color32(r, g, b, a);
        }

        public static string ColorToHex(Color color)
        {
            Color32 c32 = color;
            return string.Format("{0:X2}{1:X2}{2:X2}", c32.r, c32.g, c32.b);
        }

        public static float ColorDistance(Color a, Color b)
        {
            float dr = a.r - b.r;
            float dg = a.g - b.g;
            float db = a.b - b.b;
            return Mathf.Sqrt(dr * dr + dg * dg + db * db);
        }

        public static bool AreComplementary(Color a, Color b)
        {
            Vector3 hsvA = ColorToHSV(a);
            Vector3 hsvB = ColorToHSV(b);
            float hueDiff = Mathf.Abs(hsvA.x - hsvB.x);
            if (hueDiff > 180f) hueDiff = 360f - hueDiff;
            return hueDiff >= 150f && hueDiff <= 210f;
        }

        private static Vector3 ColorToHSV(Color color)
        {
            Color.RGBToHSV(color, out float h, out float s, out float v);
            return new Vector3(h * 360f, s, v);
        }
    }
}
