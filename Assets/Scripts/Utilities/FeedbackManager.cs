using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DecorMatch3.Core;
using EasingFunc = DecorMatch3.Utilities.EasingFunctions;

namespace DecorMatch3.Utilities
{
    public class FeedbackManager : Singleton<FeedbackManager>
    {
        [Header("Camera Shake")]
        [SerializeField] private Transform cameraTransform;
        [SerializeField] private float defaultShakeDuration = 0.2f;
        [SerializeField] private float defaultShakeIntensity = 0.1f;

        [Header("Screen Flash")]
        [SerializeField] private GameObject flashOverlayPrefab;
        [SerializeField] private float defaultFlashDuration = 0.1f;
        [SerializeField] private Color defaultFlashColor = new Color(1, 1, 1, 0.3f);

        [Header("Particles")]
        [SerializeField] private GameObject particleBurstPrefab;

        [Header("Vibration")]
        [SerializeField] private bool vibrationEnabled = true;

        private Vector3 _originalCameraPos;
        private Coroutine _shakeCoroutine;
        private Dictionary<int, Coroutine> _runningTweens = new Dictionary<int, Coroutine>();
        private int _tweenCounter = 0;

        protected override void Awake()
        {
            base.Awake();
            if (cameraTransform != null)
            {
                _originalCameraPos = cameraTransform.localPosition;
            }
            else if (Camera.main != null)
            {
                cameraTransform = Camera.main.transform;
                _originalCameraPos = cameraTransform.localPosition;
            }

            EventBus.Subscribe<Data.SettingsChangedEvent>(OnSettingsChanged);
        }

        private void Start()
        {
            var settings = Data.SaveManager.Instance?.CurrentSave.Settings;
            if (settings != null)
            {
                vibrationEnabled = settings.VibrationEnabled;
            }
        }

        private void OnSettingsChanged(Data.SettingsChangedEvent e)
        {
            vibrationEnabled = e.Settings.VibrationEnabled;
        }

        public void ShakeCamera()
        {
            ShakeCamera(defaultShakeDuration, defaultShakeIntensity);
        }

        public void ShakeCamera(float duration, float intensity)
        {
            if (cameraTransform == null) return;

            if (_shakeCoroutine != null)
            {
                StopCoroutine(_shakeCoroutine);
                cameraTransform.localPosition = _originalCameraPos;
            }

            _shakeCoroutine = StartCoroutine(ShakeCoroutine(duration, intensity));
        }

        private IEnumerator ShakeCoroutine(float duration, float intensity)
        {
            float timer = 0f;
            Vector3 lastOffset = Vector3.zero;

            while (timer < duration)
            {
                timer += Time.deltaTime;
                float decayFactor = 1 - (timer / duration);

                Vector3 shakeOffset = Random.insideUnitSphere * intensity * decayFactor;
                shakeOffset.z = 0;

                cameraTransform.localPosition = _originalCameraPos + shakeOffset - lastOffset;
                lastOffset = shakeOffset - lastOffset;

                yield return null;
            }

            cameraTransform.localPosition = _originalCameraPos;
            _shakeCoroutine = null;
        }

        public void ScreenFlash()
        {
            ScreenFlash(defaultFlashColor, defaultFlashDuration);
        }

        public void ScreenFlash(Color color, float duration)
        {
            if (flashOverlayPrefab == null) return;

            Canvas canvas = FindObjectOfType<Canvas>();
            if (canvas == null) return;

            GameObject flashObj = Instantiate(flashOverlayPrefab, canvas.transform);
            StartCoroutine(FlashCoroutine(flashObj, color, duration));
        }

        private IEnumerator FlashCoroutine(GameObject flashObj, Color color, float duration)
        {
            CanvasGroup cg = flashObj.GetComponent<CanvasGroup>();
            if (cg == null) cg = flashObj.AddComponent<CanvasGroup>();

            Image flashImage = flashObj.GetComponent<Image>();
            if (flashImage == null)
            {
                flashImage = flashObj.AddComponent<Image>();
                RectTransform rt = flashObj.GetComponent<RectTransform>();
                if (rt != null)
                {
                    rt.anchorMin = Vector2.zero;
                    rt.anchorMax = Vector2.one;
                    rt.offsetMin = Vector2.zero;
                    rt.offsetMax = Vector2.zero;
                }
            }

            flashImage.color = color;
            cg.alpha = color.a;

            float timer = 0f;
            while (timer < duration)
            {
                timer += Time.deltaTime;
                cg.alpha = color.a * (1 - timer / duration);
                yield return null;
            }

            Destroy(flashObj);
        }

        public void SpawnParticleBurst(Vector3 position, int count = 10)
        {
            if (particleBurstPrefab == null) return;

            GameObject particles = Instantiate(particleBurstPrefab, position, Quaternion.identity);
            ParticleSystem ps = particles.GetComponent<ParticleSystem>();
            if (ps != null)
            {
                var main = ps.main;
                main.maxParticles = count;
                ps.Emit(count);
            }

            StartCoroutine(DestroyAfterDelay(particles, 2f));
        }

        public void SpawnFloatingText(string text, Vector3 position, Color? color = null, float duration = 1f)
        {
            StartCoroutine(FloatingTextCoroutine(text, position, color ?? Color.white, duration));
        }

        private IEnumerator FloatingTextCoroutine(string text, Vector3 startPos, Color color, float duration)
        {
            GameObject textObj = new GameObject("FloatingText");
            textObj.transform.position = startPos;

            TextMesh tm = textObj.AddComponent<TextMesh>();
            tm.text = text;
            tm.fontSize = 24;
            tm.color = color;
            tm.anchor = TextAnchor.MiddleCenter;
            tm.alignment = TextAlignment.Center;

            float timer = 0f;
            Vector3 currentPos = startPos;
            while (timer < duration)
            {
                timer += Time.deltaTime;
                float t = timer / duration;
                currentPos.y = startPos.y + Mathf.Sin(t * Mathf.PI) * 1f;
                textObj.transform.position = currentPos;
                tm.color = new Color(color.r, color.g, color.b, 1 - t);
                yield return null;
            }

            Destroy(textObj);
        }

        public void Vibrate(long milliseconds = 50)
        {
            if (!vibrationEnabled) return;

#if UNITY_ANDROID || UNITY_IOS
            Handheld.Vibrate();
#endif
        }

        public int TweenScale(Transform target, Vector3 from, Vector3 to, float duration,
            EasingFunc.EasingFunction easing = null,
            System.Action onComplete = null)
        {
            easing = easing ?? EasingFunc.EaseOutBack;
            int id = ++_tweenCounter;
            Coroutine coroutine = StartCoroutine(TweenScaleCoroutine(target, from, to, duration, easing, () =>
            {
                _runningTweens.Remove(id);
                onComplete?.Invoke();
            }));
            _runningTweens[id] = coroutine;
            return id;
        }

        private IEnumerator TweenScaleCoroutine(Transform target, Vector3 from, Vector3 to, float duration,
            EasingFunc.EasingFunction easing, System.Action onComplete)
        {
            float timer = 0f;
            while (timer < duration)
            {
                timer += Time.deltaTime;
                float t = Mathf.Clamp01(timer / duration);
                t = easing(t);
                target.localScale = Vector3.LerpUnclamped(from, to, t);
                yield return null;
            }
            target.localScale = to;
            onComplete?.Invoke();
        }

        public int TweenPosition(Transform target, Vector3 from, Vector3 to, float duration,
            EasingFunc.EasingFunction easing = null,
            System.Action onComplete = null)
        {
            easing = easing ?? EasingFunc.EaseOutQuad;
            int id = ++_tweenCounter;
            Coroutine coroutine = StartCoroutine(TweenPositionCoroutine(target, from, to, duration, easing, () =>
            {
                _runningTweens.Remove(id);
                onComplete?.Invoke();
            }));
            _runningTweens[id] = coroutine;
            return id;
        }

        private IEnumerator TweenPositionCoroutine(Transform target, Vector3 from, Vector3 to, float duration,
            EasingFunc.EasingFunction easing, System.Action onComplete)
        {
            float timer = 0f;
            while (timer < duration)
            {
                timer += Time.deltaTime;
                float t = Mathf.Clamp01(timer / duration);
                t = easing(t);
                target.localPosition = Vector3.LerpUnclamped(from, to, t);
                yield return null;
            }
            target.localPosition = to;
            onComplete?.Invoke();
        }

        public int TweenColor(SpriteRenderer target, Color from, Color to, float duration,
            EasingFunc.EasingFunction easing = null,
            System.Action onComplete = null)
        {
            easing = easing ?? EasingFunc.Linear;
            int id = ++_tweenCounter;
            Coroutine coroutine = StartCoroutine(TweenColorCoroutine(target, from, to, duration, easing, () =>
            {
                _runningTweens.Remove(id);
                onComplete?.Invoke();
            }));
            _runningTweens[id] = coroutine;
            return id;
        }

        private IEnumerator TweenColorCoroutine(SpriteRenderer target, Color from, Color to, float duration,
            EasingFunc.EasingFunction easing, System.Action onComplete)
        {
            float timer = 0f;
            while (timer < duration)
            {
                timer += Time.deltaTime;
                float t = Mathf.Clamp01(timer / duration);
                t = easing(t);
                target.color = Color.LerpUnclamped(from, to, t);
                yield return null;
            }
            target.color = to;
            onComplete?.Invoke();
        }

        public void CancelTween(int tweenId)
        {
            if (_runningTweens.TryGetValue(tweenId, out Coroutine coroutine))
            {
                StopCoroutine(coroutine);
                _runningTweens.Remove(tweenId);
            }
        }

        public void CancelAllTweens()
        {
            foreach (var coroutine in _runningTweens.Values)
            {
                StopCoroutine(coroutine);
            }
            _runningTweens.Clear();
        }

        private IEnumerator DestroyAfterDelay(GameObject obj, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (obj != null)
            {
                Destroy(obj);
            }
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<Data.SettingsChangedEvent>(OnSettingsChanged);
        }
    }

    public static class EasingFunctions
    {
        public delegate float EasingFunction(float t);

        public static float Linear(float t) => t;

        public static float EaseInQuad(float t) => t * t;
        public static float EaseOutQuad(float t) => 1 - (1 - t) * (1 - t);
        public static float EaseInOutQuad(float t) => t < 0.5 ? 2 * t * t : 1 - Mathf.Pow(-2 * t + 2, 2) / 2;

        public static float EaseInCubic(float t) => t * t * t;
        public static float EaseOutCubic(float t) => 1 - Mathf.Pow(1 - t, 3);
        public static float EaseInOutCubic(float t) => t < 0.5 ? 4 * t * t * t : 1 - Mathf.Pow(-2 * t + 2, 3) / 2;

        public static float EaseOutBack(float t)
        {
            float c1 = 1.70158f;
            float c3 = c1 + 1;
            return 1 + c3 * Mathf.Pow(t - 1, 3) + c1 * Mathf.Pow(t - 1, 2);
        }

        public static float EaseOutElastic(float t)
        {
            float c4 = (2 * Mathf.PI) / 3;
            if (t == 0) return 0;
            if (t == 1) return 1;
            return Mathf.Pow(2, -10 * t) * Mathf.Sin((t * 10 - 0.75f) * c4) + 1;
        }

        public static float EaseOutBounce(float t)
        {
            float n1 = 7.5625f;
            float d1 = 2.75f;
            if (t < 1 / d1) return n1 * t * t;
            if (t < 2 / d1) return n1 * (t -= 1.5f / d1) * t + 0.75f;
            if (t < 2.5 / d1) return n1 * (t -= 2.25f / d1) * t + 0.9375f;
            return n1 * (t -= 2.625f / d1) * t + 0.984375f;
        }
    }
}
