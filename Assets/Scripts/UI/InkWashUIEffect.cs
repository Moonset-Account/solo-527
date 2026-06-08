using System.Collections;
using UnityEngine;

namespace InkMountainBridge
{
    public class InkWashUIEffect : MonoBehaviour
    {
        public float inkSpreadDuration = 0.6f;
        public Color inkColor = new Color(0.1f, 0.1f, 0.1f, 1f);
        public Color paperColor = new Color(0.96f, 0.94f, 0.88f, 1f);

        public IEnumerator InkReveal(Transform panel)
        {
            if (panel == null) yield break;

            CanvasGroup cg = panel.GetComponent<CanvasGroup>();
            if (cg == null) cg = panel.gameObject.AddComponent<CanvasGroup>();

            cg.alpha = 0f;
            panel.gameObject.SetActive(true);

            float elapsed = 0f;
            while (elapsed < inkSpreadDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / inkSpreadDuration);
                t = t * t * (3f - 2f * t);
                cg.alpha = t;
                panel.localScale = Vector3.one * Mathf.Lerp(0.7f, 1f, t);
                yield return null;
            }

            cg.alpha = 1f;
            panel.localScale = Vector3.one;
        }

        public IEnumerator InkFade(Transform panel)
        {
            if (panel == null) yield break;

            CanvasGroup cg = panel.GetComponent<CanvasGroup>();
            if (cg == null) cg = panel.gameObject.AddComponent<CanvasGroup>();

            float elapsed = 0f;
            while (elapsed < inkSpreadDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / inkSpreadDuration);
                t = t * t * (3f - 2f * t);
                cg.alpha = 1f - t;
                panel.localScale = Vector3.one * Mathf.Lerp(1f, 0.7f, t);
                yield return null;
            }

            cg.alpha = 0f;
            panel.localScale = Vector3.one * 0.7f;
            panel.gameObject.SetActive(false);
        }
    }
}
