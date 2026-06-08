using UnityEngine;
using ShadowPlatformer.Light;

namespace ShadowPlatformer.Light
{
    public enum ShadowVisibility
    {
        WhenLightMatches,
        WhenLightOpposite
    }

    [RequireComponent(typeof(Collider2D))]
    public class ShadowPlatform : MonoBehaviour
    {
        [Header("Shadow Config")]
        public LightDirection shadowDirection = LightDirection.Right;
        public ShadowVisibility visibilityRule = ShadowVisibility.WhenLightMatches;

        [Header("Animation")]
        public float fadeDuration = 0.3f;

        private Collider2D _col;
        private SpriteRenderer _sr;
        private bool _isVisible;
        private float _currentAlpha;
        private float _targetAlpha;

        public bool IsVisible => _isVisible;

        private void Awake()
        {
            _col = GetComponent<Collider2D>();
            _sr = GetComponent<SpriteRenderer>();
        }

        private void Start()
        {
            if (LightManager.Instance != null)
            {
                LightManager.Instance.OnDirectionChanged += OnLightChanged;
                EvaluateVisibility(LightManager.Instance.currentDirection);
            }
        }

        private void OnDestroy()
        {
            if (LightManager.Instance != null)
                LightManager.Instance.OnDirectionChanged -= OnLightChanged;
        }

        private void Update()
        {
            if (Mathf.Abs(_currentAlpha - _targetAlpha) > 0.01f)
            {
                _currentAlpha = Mathf.MoveTowards(_currentAlpha, _targetAlpha, Time.deltaTime / fadeDuration);
                ApplyAlpha(_currentAlpha);
            }
        }

        private void OnLightChanged(LightDirection newDir)
        {
            EvaluateVisibility(newDir);
        }

        private void EvaluateVisibility(LightDirection lightDir)
        {
            bool match = lightDir == shadowDirection;
            bool shouldShow = visibilityRule == ShadowVisibility.WhenLightMatches ? match : !match;

            _isVisible = shouldShow;
            _targetAlpha = shouldShow ? 1f : 0f;

            _col.enabled = shouldShow;

            if (_sr != null && fadeDuration <= 0f)
                ApplyAlpha(_targetAlpha);
        }

        private void ApplyAlpha(float a)
        {
            if (_sr != null)
            {
                Color c = _sr.color;
                c.a = a;
                _sr.color = c;
            }
        }
    }
}
