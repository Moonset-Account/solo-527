using System.Collections.Generic;
using UnityEngine;

public readonly struct WeatherState
{
    public readonly WeatherType type;
    public readonly float windSpeed;
    public readonly float windAngle;
    public readonly float visibility;
    public readonly Color fogColor;
    public readonly float fogDensity;

    public WeatherState(WeatherType type, float windSpeed, float windAngle, float visibility, Color fogColor, float fogDensity)
    {
        this.type = type;
        this.windSpeed = windSpeed;
        this.windAngle = windAngle;
        this.visibility = visibility;
        this.fogColor = fogColor;
        this.fogDensity = fogDensity;
    }
}

public class WeatherSystem : MonoBehaviour
{
    public static WeatherSystem Instance { get; private set; }

    public List<WeatherData> weatherPresets;
    public float warningLeadTime = 20f;
    [Range(1f, 4f)] public float weatherTimeScale = 1f;

    private Dictionary<WeatherType, Dictionary<WeatherType, float>> transitionMatrix;

    private WeatherType currentType;
    private float currentWindSpeed;
    private float currentWindAngle;
    private float currentVisibility;
    private Color currentFogColor;
    private float currentFogDensity;

    private WeatherType targetType;
    private float targetWindSpeed;
    private float targetWindAngle;
    private float targetVisibility;
    private Color targetFogColor;
    private float targetFogDensity;
    private float targetTransitionDuration;

    private float transitionElapsed;
    private bool isTransitioning;

    private float weatherDuration;
    private float weatherTimer;
    private bool warningFired;

    private struct ForecastEntry
    {
        public WeatherData data;
        public float duration;
    }

    private Queue<ForecastEntry> forecastQueue = new Queue<ForecastEntry>(3);

    private WeatherData currentData;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        InitializeTransitionMatrix();
    }

    private void InitializeTransitionMatrix()
    {
        transitionMatrix = new Dictionary<WeatherType, Dictionary<WeatherType, float>>
        {
            { WeatherType.Clear, new Dictionary<WeatherType, float>
                { { WeatherType.Clear, 0.3f }, { WeatherType.Cloudy, 0.35f }, { WeatherType.Fog, 0.1f },
                  { WeatherType.Rain, 0.15f }, { WeatherType.Storm, 0.05f }, { WeatherType.Snow, 0.05f } } },
            { WeatherType.Cloudy, new Dictionary<WeatherType, float>
                { { WeatherType.Clear, 0.2f }, { WeatherType.Cloudy, 0.2f }, { WeatherType.Fog, 0.15f },
                  { WeatherType.Rain, 0.25f }, { WeatherType.Storm, 0.1f }, { WeatherType.Snow, 0.1f } } },
            { WeatherType.Fog, new Dictionary<WeatherType, float>
                { { WeatherType.Clear, 0.25f }, { WeatherType.Cloudy, 0.3f }, { WeatherType.Fog, 0.1f },
                  { WeatherType.Rain, 0.2f }, { WeatherType.Storm, 0.05f }, { WeatherType.Snow, 0.1f } } },
            { WeatherType.Rain, new Dictionary<WeatherType, float>
                { { WeatherType.Clear, 0.1f }, { WeatherType.Cloudy, 0.25f }, { WeatherType.Fog, 0.1f },
                  { WeatherType.Rain, 0.2f }, { WeatherType.Storm, 0.25f }, { WeatherType.Snow, 0.1f } } },
            { WeatherType.Storm, new Dictionary<WeatherType, float>
                { { WeatherType.Clear, 0.1f }, { WeatherType.Cloudy, 0.2f }, { WeatherType.Fog, 0.05f },
                  { WeatherType.Rain, 0.35f }, { WeatherType.Storm, 0.1f }, { WeatherType.Snow, 0.2f } } },
            { WeatherType.Snow, new Dictionary<WeatherType, float>
                { { WeatherType.Clear, 0.15f }, { WeatherType.Cloudy, 0.25f }, { WeatherType.Fog, 0.15f },
                  { WeatherType.Rain, 0.1f }, { WeatherType.Storm, 0.1f }, { WeatherType.Snow, 0.25f } } }
        };
    }

    private void Update()
    {
        float dt = Time.deltaTime * weatherTimeScale;

        if (isTransitioning)
        {
            transitionElapsed += dt;
            float t = Mathf.Clamp01(transitionElapsed / targetTransitionDuration);
            float eased = t * t * (3f - 2f * t);

            currentWindSpeed = Mathf.Lerp(currentWindSpeed, targetWindSpeed, eased);
            currentWindAngle = Mathf.LerpAngle(currentWindAngle, targetWindAngle, eased);
            currentVisibility = Mathf.Lerp(currentVisibility, targetVisibility, eased);
            currentFogColor = Color.Lerp(currentFogColor, targetFogColor, eased);
            currentFogDensity = Mathf.Lerp(currentFogDensity, targetFogDensity, eased);

            if (t >= 1f)
            {
                isTransitioning = false;
                currentWindSpeed = targetWindSpeed;
                currentWindAngle = targetWindAngle;
                currentVisibility = targetVisibility;
                currentFogColor = targetFogColor;
                currentFogDensity = targetFogDensity;
            }
        }

        weatherTimer += dt;
        float remaining = weatherDuration - weatherTimer;

        if (!warningFired && remaining <= warningLeadTime && remaining > 0f)
        {
            warningFired = true;
            if (forecastQueue.Count > 0)
            {
                ForecastEntry next = forecastQueue.Peek();
                GameEvents.TriggerWeatherWarning(next.data.type, remaining);
            }
        }

        if (weatherTimer >= weatherDuration)
        {
            AdvanceWeather();
        }

        ApplyFogToRenderSettings();
    }

    private void AdvanceWeather()
    {
        if (forecastQueue.Count > 0)
        {
            ForecastEntry entry = forecastQueue.Dequeue();
            TransitionToWeather(entry.data, entry.duration);
        }
        else
        {
            WeatherData next = PickNextWeather(currentType);
            float dur = Random.Range(next.minDuration, next.maxDuration);
            TransitionToWeather(next, dur);
        }

        EnqueueForecastIfNeeded();
    }

    private void EnqueueForecastIfNeeded()
    {
        while (forecastQueue.Count < 3)
        {
            WeatherType lastType = forecastQueue.Count > 0
                ? forecastQueue.ToArray()[forecastQueue.Count - 1].data.type
                : targetType;
            WeatherData next = PickNextWeather(lastType);
            float dur = Random.Range(next.minDuration, next.maxDuration);
            forecastQueue.Enqueue(new ForecastEntry { data = next, duration = dur });
        }
    }

    private WeatherData PickNextWeather(WeatherType fromType)
    {
        if (!transitionMatrix.TryGetValue(fromType, out var weights) || weatherPresets == null || weatherPresets.Count == 0)
        {
            return weatherPresets != null && weatherPresets.Count > 0 ? weatherPresets[0] : null;
        }

        float total = 0f;
        foreach (var kvp in weights)
        {
            total += kvp.Value;
        }

        float rand = Random.value * total;
        float cumulative = 0f;
        WeatherType chosen = fromType;

        foreach (var kvp in weights)
        {
            cumulative += kvp.Value;
            if (rand <= cumulative)
            {
                chosen = kvp.Key;
                break;
            }
        }

        WeatherData match = weatherPresets.Find(p => p.type == chosen);
        return match != null ? match : weatherPresets[0];
    }

    private void TransitionToWeather(WeatherData data, float duration)
    {
        currentData = data;
        targetType = data.type;
        targetWindSpeed = Random.Range(data.minWindSpeed, data.maxWindSpeed);
        targetWindAngle = Random.Range(0f, 360f);
        targetVisibility = Random.Range(data.minVisibility, data.maxVisibility);
        targetFogColor = data.fogColor;
        targetFogDensity = data.fogDensity;
        targetTransitionDuration = data.transitionDuration;

        transitionElapsed = 0f;
        isTransitioning = true;

        weatherDuration = duration;
        weatherTimer = 0f;
        warningFired = false;

        currentType = data.type;
        GameEvents.TriggerWeatherChanged(currentType, targetWindSpeed, targetWindAngle, targetVisibility);
    }

    public void InitializeWeather(WeatherData data)
    {
        currentType = data.type;
        currentWindSpeed = Random.Range(data.minWindSpeed, data.maxWindSpeed);
        currentWindAngle = Random.Range(0f, 360f);
        currentVisibility = Random.Range(data.minVisibility, data.maxVisibility);
        currentFogColor = data.fogColor;
        currentFogDensity = data.fogDensity;
        currentData = data;

        isTransitioning = false;
        targetType = data.type;
        targetWindSpeed = currentWindSpeed;
        targetWindAngle = currentWindAngle;
        targetVisibility = currentVisibility;
        targetFogColor = currentFogColor;
        targetFogDensity = currentFogDensity;

        weatherDuration = Random.Range(data.minDuration, data.maxDuration);
        weatherTimer = 0f;
        warningFired = false;

        forecastQueue.Clear();
        EnqueueForecastIfNeeded();

        GameEvents.TriggerWeatherChanged(currentType, currentWindSpeed, currentWindAngle, currentVisibility);
        ApplyFogToRenderSettings();
    }

    public void ForceWeather(WeatherType type)
    {
        WeatherData match = weatherPresets.Find(p => p.type == type);
        if (match != null)
        {
            InitializeWeather(match);
        }
    }

    public WeatherState GetCurrentState()
    {
        return new WeatherState(currentType, currentWindSpeed, currentWindAngle, currentVisibility, currentFogColor, currentFogDensity);
    }

    public void ApplyFogToRenderSettings()
    {
        RenderSettings.fog = true;
        RenderSettings.fogMode = FogMode.Exponential;
        RenderSettings.fogColor = currentFogColor;
        RenderSettings.fogDensity = currentFogDensity;
    }

    public Vector2 GetWindForceAt(Vector2 position)
    {
        float rad = currentWindAngle * Mathf.Deg2Rad;
        return new Vector2(Mathf.Cos(rad), Mathf.Sin(rad)) * currentWindSpeed;
    }

    private void OnDestroy()
    {
        if (Instance == this)
        {
            Instance = null;
        }
    }

    private void OnValidate()
    {
        warningLeadTime = Mathf.Clamp(warningLeadTime, 5f, 60f);
        weatherTimeScale = Mathf.Clamp(weatherTimeScale, 1f, 4f);

        if (weatherPresets != null)
        {
            foreach (var preset in weatherPresets)
            {
                if (preset == null) continue;
                preset.minWindSpeed = Mathf.Max(0f, preset.minWindSpeed);
                preset.maxWindSpeed = Mathf.Max(preset.minWindSpeed, preset.maxWindSpeed);
                preset.minVisibility = Mathf.Clamp(preset.minVisibility, 0f, 1f);
                preset.maxVisibility = Mathf.Clamp(preset.maxVisibility, preset.minVisibility, 1f);
                preset.minDuration = Mathf.Max(1f, preset.minDuration);
                preset.maxDuration = Mathf.Max(preset.minDuration, preset.maxDuration);
                preset.transitionDuration = Mathf.Max(0.1f, preset.transitionDuration);
            }
        }
    }
}
