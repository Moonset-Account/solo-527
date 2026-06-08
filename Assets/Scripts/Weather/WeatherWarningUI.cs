using System.Collections;
using UnityEngine;
using TMPro;

public class WeatherWarningUI : MonoBehaviour
{
    [SerializeField] private CanvasGroup canvasGroup;
    [SerializeField] private TMP_Text warningText;
    [SerializeField] private float pulseSpeed = 2f;
    [SerializeField] private float fadeInDuration = 0.5f;
    [SerializeField] private float fadeOutDuration = 0.3f;

    private Coroutine pulseCoroutine;
    private Coroutine fadeCoroutine;

    private static readonly string[] WeatherLabels = new string[]
    {
        "晴天", "多云", "大雾", "降雨", "风暴", "降雪"
    };

    private static readonly string[] WeatherIcons = new string[]
    {
        "☀", "☁", "🌫", "🌧", "⛈", "❄"
    };

    private void OnEnable()
    {
        GameEvents.WeatherWarning += OnWeatherWarning;
        GameEvents.WeatherChanged += OnWeatherChanged;
    }

    private void OnDisable()
    {
        GameEvents.WeatherWarning -= OnWeatherWarning;
        GameEvents.WeatherChanged -= OnWeatherChanged;
    }

    private void OnWeatherWarning(WeatherType incoming, float secondsUntil)
    {
        int idx = (int)incoming;
        string icon = idx < WeatherIcons.Length ? WeatherIcons[idx] : "⚠";
        string label = idx < WeatherLabels.Length ? WeatherLabels[idx] : incoming.ToString();

        warningText.text = $"{icon} {label}即将到来 - 约{Mathf.CeilToInt(secondsUntil)}秒后";

        if (pulseCoroutine != null) StopCoroutine(pulseCoroutine);
        pulseCoroutine = StartCoroutine(PulseLoop());

        if (fadeCoroutine != null) StopCoroutine(fadeCoroutine);
        fadeCoroutine = StartCoroutine(FadeIn());
    }

    private void OnWeatherChanged(WeatherType type, float windSpeed, float windAngle, float visibility)
    {
        Hide();
    }

    private void Hide()
    {
        if (pulseCoroutine != null)
        {
            StopCoroutine(pulseCoroutine);
            pulseCoroutine = null;
        }

        if (fadeCoroutine != null) StopCoroutine(fadeCoroutine);
        fadeCoroutine = StartCoroutine(FadeOut());
    }

    private IEnumerator PulseLoop()
    {
        while (true)
        {
            float t = (Mathf.Sin(Time.unscaledTime * pulseSpeed) + 1f) * 0.5f;
            canvasGroup.alpha = Mathf.Lerp(0.5f, 1f, t);
            yield return null;
        }
    }

    private IEnumerator FadeIn()
    {
        canvasGroup.blocksRaycasts = true;
        float elapsed = 0f;
        while (elapsed < fadeInDuration)
        {
            elapsed += Time.unscaledDeltaTime;
            float t = Mathf.Clamp01(elapsed / fadeInDuration);
            canvasGroup.alpha = t;
            yield return null;
        }
        canvasGroup.alpha = 1f;
    }

    private IEnumerator FadeOut()
    {
        float startAlpha = canvasGroup.alpha;
        float elapsed = 0f;
        while (elapsed < fadeOutDuration)
        {
            elapsed += Time.unscaledDeltaTime;
            float t = Mathf.Clamp01(elapsed / fadeOutDuration);
            canvasGroup.alpha = Mathf.Lerp(startAlpha, 0f, t);
            yield return null;
        }
        canvasGroup.alpha = 0f;
        canvasGroup.blocksRaycasts = false;
        fadeCoroutine = null;
    }
}
