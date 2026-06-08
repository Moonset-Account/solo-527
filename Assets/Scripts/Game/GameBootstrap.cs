using UnityEngine;
using UnityEngine.SceneManagement;
using ShadowPlatformer.Core;
using ShadowPlatformer.Level;
using ShadowPlatformer.Light;
using ShadowPlatformer.Save;
using ShadowPlatformer.Audio;
using ShadowPlatformer.Analytics;

namespace ShadowPlatformer.Game
{
    public static class GameBootstrap
    {
        private static bool _managersCreated;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void CreateManagers()
        {
            if (_managersCreated) return;
            _managersCreated = true;

            CreateSingleton<GameManager>("GameManager");
            CreateSingleton<SceneLoader>("SceneLoader");
            CreateSingleton<ResourcePreloader>("ResourcePreloader");
            CreateSingleton<LevelManager>("LevelManager");
            CreateSingleton<LightManager>("LightManager");
            CreateSingleton<SaveManager>("SaveManager");
            CreateSingleton<AudioManager>("AudioManager");
            CreateSingleton<PlaytestRecorder>("PlaytestRecorder");

            var lm = LevelManager.Instance;
            if (lm != null)
            {
                var manifestJson = Resources.Load<TextAsset>("Levels/level_manifest");
                if (manifestJson != null)
                {
                    var manifest = JsonUtility.FromJson<LevelManifest>(manifestJson.text);
                    lm.LoadManifest(manifest);
                }
            }
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void SetupScene()
        {
            string sceneName = SceneManager.GetActiveScene().name;
            var builderObj = new GameObject("SceneBuilder");
            var rsb = builderObj.AddComponent<RuntimeSceneBuilder>();

            if (sceneName == "MainMenu")
            {
                rsb.sceneType = RuntimeSceneBuilder.SceneType.MainMenu;
            }
            else
            {
                rsb.sceneType = RuntimeSceneBuilder.SceneType.Level;
                rsb.levelId = SceneNameToLevelId(sceneName);
            }
        }

        private static string SceneNameToLevelId(string sceneName)
        {
            switch (sceneName)
            {
                case "Level_Tutorial_01": return "tut_01";
                case "Level_Tutorial_02": return "tut_02";
                case "Level_Tutorial_03": return "tut_03";
                case "Level_01": return "lvl_01";
                case "Level_02": return "lvl_02";
                case "Level_03": return "lvl_03";
                default: return "tut_01";
            }
        }

        private static T CreateSingleton<T>(string name) where T : MonoBehaviour
        {
            var go = new GameObject(name);
            DontDestroyOnLoad(go);
            return go.AddComponent<T>();
        }
    }
}
