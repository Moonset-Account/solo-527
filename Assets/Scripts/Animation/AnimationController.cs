using System;
using System.Collections;
using UnityEngine;
using SpaceCourier.Core;

namespace SpaceCourier.Animation
{
    public class AnimationController : MonoBehaviour
    {
        [Header("Global Timing")]
        public float globalAnimationSpeed = 1.0f;
        public float uiAnimationDuration = 0.25f;
        public float starMapAnimationSpeed = 1.2f;
        public float eventCardAnimationSpeed = 1.0f;
        public float shipMovementSpeed = 1.5f;

        [Header("Feedback Delays")]
        public float feedbackDisplayDuration = 1.8f;
        public float nodeHoverDelay = 0.1f;
        public float routePreviewDelay = 0.15f;

        [Header("Event Timing")]
        public float eventCardShowDelay = 0.3f;
        public float eventCardShowDuration = 0.5f;
        public float eventResultDisplayDelay = 0.4f;
        public float eventDismissDelay = 1.2f;

        public static event Action<float> OnGlobalSpeedChanged;

        public void SetGlobalSpeed(float speed)
        {
            globalAnimationSpeed = Mathf.Clamp(speed, 0.25f, 3f);
            OnGlobalSpeedChanged?.Invoke(globalAnimationSpeed);
        }

        public float AdjustDuration(float baseDuration)
        {
            return Mathf.Max(0.016f, baseDuration / globalAnimationSpeed);
        }

        public float AdjustSpeed(float baseSpeed)
        {
            return baseSpeed * globalAnimationSpeed;
        }

        public IEnumerator DelayThenAction(float delay, Action action)
        {
            float adjusted = AdjustDuration(delay);
            yield return new WaitForSecondsRealtime(adjusted);
            action?.Invoke();
        }

        public IEnumerator AnimateFloat(float from, float to, float duration, Action<float> onUpdate, Action onComplete = null)
        {
            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;
            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / adjusted;
                t = t * t * (3f - 2f * t);
                onUpdate?.Invoke(Mathf.Lerp(from, to, t));
                yield return null;
            }
            onUpdate?.Invoke(to);
            onComplete?.Invoke();
        }

        public IEnumerator AnimateVector2(Vector2 from, Vector2 to, float duration, Action<Vector2> onUpdate, Action onComplete = null)
        {
            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;
            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / adjusted;
                t = 1f - Mathf.Pow(1f - t, 3f);
                onUpdate?.Invoke(Vector2.Lerp(from, to, t));
                yield return null;
            }
            onUpdate?.Invoke(to);
            onComplete?.Invoke();
        }

        public IEnumerator AnimateColor(Color from, Color to, float duration, Action<Color> onUpdate)
        {
            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;
            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / adjusted;
                onUpdate?.Invoke(Color.Lerp(from, to, t));
                yield return null;
            }
            onUpdate?.Invoke(to);
        }

        public IEnumerator Shake(RectTransform target, float intensity = 10f, float duration = 0.4f)
        {
            if (target == null) yield break;

            var originalPos = target.anchoredPosition;
            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;

            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                float decay = 1f - (elapsed / adjusted);
                float x = UnityEngine.Random.Range(-intensity, intensity) * decay;
                float y = UnityEngine.Random.Range(-intensity, intensity) * decay;
                target.anchoredPosition = originalPos + new Vector2(x, y);
                yield return null;
            }

            target.anchoredPosition = originalPos;
        }

        public IEnumerator Pulse(Transform target, float scaleAmount = 0.1f, float duration = 0.6f, int loops = 1)
        {
            if (target == null) yield break;

            var originalScale = target.localScale;
            float adjusted = AdjustDuration(duration / 2f);

            for (int i = 0; i < loops; i++)
            {
                float elapsed = 0f;
                while (elapsed < adjusted)
                {
                    elapsed += Time.unscaledDeltaTime;
                    float t = elapsed / adjusted;
                    float s = 1f + Mathf.Sin(t * Mathf.PI) * scaleAmount;
                    target.localScale = originalScale * s;
                    yield return null;
                }
                target.localScale = originalScale;
            }
        }

        public IEnumerator PopIn(RectTransform target, float duration = 0.3f)
        {
            if (target == null) yield break;

            target.localScale = Vector3.zero;
            var canvasGroup = target.GetComponent<CanvasGroup>();
            if (canvasGroup != null) canvasGroup.alpha = 0f;

            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;
            var start = Vector3.zero;
            var end = Vector3.one;

            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / adjusted;
                t = 1f - Mathf.Pow(1f - t, 3f);
                target.localScale = Vector3.Lerp(start, end, t);
                if (canvasGroup != null) canvasGroup.alpha = t;
                yield return null;
            }

            target.localScale = Vector3.one;
            if (canvasGroup != null) canvasGroup.alpha = 1f;
        }

        public IEnumerator FadeIn(CanvasGroup group, float duration = 0.3f)
        {
            if (group == null) yield break;

            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;
            group.alpha = 0f;
            group.blocksRaycasts = true;
            group.interactable = true;

            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                group.alpha = elapsed / adjusted;
                yield return null;
            }
            group.alpha = 1f;
        }

        public IEnumerator FadeOut(CanvasGroup group, float duration = 0.3f, bool disableOnComplete = true)
        {
            if (group == null) yield break;

            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;
            float start = group.alpha;

            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                group.alpha = start * (1f - elapsed / adjusted);
                yield return null;
            }
            group.alpha = 0f;
            group.blocksRaycasts = !disableOnComplete;
            group.interactable = !disableOnComplete;
        }

        public IEnumerator SlideIn(RectTransform target, Vector2 fromOffset, float duration = 0.4f)
        {
            if (target == null) yield break;

            var originalPos = target.anchoredPosition;
            var startPos = originalPos + fromOffset;
            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;

            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / adjusted;
                t = 1f - Mathf.Pow(1f - t, 3f);
                target.anchoredPosition = Vector2.Lerp(startPos, originalPos, t);
                yield return null;
            }
            target.anchoredPosition = originalPos;
        }

        public IEnumerator CountUpNumber(int from, int to, float duration, Action<int> onUpdate, Action onComplete = null)
        {
            float adjusted = AdjustDuration(duration);
            float elapsed = 0f;
            while (elapsed < adjusted)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / adjusted;
                onUpdate?.Invoke(Mathf.RoundToInt(Mathf.Lerp(from, to, t)));
                yield return null;
            }
            onUpdate?.Invoke(to);
            onComplete?.Invoke();
        }
    }
}
