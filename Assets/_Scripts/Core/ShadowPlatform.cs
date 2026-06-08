using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer.Core
{
    public class ShadowPlatform : MonoBehaviour
    {
        public enum PlatformType
        {
            AlwaysActive,
            LeftOnly,
            RightOnly,
            TopOnly,
            BottomOnly,
            HorizontalOnly,
            VerticalOnly
        }

        public enum VisualType
        {
            Solid,
            Ghost
        }

        [Header("Platform Settings")]
        public PlatformType platformType = PlatformType.AlwaysActive;
        public VisualType visualType = VisualType.Solid;

        [Header("Visual Settings")]
        public SpriteRenderer platformRenderer;
        public SpriteRenderer glowRenderer;
        public Color activeColor = new Color(0.6f, 0.8f, 1f, 1f);
        public Color inactiveColor = new Color(0.3f, 0.3f, 0.35f, 0.3f);
        public float transitionDuration = 0.3f;

        [Header("Collision")]
        public Collider2D platformCollider;
        public bool enableCollision = true;

        [Header("Player Effect")]
        public bool playerStandingOnIt;
        public float shakeOnAppear = 0.05f;
        public float disappearWarningTime = 0.15f;

        private bool _isActive;
        private Coroutine _transitionCoroutine;
        private Vector3 _originalScale;
        private bool _isDisappearingWarning;

        public bool IsActive => _isActive;

        private void Awake()
        {
            _originalScale = transform.localScale;
            if (platformRenderer == null) platformRenderer = GetComponent<SpriteRenderer>();
            if (platformCollider == null) platformCollider = GetComponent<Collider2D>();
        }

        private void Start()
        {
            LightManager.Instance?.RegisterPlatform(this);

            if (LightManager.Instance != null)
            {
                ApplyLightDirection(LightManager.Instance.currentDirection, true);
            }
        }

        private void OnDestroy()
        {
            LightManager.Instance?.UnregisterPlatform(this);
        }

        public void OnLightSwitchStart(LightManager.LightDirection from, LightManager.LightDirection to)
        {
            bool willBeActive = LightManager.Instance.IsPlatformActive(platformType, to);

            if (_isActive && !willBeActive)
            {
                StartCoroutine(DisappearWarningRoutine());
            }
        }

        public void OnLightSwitchProgress(float progress, LightManager.LightDirection from, LightManager.LightDirection to)
        {
            bool wasActive = LightManager.Instance.IsPlatformActive(platformType, from);
            bool willBeActive = LightManager.Instance.IsPlatformActive(platformType, to);

            if (wasActive != willBeActive)
            {
                float visualProgress = willBeActive ? progress : 1f - progress;
                UpdateVisuals(visualProgress, willBeActive);
            }
        }

        public void OnLightSwitchComplete(LightManager.LightDirection direction)
        {
            bool shouldBeActive = LightManager.Instance.IsPlatformActive(platformType, direction);
            SetState(shouldBeActive);
        }

        public void ApplyLightDirection(LightManager.LightDirection direction, bool immediate = false)
        {
            bool shouldBeActive = LightManager.Instance.IsPlatformActive(platformType, direction);

            if (immediate)
            {
                SetState(shouldBeActive);
            }
            else
            {
                if (_transitionCoroutine != null) StopCoroutine(_transitionCoroutine);
                _transitionCoroutine = StartCoroutine(TransitionState(shouldBeActive));
            }
        }

        private void SetState(bool active)
        {
            _isActive = active;

            if (platformCollider != null && enableCollision)
                platformCollider.enabled = active || platformType == PlatformType.AlwaysActive;

            if (platformRenderer != null)
            {
                platformRenderer.color = active ? activeColor : inactiveColor;
                platformRenderer.sortingOrder = active ? 5 : 1;
            }

            if (glowRenderer != null)
            {
                glowRenderer.enabled = active;
                glowRenderer.color = new Color(activeColor.r, activeColor.g, activeColor.b, active ? 0.4f : 0f);
            }
        }

        private IEnumerator TransitionState(bool targetActive)
        {
            float elapsed = 0f;
            bool wasActive = _isActive;

            if (!wasActive && targetActive && shakeOnAppear > 0f)
            {
                StartCoroutine(ShakeRoutine(shakeOnAppear, transitionDuration * 0.5f));
            }

            if (platformCollider != null && enableCollision)
            {
                platformCollider.enabled = targetActive || platformType == PlatformType.AlwaysActive;
            }

            while (elapsed < transitionDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / transitionDuration);
                float visualT = targetActive ? t : 1f - t;
                UpdateVisuals(visualT, targetActive);
                yield return null;
            }

            SetState(targetActive);
        }

        private void UpdateVisuals(float t, bool targetActive)
        {
            if (platformRenderer != null)
            {
                Color c = Color.Lerp(inactiveColor, activeColor, t);
                platformRenderer.color = c;

                Vector3 target = targetActive ? _originalScale : _originalScale * 0.85f;
                transform.localScale = Vector3.Lerp(transform.localScale, target, Time.deltaTime * 10f);
            }

            if (glowRenderer != null)
            {
                glowRenderer.enabled = t > 0.1f;
                Color gc = new Color(activeColor.r, activeColor.g, activeColor.b, 0.4f * t);
                glowRenderer.color = gc;
            }
        }

        private IEnumerator DisappearWarningRoutine()
        {
            _isDisappearingWarning = true;
            float elapsed = 0f;
            float blinkInterval = 0.06f;
            float nextBlink = 0f;
            bool blinkOn = true;

            while (elapsed < disappearWarningTime)
            {
                elapsed += Time.deltaTime;
                if (elapsed >= nextBlink)
                {
                    blinkOn = !blinkOn;
                    if (platformRenderer != null)
                    {
                        Color c = platformRenderer.color;
                        c.a = blinkOn ? 1f : 0.5f;
                        platformRenderer.color = c;
                    }
                    nextBlink += blinkInterval;
                }
                yield return null;
            }
            _isDisappearingWarning = false;
        }

        private IEnumerator ShakeRoutine(float intensity, float duration)
        {
            Vector3 originalPos = transform.localPosition;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = 1f - (elapsed / duration);
                transform.localPosition = originalPos + new Vector3(
                    Random.Range(-intensity, intensity) * t,
                    Random.Range(-intensity, intensity) * t,
                    0f
                );
                yield return null;
            }
            transform.localPosition = originalPos;
        }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            if (collision.collider.CompareTag("Player"))
            {
                playerStandingOnIt = true;
            }
        }

        private void OnCollisionExit2D(Collision2D collision)
        {
            if (collision.collider.CompareTag("Player"))
            {
                playerStandingOnIt = false;
            }
        }
    }
}
