using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class HUDPanel : MonoBehaviour
{
    [Header("Supply Bars")]
    [SerializeField] private Image fuelBar;
    [SerializeField] private Image foodBar;
    [SerializeField] private TMP_Text fuelText;
    [SerializeField] private TMP_Text foodText;
    [SerializeField] private TMP_Text filmText;

    [Header("Compass")]
    [SerializeField] private RectTransform compassNeedle;
    [SerializeField] private TMP_Text windDirectionText;
    [SerializeField] private TMP_Text windSpeedText;

    [Header("Weather")]
    [SerializeField] private TMP_Text weatherTypeText;
    [SerializeField] private Image weatherIcon;
    [SerializeField] private RectTransform weatherPanel;

    [Header("Mission Tracker")]
    [SerializeField] private Transform missionListContainer;
    [SerializeField] private GameObject missionEntryPrefab;
    [SerializeField] private TMP_Text timerText;

    [Header("Photo Indicator")]
    [SerializeField] private GameObject photoIndicator;
    [SerializeField] private TMP_Text photoQualityText;
    [SerializeField] private Image photoReticle;

    [Header("Wind Arrow")]
    [SerializeField] private RectTransform windArrow;

    private BoatController _boat;
    private SupplySystem _supply;
    private float _warningFlashTimer;
    private bool _isFlashing;

    private static readonly string[] WeatherLabels = { "晴", "云", "雾", "雨", "暴", "雪" };
    private static readonly string[] WeatherIcons = { "☀", "☁", "🌫", "🌧", "⛈", "❄" };
    private static readonly Color[] SupplyWarnColors = { Color.green, Color.yellow, new Color(1f, 0.5f, 0f), Color.red };

    private void OnEnable()
    {
        GameEvents.WeatherChanged += OnWeatherChanged;
        GameEvents.PhotoTargetInRange += OnPhotoTargetInRange;
        GameEvents.PhotoTargetOutOfRange += OnPhotoTargetOutOfRange;
        GameEvents.SupplyConsumed += OnSupplyConsumed;
        GameEvents.SupplyDepleted += OnSupplyDepleted;
        GameEvents.MissionCompleted += OnMissionCompleted;
        GameEvents.InputActionTriggered += OnInputAction;
    }

    private void OnDisable()
    {
        GameEvents.WeatherChanged -= OnWeatherChanged;
        GameEvents.PhotoTargetInRange -= OnPhotoTargetInRange;
        GameEvents.PhotoTargetOutOfRange -= OnPhotoTargetOutOfRange;
        GameEvents.SupplyConsumed -= OnSupplyConsumed;
        GameEvents.SupplyDepleted -= OnSupplyDepleted;
        GameEvents.MissionCompleted -= OnMissionCompleted;
        GameEvents.InputActionTriggered -= OnInputAction;
    }

    private void Start()
    {
        _boat = FindObjectOfType<BoatController>();
        _supply = FindObjectOfType<SupplySystem>();

        if (photoIndicator != null) photoIndicator.SetActive(false);
        RefreshMissionList();
    }

    private void Update()
    {
        UpdateCompass();
        UpdateSupplyBars();
        UpdateTimer();
        UpdateWindArrow();
    }

    private void UpdateCompass()
    {
        if (_boat == null || compassNeedle == null) return;

        float heading = _boat.transform.eulerAngles.y;
        compassNeedle.localEulerAngles = new Vector3(0f, 0f, -heading);
    }

    private void UpdateWindArrow()
    {
        if (windArrow == null) return;

        WeatherState weather = WeatherSystem.Instance != null
            ? WeatherSystem.Instance.GetCurrentState()
            : default;

        windArrow.localEulerAngles = new Vector3(0f, 0f, -weather.windAngle);

        if (windSpeedText != null)
            windSpeedText.text = $"{weather.windSpeed:F1}";

        if (windDirectionText != null)
        {
            string dir = GetWindDirectionLabel(weather.windAngle);
            windDirectionText.text = dir;
        }
    }

    private string GetWindDirectionLabel(float angle)
    {
        if (angle >= 337.5f || angle < 22.5f) return "E";
        if (angle >= 22.5f && angle < 67.5f) return "NE";
        if (angle >= 67.5f && angle < 112.5f) return "N";
        if (angle >= 112.5f && angle < 157.5f) return "NW";
        if (angle >= 157.5f && angle < 202.5f) return "W";
        if (angle >= 202.5f && angle < 247.5f) return "SW";
        if (angle >= 247.5f && angle < 292.5f) return "S";
        return "SE";
    }

    private void UpdateSupplyBars()
    {
        if (_supply == null) return;

        float fuelPct = _supply.GetSupplyPercentage(SupplyType.Fuel);
        float foodPct = _supply.GetSupplyPercentage(SupplyType.Food);
        float filmPct = _supply.GetSupplyPercentage(SupplyType.Film);

        if (fuelBar != null)
        {
            fuelBar.fillAmount = fuelPct;
            fuelBar.color = GetSupplyColor(fuelPct);
        }
        if (foodBar != null)
        {
            foodBar.fillAmount = foodPct;
            foodBar.color = GetSupplyColor(foodPct);
        }

        if (fuelText != null) fuelText.text = $"{(fuelPct * 100):F0}%";
        if (foodText != null) foodText.text = $"{(foodPct * 100):F0}%";
        if (filmText != null) filmText.text = $"{_supply.Film}/{_supply.maxFilm}";
    }

    private Color GetSupplyColor(float pct)
    {
        if (pct > 0.6f) return SupplyWarnColors[0];
        if (pct > 0.3f) return SupplyWarnColors[1];
        if (pct > 0.1f) return SupplyWarnColors[2];
        return SupplyWarnColors[3];
    }

    private void UpdateTimer()
    {
        if (timerText == null || LevelManager.Instance == null) return;

        if (LevelManager.Instance.CurrentConfig != null && LevelManager.Instance.CurrentConfig.hasTimeLimit)
        {
            float remaining = LevelManager.Instance.CurrentConfig.timeLimit - LevelManager.Instance.LevelElapsedTime;
            if (remaining < 0) remaining = 0;
            int min = Mathf.FloorToInt(remaining / 60f);
            int sec = Mathf.FloorToInt(remaining % 60f);
            timerText.text = $"{min:D2}:{sec:D2}";

            if (remaining < 30f)
                timerText.color = Color.red;
            else
                timerText.color = Color.white;
        }
        else
        {
            float elapsed = LevelManager.Instance.LevelElapsedTime;
            int min = Mathf.FloorToInt(elapsed / 60f);
            int sec = Mathf.FloorToInt(elapsed % 60f);
            timerText.text = $"{min:D2}:{sec:D2}";
        }
    }

    private void OnWeatherChanged(WeatherType type, float windSpeed, float windAngle, float visibility)
    {
        int idx = (int)type;
        if (weatherTypeText != null)
            weatherTypeText.text = idx < WeatherLabels.Length ? WeatherLabels[idx] : type.ToString();
    }

    private void OnPhotoTargetInRange(string targetId)
    {
        if (photoIndicator != null) photoIndicator.SetActive(true);
        if (photoQualityText != null) photoQualityText.text = "按 F 拍照";
    }

    private void OnPhotoTargetOutOfRange(string targetId)
    {
        if (photoIndicator != null) photoIndicator.SetActive(false);
    }

    private void OnSupplyConsumed(SupplyType type, float amount)
    {
    }

    private void OnSupplyDepleted(SupplyType type)
    {
        GameEvents.TriggerAudioTriggerRequested("supply_low", 0.6f);
    }

    private void OnMissionCompleted(string missionId, int score)
    {
        RefreshMissionList();
    }

    private void OnInputAction(string action)
    {
    }

    private void RefreshMissionList()
    {
        if (missionListContainer == null || MissionManager.Instance == null) return;

        foreach (Transform child in missionListContainer)
        {
            Destroy(child.gameObject);
        }

        var missions = MissionManager.Instance.activeMissions;
        foreach (var mission in missions)
        {
            if (missionEntryPrefab == null) continue;

            var entry = Instantiate(missionEntryPrefab, missionListContainer);
            var texts = entry.GetComponentsInChildren<TMP_Text>();
            if (texts.Length >= 2)
            {
                texts[0].text = mission.missionName;
                var progress = MissionManager.Instance.GetProgress(mission.missionId);
                texts[1].text = progress != null && progress.isCompleted ? "✓" : "○";
            }
        }
    }
}
