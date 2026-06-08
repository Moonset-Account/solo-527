using UnityEngine;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class WeatherSystem : MonoBehaviour
    {
        public static WeatherSystem Instance { get; private set; }

        public event Action<WeatherType, WeatherType> OnWeatherChanged;
        public event Action<WeatherForecast> OnWeatherWarning;
        public event Action<WindInfo> OnWindChanged;
        public event Action<float> OnStormDamage;

        public WeatherType CurrentWeather => _currentWeather;
        public WindInfo CurrentWind => _currentWind;

        [SerializeField] private List<WeatherScheduleEntry> _schedule = new List<WeatherScheduleEntry>();

        private WeatherType _currentWeather;
        private WindInfo _currentWind;
        private int _currentScheduleIndex;
        private float _weatherTimer;
        private bool _warningEmitted;
        private GameConfig _gameConfig;

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
            ServiceLocator.Instance.TryGet(out _gameConfig);

            if (_schedule.Count > 0)
            {
                ApplyEntry(_schedule[0]);
                _currentScheduleIndex = 0;
                _weatherTimer = _schedule[0].Duration;
                _warningEmitted = false;
            }
        }

        private void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.CurrentState != GameState.Sailing)
                return;
            UpdateWeather(Time.deltaTime);
        }

        public void InitializeSchedule(List<WeatherScheduleEntry> entries)
        {
            _schedule = new List<WeatherScheduleEntry>(entries);
            _currentScheduleIndex = 0;
            _warningEmitted = false;

            if (_schedule.Count > 0)
            {
                ApplyEntry(_schedule[0]);
                _weatherTimer = _schedule[0].Duration;
            }
        }

        public void UpdateWeather(float deltaTime)
        {
            if (_schedule.Count == 0) return;

            _weatherTimer -= deltaTime;

            float leadTime = _gameConfig != null ? _gameConfig.ForecastLeadTime : 15f;

            if (!_warningEmitted && _weatherTimer <= leadTime)
            {
                int nextIndex = (_currentScheduleIndex + 1) % _schedule.Count;
                var nextEntry = _schedule[nextIndex];
                var forecast = new WeatherForecast
                {
                    UpcomingWeather = nextEntry.Weather,
                    UpcomingWind = nextEntry.Wind,
                    TimeUntilChange = _weatherTimer,
                    WarningMessage = nextEntry.WarningMessage
                };
                OnWeatherWarning?.Invoke(forecast);
                _warningEmitted = true;
            }

            if (_weatherTimer <= 0f)
            {
                _currentScheduleIndex = (_currentScheduleIndex + 1) % _schedule.Count;
                ApplyEntry(_schedule[_currentScheduleIndex]);
                _weatherTimer = _schedule[_currentScheduleIndex].Duration;
                _warningEmitted = false;
            }

            if (_currentWeather == WeatherType.Stormy)
            {
                float stormDamageChance = _gameConfig != null ? _gameConfig.StormDamageChance : 0.15f;
                if (UnityEngine.Random.value < stormDamageChance * deltaTime)
                {
                    float damage = UnityEngine.Random.Range(5f, 15f);
                    OnStormDamage?.Invoke(damage);
                }
            }
        }

        public void ForceWeather(WeatherType weather, WindInfo wind)
        {
            var previousWeather = _currentWeather;
            _currentWeather = weather;
            _currentWind = wind;

            if (previousWeather != weather)
            {
                OnWeatherChanged?.Invoke(previousWeather, weather);
            }

            OnWindChanged?.Invoke(wind);
        }

        public WeatherForecast GetForecast()
        {
            if (_schedule.Count == 0)
            {
                return default;
            }

            int nextIndex = (_currentScheduleIndex + 1) % _schedule.Count;
            var nextEntry = _schedule[nextIndex];

            return new WeatherForecast
            {
                UpcomingWeather = nextEntry.Weather,
                UpcomingWind = nextEntry.Wind,
                TimeUntilChange = _weatherTimer,
                WarningMessage = nextEntry.WarningMessage
            };
        }

        public float GetWindEffectOnDirection(Vector2 moveDir)
        {
            if (_currentWind.Direction == WindDirection.None) return 0f;

            Vector2 windVec = WindDirectionToVector2(_currentWind.Direction);
            float moveMagnitude = moveDir.magnitude;

            if (moveMagnitude < 0.001f || windVec.magnitude < 0.001f) return 0f;

            Vector2 normalizedMove = moveDir / moveMagnitude;
            float dot = Vector2.Dot(normalizedMove, windVec.normalized);

            if (dot > 0f)
            {
                return dot * 0.3f;
            }
            else
            {
                return dot * 0.4f;
            }
        }

        public float GetVisibilityRadius()
        {
            if (_gameConfig != null)
            {
                return _gameConfig.GetVisibilityRadius(_currentWeather);
            }

            return _currentWeather switch
            {
                WeatherType.Clear => 20f,
                WeatherType.Cloudy => 16f,
                WeatherType.Foggy => 3f,
                WeatherType.Rainy => 6f,
                WeatherType.Stormy => 2f,
                _ => 20f
            };
        }

        private void ApplyEntry(WeatherScheduleEntry entry)
        {
            var previousWeather = _currentWeather;
            _currentWeather = entry.Weather;
            _currentWind = entry.Wind;

            if (previousWeather != entry.Weather)
            {
                OnWeatherChanged?.Invoke(previousWeather, entry.Weather);
            }

            OnWindChanged?.Invoke(entry.Wind);
        }

        public static Vector2 WindDirectionToVector2(WindDirection direction)
        {
            return direction switch
            {
                WindDirection.North => new Vector2(0f, 1f),
                WindDirection.South => new Vector2(0f, -1f),
                WindDirection.East => new Vector2(1f, 0f),
                WindDirection.West => new Vector2(-1f, 0f),
                WindDirection.NorthEast => new Vector2(0.7f, 0.7f),
                WindDirection.NorthWest => new Vector2(-0.7f, 0.7f),
                WindDirection.SouthEast => new Vector2(0.7f, -0.7f),
                WindDirection.SouthWest => new Vector2(-0.7f, -0.7f),
                _ => Vector2.zero
            };
        }
    }
}
