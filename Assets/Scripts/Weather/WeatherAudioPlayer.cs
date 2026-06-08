using UnityEngine;

public class WeatherAudioPlayer : MonoBehaviour
{
    public static WeatherAudioPlayer Instance { get; private set; }

    [SerializeField] private float crossfadeDuration = 2f;

    private string _currentAmbientClipId;
    private WeatherType _lastWeatherType = WeatherType.Clear;

    private static readonly string[] WeatherAmbientClips = new string[]
    {
        "ambient_clear",
        "ambient_cloudy",
        "ambient_fog",
        "ambient_rain",
        "ambient_storm",
        "ambient_snow"
    };

    private static readonly string[] WeatherTransitionClips = new string[]
    {
        "",
        "weather_to_cloudy",
        "weather_to_fog",
        "weather_to_rain",
        "weather_to_storm",
        "weather_to_snow"
    };

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GameEvents.WeatherChanged += OnWeatherChanged;
        GameEvents.WeatherWarning += OnWeatherWarning;
    }

    private void OnDisable()
    {
        GameEvents.WeatherChanged -= OnWeatherChanged;
        GameEvents.WeatherWarning -= OnWeatherWarning;
    }

    private void OnWeatherChanged(WeatherType type, float windSpeed, float windAngle, float visibility)
    {
        if (type == _lastWeatherType) return;

        int idx = (int)type;
        string newAmbientId = idx < WeatherAmbientClips.Length ? WeatherAmbientClips[idx] : "";

        if (!string.IsNullOrEmpty(newAmbientId) && newAmbientId != _currentAmbientClipId)
        {
            if (AudioTrigger.Instance != null)
            {
                if (!string.IsNullOrEmpty(_currentAmbientClipId))
                {
                    AudioTrigger.Instance.Crossfade(_currentAmbientClipId, newAmbientId, crossfadeDuration);
                }
                else
                {
                    AudioTrigger.Instance.Play(newAmbientId, 0.4f, true);
                }
            }
            _currentAmbientClipId = newAmbientId;
        }

        if (idx < WeatherTransitionClips.Length && !string.IsNullOrEmpty(WeatherTransitionClips[idx]))
        {
            GameEvents.TriggerAudioTriggerRequested(WeatherTransitionClips[idx], 0.6f);
        }

        _lastWeatherType = type;
    }

    private void OnWeatherWarning(WeatherType incoming, float secondsUntil)
    {
        GameEvents.TriggerAudioTriggerRequested("weather_warning_chime", 0.5f);
    }
}
