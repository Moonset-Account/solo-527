using System.Collections;
using UnityEngine;

namespace YouthTrainingManagement.Animation
{
    public class ScreenShake : MonoBehaviour
    {
        public static ScreenShake Instance
        {
            get
            {
                if (_inst == null)
                {
                    var go = new GameObject("ScreenShake", typeof(ScreenShake));
                    DontDestroyOnLoad(go);
                    _inst = go.GetComponent<ScreenShake>();
                }
                return _inst;
            }
        }
        private static ScreenShake _inst;

        public float GlobalIntensity = 1f;
        public RectTransform Target;
        private Vector3 _originalPos;
        private Coroutine _running;

        public static void Shake(float intensity = 1f, float duration = 0.3f, float frequency = 25f)
        {
            Instance.DoShake(intensity, duration, frequency);
        }

        public void DoShake(float intensity, float duration, float frequency)
        {
            if (Target == null && Camera.main != null)
            {
                var canv = FindObjectOfType<Canvas>();
                if (canv != null) Target = canv.GetComponent<RectTransform>();
            }
            if (Target == null) return;
            if (_running != null) StopCoroutine(_running);
            _originalPos = Target.anchoredPosition3D;
            _running = StartCoroutine(ShakeRoutine(intensity * GlobalIntensity, duration, frequency));
        }

        private IEnumerator ShakeRoutine(float intensity, float duration, float frequency)
        {
            float t = 0f;
            float interval = 1f / Mathf.Max(1f, frequency);
            float nextSample = 0f;
            float x = 0, y = 0, px = 0, py = 0;

            while (t < duration)
            {
                t += Time.unscaledDeltaTime;
                if (t >= nextSample)
                {
                    nextSample += interval;
                    float decay = 1f - (t / duration);
                    decay = decay * decay;
                    px = x; py = y;
                    x = (Random.value * 2f - 1f) * intensity * 12f * decay;
                    y = (Random.value * 2f - 1f) * intensity * 12f * decay;
                }
                float phase = (t % interval) / interval;
                Target.anchoredPosition3D = _originalPos + new Vector3(
                    Mathf.Lerp(px, x, phase),
                    Mathf.Lerp(py, y, phase),
                    0f);
                yield return null;
            }
            Target.anchoredPosition3D = _originalPos;
        }
    }
}
