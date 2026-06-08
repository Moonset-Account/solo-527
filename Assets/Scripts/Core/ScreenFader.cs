using UnityEngine;
using UnityEngine.UI;
using System.Collections;

namespace ShadowPlatformer.Core
{
    public class ScreenFader : MonoBehaviour
    {
        public Image fadeImage;
        public float fadeDuration = 0.5f;

        private void Start()
        {
            if (fadeImage != null)
            {
                fadeImage.color = new Color(0, 0, 0, 1);
                fadeImage.raycastTarget = true;
                StartCoroutine(FadeIn());
            }
        }

        public IEnumerator FadeIn()
        {
            yield return Fade(1f, 0f);
            if (fadeImage != null) fadeImage.raycastTarget = false;
        }

        public IEnumerator FadeOut()
        {
            if (fadeImage != null) fadeImage.raycastTarget = true;
            yield return Fade(0f, 1f);
        }

        private IEnumerator Fade(float from, float to)
        {
            if (fadeImage == null) yield break;
            float elapsed = 0f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / fadeDuration);
                float alpha = Mathf.Lerp(from, to, t);
                fadeImage.color = new Color(0, 0, 0, alpha);
                yield return null;
            }
            fadeImage.color = new Color(0, 0, 0, to);
        }
    }
}
