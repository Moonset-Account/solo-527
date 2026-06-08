using UnityEngine;

namespace LightShadowPlatformer.EditorTools
{
    public class PlaceholderResourceGenerator
    {
        public static Texture2D CreateSolidTexture(int width, int height, Color color)
        {
            Texture2D tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            Color[] pixels = new Color[width * height];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = color;
            tex.SetPixels(pixels);
            tex.filterMode = FilterMode.Point;
            tex.Apply();
            return tex;
        }

        public static Sprite CreateSprite(Color color, int width = 64, int height = 64, float pixelsPerUnit = 16f)
        {
            Texture2D tex = CreateSolidTexture(width, height, color);
            Sprite s = Sprite.Create(tex, new Rect(0, 0, width, height),
                new Vector2(0.5f, 0.5f), pixelsPerUnit);
            s.name = $"Placeholder_{width}x{height}";
            return s;
        }

        public static Sprite CreateBoxSprite(Color fill, Color border, int size = 64, int borderWidth = 4, float ppu = 16f)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            Color[] pixels = new Color[size * size];
            for (int x = 0; x < size; x++)
            {
                for (int y = 0; y < size; y++)
                {
                    bool isBorder = x < borderWidth || x >= size - borderWidth ||
                                    y < borderWidth || y >= size - borderWidth;
                    pixels[y * size + x] = isBorder ? border : fill;
                }
            }
            tex.SetPixels(pixels);
            tex.filterMode = FilterMode.Point;
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f), ppu);
        }

        public static Sprite CreateCircleSprite(Color fill, int size = 64, float ppu = 16f)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            Color[] pixels = new Color[size * size];
            float radius = size * 0.45f;
            Vector2 center = new Vector2(size * 0.5f, size * 0.5f);
            for (int x = 0; x < size; x++)
            {
                for (int y = 0; y < size; y++)
                {
                    float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), center);
                    pixels[y * size + x] = d <= radius ? fill : new Color(0, 0, 0, 0);
                }
            }
            tex.SetPixels(pixels);
            tex.filterMode = FilterMode.Point;
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f), ppu);
        }
    }

    public class PlaceholderSprites : MonoBehaviour
    {
        public static Sprite Player()
        {
            return PlaceholderResourceGenerator.CreateBoxSprite(
                new Color(0.3f, 0.6f, 1f),
                new Color(0.15f, 0.3f, 0.6f),
                48, 4, 16f);
        }

        public static Sprite SolidPlatform()
        {
            return PlaceholderResourceGenerator.CreateBoxSprite(
                new Color(0.4f, 0.35f, 0.3f),
                new Color(0.25f, 0.2f, 0.15f),
                64, 4, 16f);
        }

        public static Sprite LightPlatform()
        {
            return PlaceholderResourceGenerator.CreateBoxSprite(
                new Color(0.7f, 0.85f, 1f, 0.9f),
                new Color(0.4f, 0.6f, 0.9f),
                64, 3, 16f);
        }

        public static Sprite ShadowPlatform()
        {
            return PlaceholderResourceGenerator.CreateBoxSprite(
                new Color(0.25f, 0.2f, 0.35f, 0.85f),
                new Color(0.5f, 0.35f, 0.65f),
                64, 3, 16f);
        }

        public static Sprite Spike()
        {
            return PlaceholderResourceGenerator.CreateSolidTexture(
                64, 64, new Color(0.8f, 0.2f, 0.2f))
                .CreateSprite(new Rect(0, 0, 64, 64), new Vector2(0.5f, 0), 16f);
        }

        public static Sprite Flag()
        {
            return PlaceholderResourceGenerator.CreateSolidTexture(
                64, 96, new Color(0.4f, 0.9f, 0.4f))
                .CreateSprite(new Rect(0, 0, 64, 96), new Vector2(0.5f, 0), 16f);
        }

        public static Sprite CollectibleGem()
        {
            return PlaceholderResourceGenerator.CreateCircleSprite(
                new Color(1f, 0.85f, 0.2f), 48, 16f);
        }

        public static Sprite Door()
        {
            return PlaceholderResourceGenerator.CreateBoxSprite(
                new Color(0.5f, 0.35f, 0.2f),
                new Color(0.3f, 0.2f, 0.1f),
                96, 3, 16f);
        }

        public static Sprite SwitchButton()
        {
            return PlaceholderResourceGenerator.CreateCircleSprite(
                new Color(0.9f, 0.3f, 0.3f), 32, 16f);
        }

        public static Sprite PressurePlate()
        {
            return PlaceholderResourceGenerator.CreateBoxSprite(
                new Color(0.5f, 0.5f, 0.55f),
                new Color(0.3f, 0.3f, 0.35f),
                96, 3, 16f);
        }

        public static Sprite Portal()
        {
            return PlaceholderResourceGenerator.CreateCircleSprite(
                new Color(0.3f, 0.7f, 1f), 128, 16f);
        }

        public static Sprite Background()
        {
            return PlaceholderResourceGenerator.CreateSolidTexture(
                32, 32, new Color(0.15f, 0.17f, 0.22f));
        }
    }

    public static class SpriteExtensions
    {
        public static Sprite CreateSprite(this Texture2D tex, Rect rect, Vector2 pivot, float ppu)
        {
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, rect, pivot, ppu);
        }
    }
}
