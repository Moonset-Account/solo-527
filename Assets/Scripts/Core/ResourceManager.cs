using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Core
{
    public class ResourceManager : Singleton<ResourceManager>
    {
        private Dictionary<string, UnityEngine.Object> _resourceCache = new Dictionary<string, UnityEngine.Object>();
        private Dictionary<string, AsyncOperation> _loadingOperations = new Dictionary<string, AsyncOperation>();

        public T Load<T>(string path) where T : UnityEngine.Object
        {
            if (_resourceCache.TryGetValue(path, out UnityEngine.Object cachedResource))
            {
                return cachedResource as T;
            }

            T resource = Resources.Load<T>(path);
            if (resource != null)
            {
                _resourceCache[path] = resource;
            }
            else
            {
                Debug.LogWarning($"[ResourceManager] Failed to load resource at path: {path}");
            }

            return resource;
        }

        public void LoadAsync<T>(string path, Action<T> onComplete, Action<float> onProgress = null) where T : UnityEngine.Object
        {
            if (_resourceCache.TryGetValue(path, out UnityEngine.Object cachedResource))
            {
                onProgress?.Invoke(1.0f);
                onComplete?.Invoke(cachedResource as T);
                return;
            }

            if (_loadingOperations.ContainsKey(path))
            {
                Debug.LogWarning($"[ResourceManager] Resource already loading: {path}");
                return;
            }

            StartCoroutine(LoadAsyncCoroutine(path, onComplete, onProgress));
        }

        private IEnumerator LoadAsyncCoroutine<T>(string path, Action<T> onComplete, Action<float> onProgress) where T : UnityEngine.Object
        {
            ResourceRequest request = Resources.LoadAsync<T>(path);
            _loadingOperations[path] = request;

            while (!request.isDone)
            {
                onProgress?.Invoke(request.progress);
                yield return null;
            }

            onProgress?.Invoke(1.0f);
            _loadingOperations.Remove(path);

            if (request.asset != null)
            {
                _resourceCache[path] = request.asset;
                onComplete?.Invoke(request.asset as T);
            }
            else
            {
                Debug.LogWarning($"[ResourceManager] Failed to load async resource at path: {path}");
                onComplete?.Invoke(null);
            }
        }

        public GameObject InstantiatePrefab(string path, Transform parent = null)
        {
            GameObject prefab = Load<GameObject>(path);
            if (prefab == null) return null;

            GameObject instance = parent != null
                ? GameObject.Instantiate(prefab, parent)
                : GameObject.Instantiate(prefab);

            return instance;
        }

        public T InstantiatePrefab<T>(string path, Transform parent = null) where T : Component
        {
            GameObject instance = InstantiatePrefab(path, parent);
            return instance != null ? instance.GetComponent<T>() : null;
        }

        public void Unload(string path)
        {
            if (_resourceCache.TryGetValue(path, out UnityEngine.Object resource))
            {
                Resources.UnloadAsset(resource);
                _resourceCache.Remove(path);
            }
        }

        public void UnloadUnusedAssets(Action onComplete = null)
        {
            StartCoroutine(UnloadUnusedAssetsCoroutine(onComplete));
        }

        private IEnumerator UnloadUnusedAssetsCoroutine(Action onComplete)
        {
            AsyncOperation operation = Resources.UnloadUnusedAssets();
            while (!operation.isDone)
            {
                yield return null;
            }
            onComplete?.Invoke();
        }

        public void ClearCache()
        {
            _resourceCache.Clear();
        }

        public int CachedResourceCount => _resourceCache.Count;
    }
}
