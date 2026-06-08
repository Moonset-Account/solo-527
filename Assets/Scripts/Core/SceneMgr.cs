using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class SceneMgr : MonoBehaviour
{
    public static SceneMgr Instance { get; private set; }

    public string CurrentSceneName => SceneManager.GetActiveScene().name;

    public event Action<string> OnSceneLoaded;

    private bool _isTransitioning;
    private CanvasGroup _fadeCanvasGroup;
    private GameObject _loadingScreenObj;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        SceneManager.sceneLoaded += HandleSceneLoaded;
    }

    private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        OnSceneLoaded?.Invoke(scene.name);
    }

    public void LoadScene(string sceneName)
    {
        if (_isTransitioning) return;
        StartCoroutine(LoadSceneRoutine(sceneName));
    }

    private IEnumerator LoadSceneRoutine(string sceneName)
    {
        _isTransitioning = true;
        yield return StartCoroutine(FadeOut());

        var asyncOp = SceneManager.LoadSceneAsync(sceneName);
        asyncOp.allowSceneActivation = false;

        EnsureLoadingScreen();
        _loadingScreenObj.SetActive(true);

        while (asyncOp.progress < 0.9f)
        {
            yield return null;
        }

        asyncOp.allowSceneActivation = true;

        while (!asyncOp.isDone)
        {
            yield return null;
        }

        _loadingScreenObj.SetActive(false);
        yield return StartCoroutine(FadeIn());
        _isTransitioning = false;
    }

    private void EnsureLoadingScreen()
    {
        if (_loadingScreenObj != null) return;

        _loadingScreenObj = new GameObject("LoadingScreen");
        _loadingScreenObj.transform.SetParent(transform);
        var canvas = _loadingScreenObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 9999;
        _loadingScreenObj.AddComponent<CanvasScaler>();
        _loadingScreenObj.AddComponent<GraphicRaycaster>();

        var imgObj = new GameObject("Background");
        imgObj.transform.SetParent(_loadingScreenObj.transform, false);
        var img = imgObj.AddComponent<UnityEngine.UI.Image>();
        img.color = Color.black;
        var rt = img.GetComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.sizeDelta = Vector2.zero;

        _loadingScreenObj.SetActive(false);
    }

    private void EnsureFadeOverlay()
    {
        if (_fadeCanvasGroup != null) return;

        var fadeObj = new GameObject("FadeOverlay");
        fadeObj.transform.SetParent(transform);
        var canvas = fadeObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 9998;
        fadeObj.AddComponent<CanvasScaler>();
        _fadeCanvasGroup = fadeObj.AddComponent<CanvasGroup>();
        _fadeCanvasGroup.alpha = 0f;
        _fadeCanvasGroup.blocksRaycasts = false;

        var img = fadeObj.AddComponent<UnityEngine.UI.Image>();
        img.color = Color.black;
        var rt = img.GetComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.sizeDelta = Vector2.zero;
    }

    private IEnumerator FadeOut(float duration = 0.5f)
    {
        EnsureFadeOverlay();
        _fadeCanvasGroup.blocksRaycasts = true;
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            _fadeCanvasGroup.alpha = Mathf.Clamp01(elapsed / duration);
            yield return null;
        }
        _fadeCanvasGroup.alpha = 1f;
    }

    private IEnumerator FadeIn(float duration = 0.5f)
    {
        EnsureFadeOverlay();
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            _fadeCanvasGroup.alpha = Mathf.Clamp01(1f - elapsed / duration);
            yield return null;
        }
        _fadeCanvasGroup.alpha = 0f;
        _fadeCanvasGroup.blocksRaycasts = false;
    }

    private void OnDestroy()
    {
        SceneManager.sceneLoaded -= HandleSceneLoaded;
    }
}
