using UnityEngine;

namespace LightShadowPlatformer.Core
{
    [DisallowMultipleComponent]
    [AddComponentMenu("")]
    public class SceneBootstrap : MonoBehaviour
    {
        private static bool _migrated;

        private void Awake()
        {
            if (_migrated) { Destroy(gameObject); return; }
            _migrated = true;
            Debug.LogWarning("[SceneBootstrap] Legacy Core.SceneBootstrap is deprecated. Runtime.SceneBootstrap (via RuntimeInitializeOnLoadMethod) is now the entry point.");
            Destroy(gameObject);
        }
    }
}
