using UnityEngine;

namespace LakeSailing.Bootstrap
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
                EnsureCamera();
                EnsureBootstrapper();
                EnsureAdditional();
                hasBooted = true;
            }
        }

        private void EnsureCamera()
        {
            if (Camera.main != null) return;
            var camGO = new GameObject("Main Camera");
            camGO.tag = "MainCamera";
            var cam = camGO.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 30f;
            cam.backgroundColor = new Color(0.53f, 0.81f, 0.92f, 1f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            camGO.AddComponent<AudioListener>();
        }

        private void EnsureBootstrapper()
        {
            if (Object.FindObjectOfType<GameBootstrapper>() != null) return;
            var go = new GameObject("[GameBootstrapper]");
            go.AddComponent<GameBootstrapper>();
        }

        private void EnsureAdditional()
        {
            UI.RuntimeUIBuilder.EnsureEventSystem();
        }
    }
}
