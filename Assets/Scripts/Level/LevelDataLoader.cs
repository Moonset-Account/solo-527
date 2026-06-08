using UnityEngine;
using ShadowPlatformer.Level;
using ShadowPlatformer.Light;

namespace ShadowPlatformer.Level
{
    public class LevelDataLoader : MonoBehaviour
    {
        public string layoutJsonPath = "Levels/";
        public TextAsset manifestJson;

        private void Start()
        {
            if (manifestJson != null)
            {
                var manifest = JsonUtility.FromJson<LevelManifest>(manifestJson.text);
                LevelManager.Instance?.LoadManifest(manifest);
            }
        }

        public LevelLayout LoadLayout(string levelId)
        {
            string path = layoutJsonPath + "layout_" + levelId;
            var asset = Resources.Load<TextAsset>(path);
            if (asset != null)
                return JsonUtility.FromJson<LevelLayout>(asset.text);

            Debug.LogWarning($"Level layout not found: {path}");
            return null;
        }
    }
}
