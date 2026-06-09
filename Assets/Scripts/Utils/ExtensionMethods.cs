using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3.Utils
{
    public static class ExtensionMethods
    {
        public static void SetActiveWithCallback(this GameObject obj, bool active, System.Action callback = null)
        {
            obj.SetActive(active);
            callback?.Invoke();
        }

        public static IEnumerator DoFade(this CanvasGroup canvasGroup, float targetAlpha, float duration)
        {
            float startAlpha = canvasGroup.alpha;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                canvasGroup.alpha = Mathf.Lerp(startAlpha, targetAlpha, t);
                yield return null;
            }

            canvasGroup.alpha = targetAlpha;
        }

        public static IEnumerator DoScale(this Transform transform, Vector3 targetScale, float duration)
        {
            Vector3 startScale = transform.localScale;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                transform.localScale = Vector3.Lerp(startScale, targetScale, t);
                yield return null;
            }

            transform.localScale = targetScale;
        }

        public static IEnumerator DoMove(this Transform transform, Vector3 targetPosition, float duration, bool localSpace = true)
        {
            Vector3 startPos = localSpace ? transform.localPosition : transform.position;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                Vector3 newPos = Vector3.Lerp(startPos, targetPosition, t);
                
                if (localSpace)
                    transform.localPosition = newPos;
                else
                    transform.position = newPos;
                
                yield return null;
            }

            if (localSpace)
                transform.localPosition = targetPosition;
            else
                transform.position = targetPosition;
        }

        public static Color WithAlpha(this Color color, float alpha)
        {
            color.a = alpha;
            return color;
        }

        public static string ToRoman(this int number)
        {
            if ((number < 0) || (number > 3999)) throw new System.ArgumentOutOfRangeException("insert value betwheen 1 and 3999");
            if (number < 1) return string.Empty;
            if (number >= 1000) return "M" + ToRoman(number - 1000);
            if (number >= 900) return "CM" + ToRoman(number - 900);
            if (number >= 500) return "D" + ToRoman(number - 500);
            if (number >= 400) return "CD" + ToRoman(number - 400);
            if (number >= 100) return "C" + ToRoman(number - 100);
            if (number >= 90) return "XC" + ToRoman(number - 90);
            if (number >= 50) return "L" + ToRoman(number - 50);
            if (number >= 40) return "XL" + ToRoman(number - 40);
            if (number >= 10) return "X" + ToRoman(number - 10);
            if (number >= 9) return "IX" + ToRoman(number - 9);
            if (number >= 5) return "V" + ToRoman(number - 5);
            if (number >= 4) return "IV" + ToRoman(number - 4);
            if (number >= 1) return "I" + ToRoman(number - 1);
            throw new System.ArgumentOutOfRangeException("something bad happened");
        }
    }
}
