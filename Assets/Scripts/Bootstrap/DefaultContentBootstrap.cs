using BeatRunner.Core;
using BeatRunner.Data;
using BeatRunner.Tools;
using UnityEngine;

namespace BeatRunner.Bootstrap
{
    public class DefaultContentBootstrap : MonoBehaviour
    {
        [SerializeField] private TrackLibrary _library;

        [ContextMenu("Generate Default Track Library")]
        public TrackLibrary GenerateDefaultLibrary()
        {
            var library = ScriptableObject.CreateInstance<TrackLibrary>();

            Color[] colors = new[]
            {
                new Color(0.2f, 0.5f, 1f),
                new Color(1f, 0.3f, 0.5f),
                new Color(0.3f, 1f, 0.6f),
                new Color(1f, 0.8f, 0.2f),
                new Color(0.8f, 0.3f, 1f)
            };

            string[] names = { "Neon Pulse", "Cyber Sunset", "Digital Dreams", "Electric Storm", "Quantum Leap" };
            string[] artists = { "SynthWave 84", "Midnight Circuit", "Retro Futura", "Glitch Protocol", "Prism" };
            float[] bpms = { 110f, 128f, 140f, 155f, 172f };

            for (int i = 0; i < names.Length; i++)
            {
                var track = ScriptableObject.CreateInstance<TrackData>();
                track.trackId = $"track_{i:D3}";
                track.trackName = names[i];
                track.artistName = artists[i];
                track.bpm = bpms[i];
                track.description = $"一首节奏{(bpms[i] < 130 ? "舒缓" : bpms[i] < 160 ? "动感" : "急促")}的曲目，适合练习和挑战。";
                track.themeColor = colors[i];
                track.isUnlockedByDefault = i == 0;
                track.requiredFragments = i * 30;
                track.fragmentReward = 10;

                track.easyLevel = LevelGenerator.GenerateLevelEasy(bpms[i], 24 + i * 4);
                track.normalLevel = LevelGenerator.GenerateLevelNormal(bpms[i], 32 + i * 4);
                track.hardLevel = LevelGenerator.GenerateLevelHard(bpms[i], 40 + i * 4);

                library.tracks.Add(track);
            }

            Color[] skinColors =
            {
                Color.white, new Color(0.5f, 0.8f, 1f), new Color(1f, 0.6f, 0.3f),
                new Color(0.6f, 1f, 0.5f), new Color(0.9f, 0.4f, 0.9f), new Color(1f, 1f, 0.4f)
            };
            string[] skinNames = { "默认", "极光蓝", "熔岩橙", "森林绿", "霓虹紫", "赛博黄" };

            for (int i = 0; i < skinNames.Length; i++)
            {
                var skin = ScriptableObject.CreateInstance<SkinData>();
                skin.skinId = $"skin_{i:D3}";
                skin.skinName = skinNames[i];
                skin.primaryColor = skinColors[i];
                skin.secondaryColor = Color.Lerp(skinColors[i], Color.white, 0.3f);
                skin.trailColor = Color.Lerp(skinColors[i], Color.magenta, 0.4f);
                skin.isUnlockedByDefault = i == 0;
                skin.requiredFragments = i * 50;

                library.skins.Add(skin);
            }

            return library;
        }

        [ContextMenu("Save Library Assets")]
        public void SaveLibrary()
        {
#if UNITY_EDITOR
            var lib = GenerateDefaultLibrary();
            string folder = "Assets/Resources/Data";
            if (!System.IO.Directory.Exists(folder))
            {
                UnityEditor.AssetDatabase.CreateFolder("Assets/Resources", "Data");
            }
            UnityEditor.AssetDatabase.CreateAsset(lib, $"{folder}/DefaultTrackLibrary.asset");

            foreach (var t in lib.tracks)
            {
                UnityEditor.AssetDatabase.AddObjectToAsset(t, lib);
            }
            foreach (var s in lib.skins)
            {
                UnityEditor.AssetDatabase.AddObjectToAsset(s, lib);
            }

            UnityEditor.EditorUtility.SetDirty(lib);
            UnityEditor.AssetDatabase.SaveAssets();
            UnityEditor.AssetDatabase.Refresh();
            Debug.Log("Track library saved.");
#endif
        }
    }
}
