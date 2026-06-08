using UnityEngine;
using UnityEngine.SceneManagement;
using System;
using System.Collections;

namespace ShadowPlatformer.Core
{
    public class SceneLoader : MonoBehaviour
    {
        public static SceneLoader Instance { get; private set; }

        public bool IsLoading { get; private set; }
        public event Action<string> OnSceneLoadStarted;
        public event Action<string> OnSceneLoadCompleted;

        private Action _onLoadedCallback;

        private void Awake()
        {
            if (Instance != null && Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void LoadScene(string sceneName, Action onLoaded = null)
        {
            if (IsLoading) return;
            StartCoroutine(LoadSceneAsync(sceneName, onLoaded));
        }

        private IEnumerator LoadSceneAsync(string sceneName, Action onLoaded)
        {
            IsLoading = true;
            OnSceneLoadStarted?.Invoke(sceneName);

            var op = SceneManager.LoadSceneAsync(sceneName);
            op.allowSceneActivation = false;

            while (op.progress < 0.9f)
                yield return null;

            op.allowSceneActivation = true;

            while (!op.isDone)
                yield return null;

            IsLoading = false;
            OnSceneLoadCompleted?.Invoke(sceneName);
            onLoaded?.Invoke();
        }
    }
}
