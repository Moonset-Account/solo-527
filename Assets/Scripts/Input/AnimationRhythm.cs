using UnityEngine;
using System.Collections;

namespace InkMountainBridge
{
    public enum EaseType
    {
        EaseIn,
        EaseOut,
        EaseInOut,
        Linear
    }

    public class AnimationRhythm : MonoBehaviour
    {
        [SerializeField] private float defaultDuration = 0.3f;
        [SerializeField] private EaseType easeType = EaseType.EaseInOut;
        [SerializeField] private float elementPlaceDuration = 0.2f;
        [SerializeField] private float elementBreakDuration = 0.5f;
        [SerializeField] private float caravanStepDuration = 0.15f;
        [SerializeField] private float weatherTransitionDuration = 1.0f;
        [SerializeField] private float scoreCountDuration = 1.5f;
        [SerializeField] private float starFillDuration = 0.3f;
        [SerializeField] private float starFillDelay = 0.15f;

        public IEnumerator AnimateElementPlace(Transform element, Vector2 targetPosition)
        {
            Vector2 startPosition = element.position;
            float elapsed = 0f;

            while (elapsed < elementPlaceDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / elementPlaceDuration);
                float eased = Ease(t, easeType);
                element.position = Vector2.Lerp(startPosition, targetPosition, eased);
                yield return null;
            }

            element.position = targetPosition;
        }

        public IEnumerator AnimateElementBreak(Transform element)
        {
            Vector3 originalScale = element.localScale;
            float elapsed = 0f;

            while (elapsed < elementBreakDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / elementBreakDuration);
                float eased = Ease(t, EaseType.EaseIn);
                element.localScale = Vector3.Lerp(originalScale, Vector3.zero, eased);
                element.Rotate(0f, 0f, Random.Range(-5f, 5f) * Time.unscaledDeltaTime * 60f);
                yield return null;
            }

            element.localScale = Vector3.zero;
        }

        public IEnumerator AnimateCaravanStep(Transform caravan, Vector2 from, Vector2 to)
        {
            float elapsed = 0f;

            while (elapsed < caravanStepDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / caravanStepDuration);
                float eased = Ease(t, easeType);
                caravan.position = Vector2.Lerp(from, to, eased);
                yield return null;
            }

            caravan.position = to;
        }

        public IEnumerator AnimateWeatherTransition(float fromIntensity, float toIntensity)
        {
            float elapsed = 0f;

            while (elapsed < weatherTransitionDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / weatherTransitionDuration);
                float eased = Ease(t, EaseType.EaseInOut);
                float current = Mathf.Lerp(fromIntensity, toIntensity, eased);
                GameEvents.OnWeatherChanged?.Invoke(WeatherType.Rain);
                yield return null;
            }
        }

        public float Ease(float t, EaseType type)
        {
            switch (type)
            {
                case EaseType.EaseIn:
                    return t * t;
                case EaseType.EaseOut:
                    return 1f - (1f - t) * (1f - t);
                case EaseType.EaseInOut:
                    return t < 0.5f ? 2f * t * t : 1f - Mathf.Pow(-2f * t + 2f, 2f) / 2f;
                case EaseType.Linear:
                default:
                    return t;
            }
        }
    }
}
