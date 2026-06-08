using UnityEngine;
using System;
using System.Collections.Generic;
using PuppetTheater.Data;

namespace PuppetTheater.Light
{
    public struct LightChangeRecord
    {
        public LightColor from;
        public LightColor to;
        public double songTimeMs;
        public bool wasCorrect;
    }

    public class LightStateSystem : MonoBehaviour
    {
        [SerializeField] private float transitionDurationMs = 150f;

        private LightColor _currentColor;
        private LightColor _previousColor;
        private float _transitionStartTime;
        private bool _isTransitioning;
        private float _errorOverlayAlpha;
        private bool _isFlashingError;
        private float _intensityMultiplier = 1f;
        private float _pulseMultiplier;
        private float _pulseDuration;
        private float _pulseRemaining;
        private Func<double> _songTimeProvider;
        private readonly List<LightChangeRecord> _changeHistory = new List<LightChangeRecord>();

        private static readonly Dictionary<LightColor, Color> ColorMap = new Dictionary<LightColor, Color>
        {
            { LightColor.Red,    new Color(1f, 0.2f, 0.2f) },
            { LightColor.Blue,   new Color(0.2f, 0.4f, 1f) },
            { LightColor.Green,  new Color(0.2f, 1f, 0.4f) },
            { LightColor.Yellow, new Color(1f, 0.8f, 0.2f) },
            { LightColor.Purple, new Color(0.8f, 0.2f, 1f) },
            { LightColor.White,  Color.white }
        };

        public LightColor CurrentColor => _currentColor;
        public LightColor PreviousColor => _previousColor;
        public float TransitionDurationMs { get => transitionDurationMs; set => transitionDurationMs = value; }
        public float ErrorOverlayAlpha => _errorOverlayAlpha;
        public float IntensityMultiplier => _intensityMultiplier;

        public event Action<LightColor, LightColor, bool> OnLightChanged;

        public void SetSongTimeProvider(Func<double> provider)
        {
            _songTimeProvider = provider;
        }

        public void SwitchLight(LightColor newColor)
        {
            SwitchLight(newColor, false);
        }

        public void SwitchLight(LightColor newColor, bool isCorrectTiming)
        {
            if (newColor == _currentColor && !_isTransitioning) return;

            _previousColor = _currentColor;
            _currentColor = newColor;
            _transitionStartTime = Time.time;
            _isTransitioning = true;

            _changeHistory.Add(new LightChangeRecord
            {
                from = _previousColor,
                to = _currentColor,
                songTimeMs = ResolveSongTimeMs(),
                wasCorrect = isCorrectTiming
            });

            OnLightChanged?.Invoke(_previousColor, _currentColor, isCorrectTiming);
        }

        public void ForceLight(LightColor color)
        {
            ForceLight(color, false);
        }

        public void ForceLight(LightColor color, bool isCorrectTiming)
        {
            _previousColor = _currentColor;
            _currentColor = color;
            _isTransitioning = false;

            _changeHistory.Add(new LightChangeRecord
            {
                from = _previousColor,
                to = _currentColor,
                songTimeMs = ResolveSongTimeMs(),
                wasCorrect = isCorrectTiming
            });

            OnLightChanged?.Invoke(_previousColor, _currentColor, isCorrectTiming);
        }

        public Color GetCurrentColor()
        {
            Color baseColor;

            if (_isTransitioning)
            {
                float elapsed = (Time.time - _transitionStartTime) * 1000f;
                float t = Mathf.Clamp01(elapsed / transitionDurationMs);
                baseColor = Color.Lerp(GetLightColorUnity(_previousColor), GetLightColorUnity(_currentColor), t);

                if (t >= 1f)
                    _isTransitioning = false;
            }
            else
            {
                baseColor = GetLightColorUnity(_currentColor);
            }

            return baseColor * _intensityMultiplier;
        }

        public Color GetLightColorUnity(LightColor lightColor)
        {
            return ColorMap.TryGetValue(lightColor, out Color c) ? c : Color.white;
        }

        public void FlashError()
        {
            _errorOverlayAlpha = 1f;
            _isFlashingError = true;
        }

        public void PulseIntensity(float multiplier, float duration)
        {
            _pulseMultiplier = multiplier;
            _pulseDuration = duration;
            _pulseRemaining = duration;
            _intensityMultiplier = multiplier;
        }

        public IReadOnlyList<LightChangeRecord> GetChangeHistory()
        {
            return _changeHistory.AsReadOnly();
        }

        private double ResolveSongTimeMs()
        {
            return _songTimeProvider != null ? _songTimeProvider() : Time.timeAsDouble * 1000.0;
        }

        private void Update()
        {
            if (_isFlashingError)
            {
                _errorOverlayAlpha -= Time.deltaTime * 4f;
                if (_errorOverlayAlpha <= 0f)
                {
                    _errorOverlayAlpha = 0f;
                    _isFlashingError = false;
                }
            }

            if (_pulseRemaining > 0f)
            {
                _pulseRemaining -= Time.deltaTime;
                if (_pulseRemaining <= 0f)
                {
                    _pulseRemaining = 0f;
                    _intensityMultiplier = 1f;
                }
                else
                {
                    _intensityMultiplier = Mathf.Lerp(1f, _pulseMultiplier, _pulseRemaining / _pulseDuration);
                }
            }
        }
    }
}
