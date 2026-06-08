using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace DecorMatch3.Core
{
    public enum SceneType
    {
        Bootstrap,
        MainMenu,
        Match3Level,
        Decoration,
        Settings
    }

    public class SceneLoader : Singleton<SceneLoader>
    {
        public event Action<float> OnLoadProgress;
        public event Action<SceneType> OnSceneLoaded;
        public event Action<SceneType> OnSceneUnloaded;

        public SceneType CurrentScene { get; private set; } = SceneType.Bootstrap;
        public bool IsLoading { get; private set; }

        private AsyncOperation _currentOperation;

        public void LoadScene(SceneType sceneType, bool additive = false, Action onComplete = null)
        {
            if (IsLoading)
            {
                Debug.LogWarning("[SceneLoader] Already loading a scene!");
                return;
            }

            StartCoroutine(LoadSceneAsync(sceneType, additive, onComplete));
        }

        private IEnumerator LoadSceneAsync(SceneType sceneType, bool additive, Action onComplete)
        {
            IsLoading = true;

            LoadSceneMode mode = additive ? LoadSceneMode.Additive : LoadSceneMode.Single;
            string sceneName = GetSceneName(sceneType);

            if (!additive && CurrentScene != SceneType.Bootstrap)
            {
                OnSceneUnloaded?.Invoke(CurrentScene);
            }

            _currentOperation = SceneManager.LoadSceneAsync(sceneName, mode);
            _currentOperation.allowSceneActivation = false;

            while (_currentOperation.progress < 0.9f)
            {
                OnLoadProgress?.Invoke(_currentOperation.progress);
                yield return null;
            }

            OnLoadProgress?.Invoke(1.0f);
            _currentOperation.allowSceneActivation = true;

            while (!_currentOperation.isDone)
            {
                yield return null;
            }

            if (!additive)
            {
                CurrentScene = sceneType;
            }

            IsLoading = false;
            OnSceneLoaded?.Invoke(sceneType);
            onComplete?.Invoke();

            EventBus.Publish(new SceneLoadedEvent { SceneType = sceneType });
        }

        public void UnloadScene(SceneType sceneType, Action onComplete = null)
        {
            StartCoroutine(UnloadSceneAsync(sceneType, onComplete));
        }

        private IEnumerator UnloadSceneAsync(SceneType sceneType, Action onComplete)
        {
            string sceneName = GetSceneName(sceneType);
            AsyncOperation operation = SceneManager.UnloadSceneAsync(sceneName);

            while (operation != null && !operation.isDone)
            {
                yield return null;
            }

            OnSceneUnloaded?.Invoke(sceneType);
            onComplete?.Invoke();
        }

        public void ReloadCurrentScene(Action onComplete = null)
        {
            LoadScene(CurrentScene, false, onComplete);
        }

        private string GetSceneName(SceneType sceneType)
        {
            switch (sceneType)
            {
                case SceneType.Bootstrap: return "Bootstrap";
                case SceneType.MainMenu: return "MainMenu";
                case SceneType.Match3Level: return "Match3Level";
                case SceneType.Decoration: return "Decoration";
                case SceneType.Settings: return "Settings";
                default: return "MainMenu";
            }
        }
    }

    public struct SceneLoadedEvent
    {
        public SceneType SceneType;
    }

    public struct SceneUnloadedEvent
    {
        public SceneType SceneType;
    }
}
