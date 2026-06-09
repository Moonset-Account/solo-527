using System;
using BeatRunner.Bootstrap;
using BeatRunner.Core;
using BeatRunner.Data;
using BeatRunner.Tools;
using UnityEngine;

namespace BeatRunner.Resources
{
    public static class RuntimeContentLoader
    {
        private static TrackLibrary _cachedLibrary;
        private static GameSettings _cachedSettings;
        private static RuntimeGameData _cachedRuntime;
        private static Sprite _cachedWhiteSprite;
        private static Font _cachedFont;

        public static GameSettings GetOrCreateGameSettings()
        {
            if (_cachedSettings != null) return _cachedSettings;

            _cachedSettings = UnityEngine.Resources.Load<GameSettings>("Settings/GameSettings");
            if (_cachedSettings == null)
            {
                _cachedSettings = ScriptableObject.CreateInstance<GameSettings>();
            }
            if (!ServiceLocator.TryGet(out GameSettings _))
            {
                ServiceLocator.Register(_cachedSettings);
            }
            return _cachedSettings;
        }

        public static RuntimeGameData GetOrCreateRuntimeData()
        {
            if (_cachedRuntime != null) return _cachedRuntime;

            _cachedRuntime = UnityEngine.Resources.Load<RuntimeGameData>("Settings/RuntimeGameData");
            if (_cachedRuntime == null)
            {
                _cachedRuntime = ScriptableObject.CreateInstance<RuntimeGameData>();
            }
            if (!ServiceLocator.TryGet(out RuntimeGameData _))
            {
                ServiceLocator.Register(_cachedRuntime);
            }
            return _cachedRuntime;
        }

        public static TrackLibrary GetOrCreateTrackLibrary()
        {
            if (_cachedLibrary != null) return _cachedLibrary;

            _cachedLibrary = UnityEngine.Resources.Load<TrackLibrary>("Data/DefaultTrackLibrary");
            if (_cachedLibrary == null)
            {
                var gen = new DefaultContentBootstrap();
                _cachedLibrary = gen.GenerateDefaultLibrary();
            }
            if (!ServiceLocator.TryGet(out TrackLibrary _))
            {
                ServiceLocator.Register(_cachedLibrary);
            }
            return _cachedLibrary;
        }

        public static Sprite GetWhiteSprite()
        {
            if (_cachedWhiteSprite != null) return _cachedWhiteSprite;
            var tex = new Texture2D(4, 4, TextureFormat.RGBA32, false);
            var pixels = new Color32[16];
            for (int i = 0; i < 16; i++) pixels[i] = new Color32(255, 255, 255, 255);
            tex.SetPixels32(pixels);
            tex.Apply();
            _cachedWhiteSprite = Sprite.Create(tex, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            return _cachedWhiteSprite;
        }

        public static Sprite CreateSolidColorSprite(Color color, int width = 8, int height = 8)
        {
            var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            var pixels = new Color32[width * height];
            byte r = (byte)(Mathf.Clamp01(color.r) * 255);
            byte g = (byte)(Mathf.Clamp01(color.g) * 255);
            byte b = (byte)(Mathf.Clamp01(color.b) * 255);
            byte a = (byte)(Mathf.Clamp01(color.a) * 255);
            for (int i = 0; i < pixels.Length; i++) pixels[i] = new Color32(r, g, b, a);
            tex.SetPixels32(pixels);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f));
        }

        public static Font GetDefaultFont()
        {
            if (_cachedFont != null) return _cachedFont;
            _cachedFont = Font.CreateDynamicFontFromOSFont(new[] { "Arial", "Helvetica", "PingFang SC", "Microsoft YaHei", "Heiti SC", "SimHei" }, 14);
            if (_cachedFont == null) _cachedFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            return _cachedFont;
        }

        public static AudioClip CreateClickClip(float frequency = 880f, float duration = 0.06f, int sampleRate = 44100)
        {
            int samples = Mathf.Max(1, Mathf.RoundToInt(sampleRate * duration));
            var data = new float[samples];
            float attack = 0.01f;
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / sampleRate;
                float env = 1f;
                if (t < attack) env = t / attack;
                else env = Mathf.Exp(-(t - attack) * 60f);
                float phase = 2f * Mathf.PI * frequency * t;
                float s = Mathf.Sin(phase) * 0.5f + Mathf.Sin(phase * 2f) * 0.2f;
                data[i] = Mathf.Clamp(s * env * 0.8f, -1f, 1f);
            }
            var clip = AudioClip.Create("MetronomeClick", samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
