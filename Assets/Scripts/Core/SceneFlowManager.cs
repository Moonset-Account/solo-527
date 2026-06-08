using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneFlowManager : Singleton<SceneFlowManager>
{
    public event Action<string> OnSceneLoadStarted;
    public event Action<string> OnSceneLoadCompleted;

    [SerializeField] private float _fadeDuration = 0.5f;
    [SerializeField] private CanvasGroup _fadeCanvasGroup;

    private bool _isLoading;

    public void LoadScene(string sceneName)
    {
        if (_isLoading) return;

        StartCoroutine(LoadSceneRoutine(sceneName));
    }

    public void LoadSceneAsync(string sceneName)
    {
        if (_isLoading) return;

        StartCoroutine(LoadSceneAsyncRoutine(sceneName));
    }

    private IEnumerator LoadSceneRoutine(string sceneName)
    {
        _isLoading = true;
        OnSceneLoadStarted?.Invoke(sceneName);

        yield return FadeOut();

        SceneManager.LoadScene(sceneName);

        yield return FadeIn();

        OnSceneLoadCompleted?.Invoke(sceneName);
        _isLoading = false;
    }

    private IEnumerator LoadSceneAsyncRoutine(string sceneName)
    {
        _isLoading = true;
        OnSceneLoadStarted?.Invoke(sceneName);

        yield return FadeOut();

        AsyncOperation asyncLoad = SceneManager.LoadSceneAsync(sceneName);
        asyncLoad.allowSceneActivation = false;

        while (asyncLoad.progress < 0.9f)
            yield return null;

        asyncLoad.allowSceneActivation = true;

        while (!asyncLoad.isDone)
            yield return null;

        yield return FadeIn();

        OnSceneLoadCompleted?.Invoke(sceneName);
        _isLoading = false;
    }

    private IEnumerator FadeOut()
    {
        if (_fadeCanvasGroup == null)
            yield break;

        _fadeCanvasGroup.blocksRaycasts = true;
        float elapsed = 0f;

        while (elapsed < _fadeDuration)
        {
            elapsed += Time.unscaledDeltaTime;
            _fadeCanvasGroup.alpha = Mathf.Clamp01(elapsed / _fadeDuration);
            yield return null;
        }

        _fadeCanvasGroup.alpha = 1f;
    }

    private IEnumerator FadeIn()
    {
        if (_fadeCanvasGroup == null)
            yield break;

        float elapsed = 0f;

        while (elapsed < _fadeDuration)
        {
            elapsed += Time.unscaledDeltaTime;
            _fadeCanvasGroup.alpha = 1f - Mathf.Clamp01(elapsed / _fadeDuration);
            yield return null;
        }

        _fadeCanvasGroup.alpha = 0f;
        _fadeCanvasGroup.blocksRaycasts = false;
    }

    public static string GetSceneName(GameState gameState)
    {
        return gameState switch
        {
            GameState.Menu => "MainMenu",
            GameState.Tutorial => "Tutorial",
            GameState.LevelSelect => "LevelSelect",
            GameState.Gameplay => "Gameplay",
            GameState.Paused => "Gameplay",
            GameState.Settlement => "Gameplay",
            GameState.Failure => "Gameplay",
            _ => "MainMenu"
        };
    }
}
