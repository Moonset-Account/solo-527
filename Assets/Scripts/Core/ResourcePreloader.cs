using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;

namespace ShadowPlatformer.Core
{
    public class ResourcePreloader : MonoBehaviour
    {
        public static ResourcePreloader Instance { get; private set; }

        [Serializable]
        public class PreloadEntry
        {
            public string key;
            public string resourcePath;
        }

        public PreloadEntry[] preloadEntries;
        private Dictionary<string, UnityEngine.Object> _cache = new Dictionary<string, UnityEngine.Object>();
        public bool IsPreloaded { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public IEnumerator PreloadAll(Action<float> onProgress = null)
        {
            IsPreloaded = false;
            _cache.Clear();

            for (int i = 0; i < preloadEntries.Length; i++)
            {
                var entry = preloadEntries[i];
                if (!_cache.ContainsKey(entry.key))
                {
                    var res = Resources.Load(entry.resourcePath);
                    if (res != null)
                        _cache[entry.key] = res;
                }
                onProgress?.Invoke((float)(i + 1) / preloadEntries.Length);
                yield return null;
            }

            IsPreloaded = true;
        }

        public T Get<T>(string key) where T : UnityEngine.Object
        {
            if (_cache.TryGetValue(key, out var obj))
                return obj as T;
            return null;
        }

        public void PreloadAsset(string key, string resourcePath)
        {
            if (_cache.ContainsKey(key)) return;
            var res = Resources.Load(resourcePath);
            if (res != null)
                _cache[key] = res;
        }
    }
}
