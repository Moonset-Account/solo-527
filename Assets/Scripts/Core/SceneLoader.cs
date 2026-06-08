using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace SpaceCourier.Core
{
    public class SceneLoader : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.SceneLoader;

        private AsyncOperation currentLoadOperation;
        private readonly Dictionary<string, object> preloadedAssets = new Dictionary<string, object>();
        private bool isLoading = false;

        public event Action<string> OnSceneLoadStarted;
        public event Action<string, float> OnSceneLoadProgress;
        public event Action<string> OnSceneLoadCompleted;

        public void Initialize()
        {
            SceneManager.sceneLoaded += HandleSceneLoaded;
            SceneManager.sceneUnloaded += HandleSceneUnloaded;
            Debug.Log("[SceneLoader] Initialized.");
        }

        public void Shutdown()
        {
            SceneManager.sceneLoaded -= HandleSceneLoaded;
            SceneManager.sceneUnloaded -= HandleSceneUnloaded;
            preloadedAssets.Clear();
        }

        public void LoadScene(string sceneName, bool additive = false)
        {
            if (isLoading)
            {
                Debug.LogWarning("[SceneLoader] Already loading a scene, skipping.");
                return;
            }

            StartCoroutine(LoadSceneAsync(sceneName, additive));
        }

        private IEnumerator LoadSceneAsync(string sceneName, bool additive)
        {
            isLoading = true;
            OnSceneLoadStarted?.Invoke(sceneName);
            EventBus.Publish(new GameEvents.SceneLoadStarted { SceneName = sceneName });
            Debug.Log($"[SceneLoader] Loading scene: {sceneName}");

            var loadMode = additive ? LoadSceneMode.Additive : LoadSceneMode.Single;
            currentLoadOperation = SceneManager.LoadSceneAsync(sceneName, loadMode);
            currentLoadOperation.allowSceneActivation = false;

            while (!currentLoadOperation.isDone)
            {
                var progress = Mathf.Clamp01(currentLoadOperation.progress / 0.9f);
                OnSceneLoadProgress?.Invoke(sceneName, progress);
                EventBus.Publish(new GameEvents.SceneLoadProgress
                {
                    SceneName = sceneName,
                    Progress = progress
                });

                yield return null;

                if (currentLoadOperation.progress >= 0.9f)
                {
                    yield return new WaitForSeconds(0.3f);
                    currentLoadOperation.allowSceneActivation = true;
                }
            }

            isLoading = false;
            OnSceneLoadCompleted?.Invoke(sceneName);
            EventBus.Publish(new GameEvents.SceneLoadCompleted { SceneName = sceneName });
            Debug.Log($"[SceneLoader] Scene loaded: {sceneName}");
        }

        public void PreloadAsset<T>(string assetPath) where T : UnityEngine.Object
        {
            if (preloadedAssets.ContainsKey(assetPath)) return;

            var resource = Resources.Load<T>(assetPath);
            if (resource != null)
            {
                preloadedAssets[assetPath] = resource;
                Debug.Log($"[SceneLoader] Preloaded asset: {assetPath}");
            }
            else
            {
                Debug.LogWarning($"[SceneLoader] Failed to preload asset: {assetPath}");
            }
        }

        public T GetPreloadedAsset<T>(string assetPath) where T : UnityEngine.Object
        {
            if (preloadedAssets.TryGetValue(assetPath, out var asset))
            {
                return asset as T;
            }
            return Resources.Load<T>(assetPath);
        }

        public void PreloadSceneAssets(string sceneName)
        {
            var uiManager = GameManager.Instance?.GetModule<UI.UIManager>(ModuleType.UIManager);
            if (uiManager != null)
            {
                PreloadAsset<AudioClip>($"Audio/{sceneName}_bgm");
            }
        }

        public void UnloadUnusedAssets()
        {
            StartCoroutine(UnloadUnusedAssetsAsync());
        }

        private IEnumerator UnloadUnusedAssetsAsync()
        {
            var operation = Resources.UnloadUnusedAssets();
            while (!operation.isDone)
            {
                yield return null;
            }
            Debug.Log("[SceneLoader] Unused assets unloaded.");
        }

        private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            Debug.Log($"[SceneLoader] Scene '{scene.name}' loaded (mode: {mode}).");
        }

        private void HandleSceneUnloaded(Scene scene)
        {
            Debug.Log($"[SceneLoader] Scene '{scene.name}' unloaded.");
        }
    }
}
