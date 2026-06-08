using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class WeatherSystem
    {
        private List<WeatherPattern> _weatherPatterns;
        private WeatherType _currentWeather;
        private float _currentIntensity;
        private int _currentPatternIndex;

        private WaveManager _waveManager;

        public WeatherType CurrentWeather => _currentWeather;
        public float CurrentIntensity => _currentIntensity;
        public string CurrentWeatherName => GetWeatherName(_currentWeather);

        public event Action<WeatherType, float> OnWeatherChanged;

        private static Dictionary<WeatherType, string> _weatherNames = new Dictionary<WeatherType, string>
        {
            { WeatherType.Sunny, "晴天" },
            { WeatherType.Rain, "雨天" },
            { WeatherType.Fog, "雾天" },
            { WeatherType.Snow, "雪天" },
            { WeatherType.Wind, "大风" }
        };

        public WeatherSystem(WaveManager waveManager)
        {
            _waveManager = waveManager;
            _currentWeather = WeatherType.Sunny;
            _currentIntensity = 1f;
            _weatherPatterns = new List<WeatherPattern>();
        }

        public void Initialize(List<WeatherPattern> patterns)
        {
            _weatherPatterns = patterns ?? new List<WeatherPattern>();
            _currentPatternIndex = 0;
            UpdateWeatherForWave(_waveManager.CurrentWaveNumber);
        }

        public void UpdateWeatherForWave(int waveNumber)
        {
            WeatherPattern activePattern = null;

            for (int i = 0; i < _weatherPatterns.Count; i++)
            {
                var pattern = _weatherPatterns[i];
                if (waveNumber >= pattern.startAtWave &&
                    waveNumber < pattern.startAtWave + pattern.durationWaves)
                {
                    activePattern = pattern;
                    _currentPatternIndex = i;
                    break;
                }
            }

            if (activePattern == null && _weatherPatterns.Count > 0)
            {
                activePattern = _weatherPatterns[0];
            }

            if (activePattern != null &&
                (activePattern.type != _currentWeather ||
                 Math.Abs(activePattern.intensity - _currentIntensity) > 0.001f))
            {
                _currentWeather = activePattern.type;
                _currentIntensity = activePattern.intensity;
                OnWeatherChanged?.Invoke(_currentWeather, _currentIntensity);
            }
        }

        public string GetWeatherName(WeatherType type)
        {
            return _weatherNames.TryGetValue(type, out var name) ? name : type.ToString();
        }

        public float GetDamageModifier()
        {
            switch (_currentWeather)
            {
                case WeatherType.Sunny:
                    return _currentIntensity;
                case WeatherType.Rain:
                    return _currentIntensity;
                case WeatherType.Fog:
                    return _currentIntensity;
                case WeatherType.Snow:
                    return _currentIntensity;
                case WeatherType.Wind:
                    return _currentIntensity;
                default:
                    return 1f;
            }
        }

        public float GetRangeModifier()
        {
            switch (_currentWeather)
            {
                case WeatherType.Sunny:
                    return 1f;
                case WeatherType.Rain:
                    return 0.9f;
                case WeatherType.Fog:
                    return 0.75f;
                case WeatherType.Snow:
                    return 0.85f;
                case WeatherType.Wind:
                    return 1.1f;
                default:
                    return 1f;
            }
        }

        public float GetFireRateModifier()
        {
            switch (_currentWeather)
            {
                case WeatherType.Sunny:
                    return 1.05f;
                case WeatherType.Rain:
                    return 0.95f;
                case WeatherType.Fog:
                    return 0.9f;
                case WeatherType.Snow:
                    return 0.85f;
                case WeatherType.Wind:
                    return 1.15f;
                default:
                    return 1f;
            }
        }

        public float GetEnemySpeedModifier()
        {
            switch (_currentWeather)
            {
                case WeatherType.Sunny:
                    return 1f;
                case WeatherType.Rain:
                    return 0.9f;
                case WeatherType.Fog:
                    return 0.95f;
                case WeatherType.Snow:
                    return 0.75f;
                case WeatherType.Wind:
                    return 1.05f;
                default:
                    return 1f;
            }
        }

        public string GetWeatherDescription()
        {
            switch (_currentWeather)
            {
                case WeatherType.Sunny:
                    return $"天气晴朗，塔伤害+{Mathf.RoundToInt((_currentIntensity - 1) * 100)}%";
                case WeatherType.Rain:
                    return "下雨了，塔射程-10%，敌人速度-10%";
                case WeatherType.Fog:
                    return "浓雾弥漫，塔射程-25%，射速-10%";
                case WeatherType.Snow:
                    return "大雪纷飞，塔伤害-25%，敌人速度-25%";
                case WeatherType.Wind:
                    return "大风呼啸，塔射程+10%，射速+15%";
                default:
                    return string.Empty;
            }
        }

        public void SetManualWeather(WeatherType type, float intensity)
        {
            _currentWeather = type;
            _currentIntensity = intensity;
            OnWeatherChanged?.Invoke(_currentWeather, _currentIntensity);
        }

        public void Reset()
        {
            _currentWeather = WeatherType.Sunny;
            _currentIntensity = 1f;
            _currentPatternIndex = 0;
        }
    }
}
