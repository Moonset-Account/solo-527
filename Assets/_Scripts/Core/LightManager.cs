using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace LightShadowPlatformer.Core
{
    public class LightManager : MonoBehaviour
    {
        public enum LightDirection { Left, Right, Top, Bottom }

        public static LightManager Instance { get; private set; }

        [Header("Light Settings")]
        public LightDirection currentDirection = LightDirection.Left;
        public float switchDuration = 0.3f;
        public float cooldownTime = 0.1f;
        public AnimationCurve switchEaseCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

        [Header("Visual Feedback")]
        public Color lightTintLeft = new Color(1f, 0.95f, 0.8f);
        public Color lightTintRight = new Color(0.8f, 0.95f, 1f);
        public Color lightTintTop = new Color(1f, 1f, 1f);
        public Color lightTintBottom = new Color(0.9f, 0.85f, 1f);
        public float backgroundShiftAmount = 0.1f;

        [Header("References")]
        public SpriteRenderer backgroundRenderer;
        public Camera mainCamera;

        private bool _isSwitching;
        private bool _isOnCooldown;
        private Coroutine _switchCoroutine;
        private LightDirection _previousDirection;
        private readonly List<ShadowPlatform> _shadowPlatforms = new List<ShadowPlatform>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            ApplyDirectionImmediate(currentDirection);
            EventManager.Instance.OnLevelLoaded += OnLevelLoaded;
        }

        private void OnDestroy()
        {
            EventManager.Instance.OnLevelLoaded -= OnLevelLoaded;
        }

        private void OnLevelLoaded(int levelIndex)
        {
            RegisterAllPlatforms();
            ApplyDirectionImmediate(currentDirection);
        }

        public void RegisterPlatform(ShadowPlatform platform)
        {
            if (!_shadowPlatforms.Contains(platform))
                _shadowPlatforms.Add(platform);
        }

        public void UnregisterPlatform(ShadowPlatform platform)
        {
            _shadowPlatforms.Remove(platform);
        }

        public void RegisterAllPlatforms()
        {
            _shadowPlatforms.Clear();
            var platforms = FindObjectsOfType<ShadowPlatform>();
            foreach (var platform in platforms)
            {
                _shadowPlatforms.Add(platform);
            }
        }

        public void SwitchLightDirection(LightDirection newDirection)
        {
            if (_isOnCooldown || _isSwitching || currentDirection == newDirection) return;

            _previousDirection = currentDirection;
            _isSwitching = true;

            if (_switchCoroutine != null)
                StopCoroutine(_switchCoroutine);

            _switchCoroutine = StartCoroutine(SwitchAnimation(newDirection));

            AudioManager.Instance.PlaySfx(AudioManager.SfxType.LightSwitch);
            EventManager.Instance.TriggerLightDirectionChanged(newDirection);
        }

        public void CycleLightDirection()
        {
            int next = ((int)currentDirection + 1) % 4;
            SwitchLightDirection((LightDirection)next);
        }

        private IEnumerator SwitchAnimation(LightDirection targetDirection)
        {
            float elapsed = 0f;
            Color startColor = GetDirectionColor(_previousDirection);
            Color endColor = GetDirectionColor(targetDirection);

            foreach (var platform in _shadowPlatforms)
            {
                platform?.OnLightSwitchStart(_previousDirection, targetDirection);
            }

            while (elapsed < switchDuration)
            {
                elapsed += Time.deltaTime;
                float t = switchEaseCurve.Evaluate(Mathf.Clamp01(elapsed / switchDuration));

                if (backgroundRenderer != null)
                    backgroundRenderer.color = Color.Lerp(startColor, endColor, t);

                if (mainCamera != null)
                    mainCamera.backgroundColor = Color.Lerp(startColor * 0.3f, endColor * 0.3f, t);

                foreach (var platform in _shadowPlatforms)
                {
                    platform?.OnLightSwitchProgress(t, _previousDirection, targetDirection);
                }

                yield return null;
            }

            currentDirection = targetDirection;
            ApplyDirectionImmediate(targetDirection);

            foreach (var platform in _shadowPlatforms)
            {
                platform?.OnLightSwitchComplete(targetDirection);
            }

            _isSwitching = false;
            StartCoroutine(CooldownRoutine());
        }

        private void ApplyDirectionImmediate(LightDirection direction)
        {
            currentDirection = direction;
            Color tint = GetDirectionColor(direction);

            if (backgroundRenderer != null)
                backgroundRenderer.color = tint;

            if (mainCamera != null)
                mainCamera.backgroundColor = tint * 0.3f;

            foreach (var platform in _shadowPlatforms)
            {
                platform?.ApplyLightDirection(direction, true);
            }
        }

        public Color GetDirectionColor(LightDirection direction)
        {
            return direction switch
            {
                LightDirection.Left => lightTintLeft,
                LightDirection.Right => lightTintRight,
                LightDirection.Top => lightTintTop,
                LightDirection.Bottom => lightTintBottom,
                _ => Color.white
            };
        }

        public Vector2 GetDirectionVector(LightDirection direction)
        {
            return direction switch
            {
                LightDirection.Left => Vector2.left,
                LightDirection.Right => Vector2.right,
                LightDirection.Top => Vector2.up,
                LightDirection.Bottom => Vector2.down,
                _ => Vector2.left
            };
        }

        public bool IsPlatformActive(ShadowPlatform.PlatformType type, LightDirection current)
        {
            return type switch
            {
                ShadowPlatform.PlatformType.AlwaysActive => true,
                ShadowPlatform.PlatformType.LeftOnly => current == LightDirection.Left,
                ShadowPlatform.PlatformType.RightOnly => current == LightDirection.Right,
                ShadowPlatform.PlatformType.TopOnly => current == LightDirection.Top,
                ShadowPlatform.PlatformType.BottomOnly => current == LightDirection.Bottom,
                ShadowPlatform.PlatformType.HorizontalOnly => current == LightDirection.Left || current == LightDirection.Right,
                ShadowPlatform.PlatformType.VerticalOnly => current == LightDirection.Top || current == LightDirection.Bottom,
                _ => false
            };
        }

        private IEnumerator CooldownRoutine()
        {
            _isOnCooldown = true;
            yield return new WaitForSeconds(cooldownTime);
            _isOnCooldown = false;
        }
    }
}
