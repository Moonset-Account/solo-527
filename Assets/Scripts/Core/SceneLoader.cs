using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using DecorMatch3.Utils;
using DecorMatch3.Core.Events;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

namespace DecorMatch3.Core
{
    public class SceneLoader : Singleton<SceneLoader>
    {
        public enum SceneName
        {
            Boot,
            MainMenu,
            Match3Level,
            DecorationStudio,
            OrderManagement,
            Settings
        }

        private readonly Dictionary<string, AsyncOperationHandle> _loadedAddressables = new Dictionary<string, AsyncOperationHandle>();
        private readonly Dictionary<string, AsyncOperation> _sceneOperations = new Dictionary<string, AsyncOperation>();

        public bool IsLoading { get; private set; }
        public float LoadingProgress { get; private set; }

        public event Action<float> OnLoadingProgress;
        public event Action<string> OnSceneLoaded;

        public void LoadScene(SceneName scene, bool additive = false, Action onComplete = null)
        {
            StartCoroutine(LoadSceneAsync(scene.ToString(), additive, onComplete));
        }

        public void LoadSceneByName(string sceneName, bool additive = false, Action onComplete = null)
        {
            StartCoroutine(LoadSceneAsync(sceneName, additive, onComplete));
        }

        private IEnumerator LoadSceneAsync(string sceneName, bool additive, Action onComplete)
        {
            IsLoading = true;
            LoadingProgress = 0f;

            EventBus.Publish(new SceneLoadStartedEvent
            {
                SceneName = sceneName,
                Progress = 0f
            });

            OnLoadingProgress?.Invoke(0f);

            LoadSceneMode mode = additive ? LoadSceneMode.Additive : LoadSceneMode.Single;
            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync(sceneName, mode);
            _sceneOperations[sceneName] = asyncLoad;

            asyncLoad.allowSceneActivation = false;

            while (!asyncLoad.isDone)
            {
                LoadingProgress = Mathf.Clamp01(asyncLoad.progress / 0.9f);
                OnLoadingProgress?.Invoke(LoadingProgress);

                EventBus.Publish(new SceneLoadStartedEvent
                {
                    SceneName = sceneName,
                    Progress = LoadingProgress
                });

                if (asyncLoad.progress >= 0.9f)
                {
                    asyncLoad.allowSceneActivation = true;
                }

                yield return null;
            }

            LoadingProgress = 1f;
            OnLoadingProgress?.Invoke(1f);
            IsLoading = false;

            Debug.Log($"[SceneLoader] Scene loaded: {sceneName}");

            EventBus.Publish(new SceneLoadCompletedEvent
            {
                SceneName = sceneName
            });

            OnSceneLoaded?.Invoke(sceneName);
            onComplete?.Invoke();

            if (_sceneOperations.ContainsKey(sceneName))
            {
                _sceneOperations.Remove(sceneName);
            }
        }

        public void UnloadScene(SceneName scene, Action onComplete = null)
        {
            StartCoroutine(UnloadSceneAsync(scene.ToString(), onComplete));
        }

        private IEnumerator UnloadSceneAsync(string sceneName, Action onComplete)
        {
            if (!SceneManager.GetSceneByName(sceneName).IsValid())
            {
                onComplete?.Invoke();
                yield break;
            }

            AsyncOperation asyncUnload = SceneManager.UnloadSceneAsync(sceneName);

            while (!asyncUnload.isDone)
            {
                yield return null;
            }

            Debug.Log($"[SceneLoader] Scene unloaded: {sceneName}");
            onComplete?.Invoke();
        }

        public void PreloadAsset<T>(string addressableKey) where T : UnityEngine.Object
        {
            if (_loadedAddressables.ContainsKey(addressableKey))
            {
                return;
            }

            StartCoroutine(PreloadAssetAsync<T>(addressableKey));
        }

        private IEnumerator PreloadAssetAsync<T>(string addressableKey) where T : UnityEngine.Object
        {
            AsyncOperationHandle<T> handle = Addressables.LoadAssetAsync<T>(addressableKey);
            _loadedAddressables[addressableKey] = handle;

            yield return handle;

            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                Debug.Log($"[SceneLoader] Asset preloaded: {addressableKey}");
            }
            else
            {
                Debug.LogError($"[SceneLoader] Failed to preload asset: {addressableKey}");
                if (_loadedAddressables.ContainsKey(addressableKey))
                {
                    _loadedAddressables.Remove(addressableKey);
                }
            }
        }

        public T GetPreloadedAsset<T>(string addressableKey) where T : UnityEngine.Object
        {
            if (_loadedAddressables.TryGetValue(addressableKey, out AsyncOperationHandle handle))
            {
                if (handle.Status == AsyncOperationStatus.Succeeded)
                {
                    return handle.Result as T;
                }
            }
            return null;
        }

        public void ReleasePreloadedAsset(string addressableKey)
        {
            if (_loadedAddressables.TryGetValue(addressableKey, out AsyncOperationHandle handle))
            {
                Addressables.Release(handle);
                _loadedAddressables.Remove(addressableKey);
                Debug.Log($"[SceneLoader] Asset released: {addressableKey}");
            }
        }

        public void PreloadResources(string[] resourcePaths)
        {
            StartCoroutine(PreloadResourcesAsync(resourcePaths));
        }

        private IEnumerator PreloadResourcesAsync(string[] resourcePaths)
        {
            foreach (string path in resourcePaths)
            {
                ResourceRequest request = Resources.LoadAsync(path);
                yield return request;

                if (request.asset == null)
                {
                    Debug.LogWarning($"[SceneLoader] Failed to preload resource: {path}");
                }
            }

            Debug.Log($"[SceneLoader] Preloaded {resourcePaths.Length} resources");
        }

        public void ReleaseAllPreloaded()
        {
            foreach (var kvp in _loadedAddressables)
            {
                Addressables.Release(kvp.Value);
            }
            _loadedAddressables.Clear();
            Resources.UnloadUnusedAssets();
        }
    }
}
