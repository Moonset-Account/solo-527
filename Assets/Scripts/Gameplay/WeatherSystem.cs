using UnityEngine;
using System;
using LakeSailing.Data;

namespace LakeSailing.Core
{
    public enum WeatherType
    {
        Sunny,
        Cloudy,
        Rainy,
        Windy,
        Foggy,
        Stormy
    }

    public enum WindDirection
    {
        North = 0,
        NorthEast = 45,
        East = 90,
        SouthEast = 135,
        South = 180,
        SouthWest = 225,
        West = 270,
        NorthWest = 315
    }

    public enum VisibilityLevel
    {
        Excellent = 5,
        Good = 4,
        Moderate = 3,
        Poor = 2,
        VeryPoor = 1,
        Zero = 0
    }

    public class WeatherSystem : PersistentSingleton<WeatherSystem>
    {
        [Header("当前天气状态")]
        [SerializeField] private WeatherType currentWeather = WeatherType.Sunny;
        [SerializeField] private WindDirection currentWindDirection = WindDirection.East;
        [SerializeField] [Range(0f, 1f)] private float currentWindStrength = 0.3f;
        [SerializeField] private VisibilityLevel currentVisibility = VisibilityLevel.Excellent;
        [SerializeField] [Range(0f, 1f)] private float temperature = 0.6f;

        [Header("天气预报")]
        [SerializeField] private WeatherForecast[] forecast;
        [SerializeField] private float weatherChangeInterval = 60f;
        [SerializeField] private float warningLeadTime = 15f;

        [Header("运行时状态")]
        [SerializeField] private float weatherTimer;
        [SerializeField] private int currentForecastIndex;
        [SerializeField] private bool isWarningActive;
        [SerializeField] private WeatherType upcomingWeather;

        public event Action<WeatherType> OnWeatherChanged;
        public event Action<WindDirection, float> OnWindChanged;
        public event Action<VisibilityLevel> OnVisibilityChanged;
        public event Action<WeatherType> OnWeatherWarning;
        public event Action<WeatherForecast[]> OnForecastUpdated;

        public WeatherType CurrentWeather => currentWeather;
        public WindDirection CurrentWindDirection => currentWindDirection;
        public float CurrentWindStrength => currentWindStrength;
        public VisibilityLevel CurrentVisibility => currentVisibility;
        public float Temperature => temperature;
        public WeatherForecast[] Forecast => forecast;
        public bool IsWarningActive => isWarningActive;
        public WeatherType UpcomingWeather => upcomingWeather;

        private LevelConfigData currentLevelConfig;

        public void Initialize(LevelConfigData levelConfig)
        {
            currentLevelConfig = levelConfig;
            weatherTimer = 0f;
            currentForecastIndex = 0;
            isWarningActive = false;

            GenerateForecast(levelConfig);

            if (forecast != null && forecast.Length > 0)
            {
                SetWeather(forecast[0].weather);
                SetWind(forecast[0].windDirection, forecast[0].windStrength);
                currentVisibility = forecast[0].visibility;
            }

            OnForecastUpdated?.Invoke(forecast);
        }

        private void GenerateForecast(LevelConfigData config)
        {
            int forecastCount = config.weatherPatterns != null ? config.weatherPatterns.Length : 8;
            forecast = new WeatherForecast[forecastCount];

            if (config.weatherPatterns != null && config.weatherPatterns.Length > 0)
            {
                for (int i = 0; i < forecastCount; i++)
                {
                    forecast[i] = config.weatherPatterns[i % config.weatherPatterns.Length];
                }
            }
            else
            {
                var weathers = (WeatherType[])Enum.GetValues(typeof(WeatherType));
                var directions = (WindDirection[])Enum.GetValues(typeof(WindDirection));
                var rng = new System.Random(config.seed);

                for (int i = 0; i < forecastCount; i++)
                {
                    forecast[i] = new WeatherForecast
                    {
                        weather = weathers[rng.Next(weathers.Length)],
                        windDirection = directions[rng.Next(directions.Length)],
                        windStrength = (float)(rng.NextDouble() * 0.8 + 0.1),
                        visibility = (VisibilityLevel)rng.Next(1, 6),
                        duration = weatherChangeInterval,
                        temperature = (float)(rng.NextDouble() * 0.6 + 0.2)
                    };
                }
            }
        }

        private void Update()
        {
            if (GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Playing)
                return;

            weatherTimer += Time.deltaTime;

            int nextIndex = (currentForecastIndex + 1) % forecast.Length;
            if (!isWarningActive && weatherTimer >= weatherChangeInterval - warningLeadTime && forecast.Length > 1)
            {
                isWarningActive = true;
                upcomingWeather = forecast[nextIndex].weather;
                OnWeatherWarning?.Invoke(upcomingWeather);
                EventBus.Trigger(new WeatherWarningEvent(upcomingWeather, warningLeadTime));
            }

            if (weatherTimer >= weatherChangeInterval)
            {
                weatherTimer = 0f;
                isWarningActive = false;
                currentForecastIndex = nextIndex;

                var next = forecast[currentForecastIndex];
                SetWeather(next.weather);
                SetWind(next.windDirection, next.windStrength);
                SetVisibility(next.visibility);
                temperature = next.temperature;

                OnForecastUpdated?.Invoke(forecast);
            }
        }

        public void SetWeather(WeatherType weather)
        {
            if (currentWeather == weather) return;
            currentWeather = weather;
            OnWeatherChanged?.Invoke(currentWeather);
            EventBus.Trigger(new WeatherChangedEvent(currentWeather));

            var autoVisibility = CalculateAutoVisibility(weather);
            if (autoVisibility < currentVisibility)
            {
                SetVisibility(autoVisibility);
            }
        }

        public void SetWind(WindDirection direction, float strength)
        {
            strength = Mathf.Clamp01(strength);
            if (currentWindDirection == direction && Mathf.Approximately(currentWindStrength, strength))
                return;

            currentWindDirection = direction;
            currentWindStrength = strength;
            OnWindChanged?.Invoke(currentWindDirection, currentWindStrength);
            EventBus.Trigger(new WindChangedEvent(currentWindDirection, currentWindStrength));
        }

        public void SetVisibility(VisibilityLevel visibility)
        {
            if (currentVisibility == visibility) return;
            currentVisibility = visibility;
            OnVisibilityChanged?.Invoke(currentVisibility);
            EventBus.Trigger(new VisibilityChangedEvent(currentVisibility));
        }

        public Vector2 GetWindVector()
        {
            float angle = (float)currentWindDirection * Mathf.Deg2Rad;
            return new Vector2(Mathf.Sin(angle), Mathf.Cos(angle)) * currentWindStrength;
        }

        public float GetWindAngleDegrees()
        {
            return (float)currentWindDirection;
        }

        public VisibilityLevel CalculateAutoVisibility(WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Sunny: return VisibilityLevel.Excellent;
                case WeatherType.Cloudy: return VisibilityLevel.Good;
                case WeatherType.Rainy: return VisibilityLevel.Moderate;
                case WeatherType.Windy: return VisibilityLevel.Good;
                case WeatherType.Foggy: return VisibilityLevel.VeryPoor;
                case WeatherType.Stormy: return VisibilityLevel.Poor;
                default: return VisibilityLevel.Good;
            }
        }

        public float GetWeatherSpeedModifier()
        {
            switch (currentWeather)
            {
                case WeatherType.Sunny: return 1.0f;
                case WeatherType.Cloudy: return 1.0f;
                case WeatherType.Rainy: return 0.85f;
                case WeatherType.Windy: return 1.2f;
                case WeatherType.Foggy: return 0.7f;
                case WeatherType.Stormy: return 0.5f;
                default: return 1.0f;
            }
        }

        public float GetFuelConsumptionModifier()
        {
            switch (currentWeather)
            {
                case WeatherType.Sunny: return 1.0f;
                case WeatherType.Cloudy: return 1.05f;
                case WeatherType.Rainy: return 1.2f;
                case WeatherType.Windy: return 0.85f;
                case WeatherType.Foggy: return 1.15f;
                case WeatherType.Stormy: return 1.5f;
                default: return 1.0f;
            }
        }

        public int GetPhotoQualityModifier()
        {
            switch (currentVisibility)
            {
                case VisibilityLevel.Excellent: return 100;
                case VisibilityLevel.Good: return 85;
                case VisibilityLevel.Moderate: return 65;
                case VisibilityLevel.Poor: return 40;
                case VisibilityLevel.VeryPoor: return 20;
                case VisibilityLevel.Zero: return 0;
                default: return 50;
            }
        }

        public string GetWeatherName(WeatherType weather)
        {
            switch (weather)
            {
                case WeatherType.Sunny: return "晴朗";
                case WeatherType.Cloudy: return "多云";
                case WeatherType.Rainy: return "雨天";
                case WeatherType.Windy: return "大风";
                case WeatherType.Foggy: return "雾天";
                case WeatherType.Stormy: return "暴风雨";
                default: return "未知";
            }
        }

        public string GetWindDirectionName(WindDirection dir)
        {
            switch (dir)
            {
                case WindDirection.North: return "北风";
                case WindDirection.NorthEast: return "东北风";
                case WindDirection.East: return "东风";
                case WindDirection.SouthEast: return "东南风";
                case WindDirection.South: return "南风";
                case WindDirection.SouthWest: return "西南风";
                case WindDirection.West: return "西风";
                case WindDirection.NorthWest: return "西北风";
                default: return "未知";
            }
        }

        public WeatherForecast GetCurrentForecast()
        {
            if (forecast != null && currentForecastIndex < forecast.Length)
            {
                return forecast[currentForecastIndex];
            }
            return default;
        }

        public float GetTimeUntilNextWeather()
        {
            return Mathf.Max(0, weatherChangeInterval - weatherTimer);
        }

        public float GetTimeUntilWarning()
        {
            float time = weatherChangeInterval - warningLeadTime - weatherTimer;
            return Mathf.Max(0, time);
        }
    }

    [Serializable]
    public struct WeatherForecast
    {
        public WeatherType weather;
        public WindDirection windDirection;
        [Range(0f, 1f)] public float windStrength;
        public VisibilityLevel visibility;
        public float duration;
        [Range(0f, 1f)] public float temperature;
    }

    public struct WeatherChangedEvent : IEvent
    {
        public readonly WeatherType NewWeather;

        public WeatherChangedEvent(WeatherType newWeather)
        {
            NewWeather = newWeather;
        }
    }

    public struct WindChangedEvent : IEvent
    {
        public readonly WindDirection Direction;
        public readonly float Strength;

        public WindChangedEvent(WindDirection direction, float strength)
        {
            Direction = direction;
            Strength = strength;
        }
    }

    public struct VisibilityChangedEvent : IEvent
    {
        public readonly VisibilityLevel Visibility;

        public VisibilityChangedEvent(VisibilityLevel visibility)
        {
            Visibility = visibility;
        }
    }

    public struct WeatherWarningEvent : IEvent
    {
        public readonly WeatherType UpcomingWeather;
        public readonly float LeadTime;

        public WeatherWarningEvent(WeatherType upcomingWeather, float leadTime)
        {
            UpcomingWeather = upcomingWeather;
            LeadTime = leadTime;
        }
    }
}
