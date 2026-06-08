using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace InkMountainBridge
{
    public class SceneLoader : MonoBehaviour
    {
        public float fadeDuration = 1f;

        private CanvasGroup fadeCanvasGroup;

        private void Awake()
        {
            fadeCanvasGroup = GetComponent<CanvasGroup>();
            if (fadeCanvasGroup != null)
            {
                fadeCanvasGroup.alpha = 0f;
                fadeCanvasGroup.blocksRaycasts = false;
            }
        }

        public void LoadScene(string sceneName)
        {
            StartCoroutine(LoadSceneRoutine(sceneName));
        }

        public void LoadSceneAsync(string sceneName)
        {
            StartCoroutine(LoadSceneAsyncRoutine(sceneName));
        }

        private IEnumerator LoadSceneRoutine(string sceneName)
        {
            yield return StartCoroutine(FadeIn());

            SceneManager.LoadScene(sceneName);

            yield return StartCoroutine(FadeOut());
        }

        private IEnumerator LoadSceneAsyncRoutine(string sceneName)
        {
            yield return StartCoroutine(FadeIn());

            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync(sceneName);
            while (!asyncLoad.isDone)
            {
                yield return null;
            }

            yield return StartCoroutine(FadeOut());
        }

        private IEnumerator FadeIn()
        {
            if (fadeCanvasGroup == null) yield break;
            fadeCanvasGroup.blocksRaycasts = true;
            float elapsed = 0f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                fadeCanvasGroup.alpha = Mathf.Clamp01(elapsed / fadeDuration);
                yield return null;
            }
            fadeCanvasGroup.alpha = 1f;
        }

        private IEnumerator FadeOut()
        {
            if (fadeCanvasGroup == null) yield break;
            float elapsed = 0f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                fadeCanvasGroup.alpha = Mathf.Clamp01(1f - (elapsed / fadeDuration));
                yield return null;
            }
            fadeCanvasGroup.alpha = 0f;
            fadeCanvasGroup.blocksRaycasts = false;
        }
    }
}
