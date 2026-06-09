using UnityEngine;
using UnityEngine.EventSystems;

namespace PixelPlantLab.Bootstrap
{
    public static class AutoStartLoader
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AfterSceneLoad()
        {
            EnsureCoreSystems();
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void EarlyInit()
        {
            Application.runInBackground = true;
            QualitySettings.vSyncCount = 1;
            Application.targetFrameRate = 60;
        }

        private static void EnsureCoreSystems()
        {
            if (SceneBootstrap.Instance == null)
            {
                var go = new GameObject("[SceneBootstrap_Auto]");
                go.AddComponent<SceneBootstrap>();
            }

            if (EventSystem.current == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<EventSystem>();
                es.AddComponent<StandaloneInputModule>();
            }
        }
    }
}
