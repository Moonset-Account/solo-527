using UnityEngine;

namespace LakeSailing
{
    [DefaultExecutionOrder(-1000)]
    public class SceneInitializer : MonoBehaviour
    {
        [SerializeField] private bool autoBoot = true;

        private static bool hasBooted;

        private void Awake()
        {
            if (hasBooted)
            {
                Destroy(gameObject);
                return;
            }

            if (autoBoot)
            {
                EnsureBootstrapper();
            }
        }

        private void EnsureBootstrapper()
        {
            if (FindObjectOfType<GameBootstrapper>() == null)
            {
                var go = new GameObject("[GameBootstrapper]");
                go.AddComponent<GameBootstrapper>();
                hasBooted = true;
            }

            if (FindObjectOfType<LevelSceneManager>() == null)
            {
                var go = new GameObject("[LevelSceneManager]");
                go.AddComponent<LevelSceneManager>();
            }

            if (FindObjectOfType<InputController>() == null)
            {
                var go = new GameObject("[InputController]");
                go.AddComponent<InputController>();
            }

            if (Camera.main == null)
            {
                var camGO = new GameObject("Main Camera");
                camGO.tag = "MainCamera";
                var cam = camGO.AddComponent<Camera>();
                cam.orthographic = true;
                cam.orthographicSize = 30f;
                cam.backgroundColor = new Color(0.53f, 0.81f, 0.92f);
                camGO.AddComponent<AudioListener>();
            }
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void OnGameStart()
        {
            Application.logMessageReceived += HandleLog;
        }

        private static void HandleLog(string condition, string stackTrace, LogType type)
        {
            if (type == LogType.Exception)
            {
                Debug.LogError($"[GameBootstrap] Caught Exception: {condition}\n{stackTrace}");
            }
        }
    }
}
