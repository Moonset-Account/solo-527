using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace SpaceCourier.UI
{
    public class NotificationToast : MonoBehaviour
    {
        [Header("References")]
        public CanvasGroup canvasGroup;
        public TextMeshProUGUI messageText;
        public Image backgroundImage;
        public RectTransform toastRect;

        [Header("Settings")]
        public float defaultDuration = 2f;
        public float fadeInDuration = 0.2f;
        public float fadeOutDuration = 0.4f;
        public Color successColor = new Color(0.15f, 0.5f, 0.2f, 0.9f);
        public Color errorColor = new Color(0.5f, 0.15f, 0.15f, 0.9f);

        private Coroutine currentCoroutine;

        public void Show(string message, bool isSuccess = true, float duration = -1f)
        {
            if (messageText == null || canvasGroup == null) return;

            if (currentCoroutine != null) StopCoroutine(currentCoroutine);

            messageText.text = message;
            if (backgroundImage != null)
            {
                backgroundImage.color = isSuccess ? successColor : errorColor;
            }

            float actualDuration = duration > 0 ? duration : defaultDuration;
            currentCoroutine = StartCoroutine(ShowCoroutine(actualDuration));
        }

        private System.Collections.IEnumerator ShowCoroutine(float duration)
        {
            gameObject.SetActive(true);

            Vector3 startPos = toastRect != null
                ? toastRect.anchoredPosition + new Vector2(0, -50f)
                : Vector3.zero;
            Vector3 targetPos = toastRect != null ? toastRect.anchoredPosition : Vector3.zero;

            canvasGroup.alpha = 0f;

            float elapsed = 0f;
            while (elapsed < fadeInDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / fadeInDuration;
                canvasGroup.alpha = t;
                if (toastRect != null)
                {
                    toastRect.anchoredPosition = Vector2.Lerp(startPos, targetPos, t);
                }
                yield return null;
            }

            canvasGroup.alpha = 1f;
            if (toastRect != null) toastRect.anchoredPosition = targetPos;

            yield return new WaitForSecondsRealtime(duration);

            elapsed = 0f;
            while (elapsed < fadeOutDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / fadeOutDuration;
                canvasGroup.alpha = 1f - t;
                yield return null;
            }

            canvasGroup.alpha = 0f;
            gameObject.SetActive(false);
        }
    }
}
