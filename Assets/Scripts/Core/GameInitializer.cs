using System.Collections;
using UnityEngine;
using ShadowPlatformer.Level;
using ShadowPlatformer.Core;
using ShadowPlatformer.Save;

namespace ShadowPlatformer.Core
{
    public class GameInitializer : MonoBehaviour
    {
        public LevelManifest levelManifest;
        public bool preloadResources = true;

        private IEnumerator Start()
        {
            if (LevelManager.Instance != null && levelManifest != null)
                LevelManager.Instance.LoadManifest(levelManifest);

            if (preloadResources && ResourcePreloader.Instance != null)
                yield return ResourcePreloader.Instance.PreloadAll();

            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.LoadGame();
                SaveManager.Instance.ApplySettings(SaveManager.Instance.CurrentSave.settings);
            }

            yield return null;
        }
    }
}
