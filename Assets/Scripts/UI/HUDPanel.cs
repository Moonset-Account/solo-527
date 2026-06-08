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
    private bool _uiBuilt;

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
        if (!_uiBuilt) BuildUI();

        _boat = FindObjectOfType<BoatController>();
        _supply = FindObjectOfType<SupplySystem>();

        if (photoIndicator != null) photoIndicator.SetActive(false);
        RefreshMissionList();
    }

    private void BuildUI()
    {
        _uiBuilt = true;

        var panel = UIFactory.CreatePanel(transform, "HUDPanel", false);
        var panelRt = panel.GetComponent<RectTransform>();
        panelRt.anchorMin = Vector2.zero;
        panelRt.anchorMax = Vector2.one;
        panelRt.sizeDelta = Vector2.zero;

        var topLeftArea = new GameObject("TopLeftArea");
        topLeftArea.transform.SetParent(panel.transform, false);
        var topLeftRt = topLeftArea.AddComponent<RectTransform>();
        topLeftRt.anchorMin = new Vector2(0f, 0.7f);
        topLeftRt.anchorMax = new Vector2(0.35f, 1f);
        topLeftRt.sizeDelta = new Vector2(-20f, -20f);
        topLeftRt.anchoredPosition = new Vector2(10f, -10f);

        var topLeftLayout = topLeftArea.AddComponent<VerticalLayoutGroup>();
        topLeftLayout.spacing = 4f;
        topLeftLayout.childAlignment = TextAnchor.UpperLeft;
        topLeftLayout.childControlWidth = false;
        topLeftLayout.childControlHeight = false;
        topLeftLayout.childForceExpandWidth = false;
        topLeftLayout.childForceExpandHeight = false;

        fuelBar = UIFactory.CreateBar(topLeftArea.transform, "FuelBar", new Color(0.2f, 0.8f, 0.3f), 200f, 24f);
        foodBar = UIFactory.CreateBar(topLeftArea.transform, "FoodBar", new Color(1f, 0.6f, 0.2f), 200f, 24f);
        fuelText = UIFactory.CreateLabel(topLeftArea.transform, "FuelText", "100%", 16, Color.white);
        foodText = UIFactory.CreateLabel(topLeftArea.transform, "FoodText", "100%", 16, Color.white);
        filmText = UIFactory.CreateLabel(topLeftArea.transform, "FilmText", "0/0", 16, new Color(0.3f, 0.7f, 1f));

        var topCenterArea = new GameObject("TopCenterArea");
        topCenterArea.transform.SetParent(panel.transform, false);
        var topCenterRt = topCenterArea.AddComponent<RectTransform>();
        topCenterRt.anchorMin = new Vector2(0.35f, 0.7f);
        topCenterRt.anchorMax = new Vector2(0.65f, 1f);
        topCenterRt.sizeDelta = new Vector2(0f, -20f);
        topCenterRt.anchoredPosition = new Vector2(0f, -10f);

        var topCenterLayout = topCenterArea.AddComponent<VerticalLayoutGroup>();
        topCenterLayout.spacing = 4f;
        topCenterLayout.childAlignment = TextAnchor.MiddleCenter;
        topCenterLayout.childControlWidth = false;
        topCenterLayout.childControlHeight = false;
        topCenterLayout.childForceExpandWidth = false;
        topCenterLayout.childForceExpandHeight = false;

        var needleGo = new GameObject("CompassNeedle");
        needleGo.transform.SetParent(topCenterArea.transform, false);
        var needleRt = needleGo.AddComponent<RectTransform>();
        needleRt.sizeDelta = new Vector2(60f, 60f);
        var needleImg = needleGo.AddComponent<Image>();
        needleImg.color = Color.red;
        compassNeedle = needleRt;

        windDirectionText = UIFactory.CreateLabel(topCenterArea.transform, "WindDirectionText", "E", 16, Color.white);
        windSpeedText = UIFactory.CreateLabel(topCenterArea.transform, "WindSpeedText", "0.0", 16, Color.white);

        var topRightArea = new GameObject("TopRightArea");
        topRightArea.transform.SetParent(panel.transform, false);
        var topRightRt = topRightArea.AddComponent<RectTransform>();
        topRightRt.anchorMin = new Vector2(0.65f, 0.7f);
        topRightRt.anchorMax = new Vector2(1f, 1f);
        topRightRt.sizeDelta = new Vector2(-20f, -20f);
        topRightRt.anchoredPosition = new Vector2(-10f, -10f);

        weatherTypeText = UIFactory.CreateLabel(topRightArea.transform, "WeatherTypeText", "晴", 20, Color.white);

        var wpGo = new GameObject("WeatherPanel");
        wpGo.transform.SetParent(topRightArea.transform, false);
        var wpRt = wpGo.AddComponent<RectTransform>();
        wpRt.sizeDelta = new Vector2(80f, 80f);
        weatherPanel = wpRt;

        var wIconGo = new GameObject("WeatherIcon");
        wIconGo.transform.SetParent(wpGo.transform, false);
        var wIconRt = wIconGo.AddComponent<RectTransform>();
        wIconRt.anchorMin = Vector2.zero;
        wIconRt.anchorMax = Vector2.one;
        wIconRt.sizeDelta = Vector2.zero;
        weatherIcon = wIconGo.AddComponent<Image>();
        weatherIcon.color = Color.white;

        var leftArea = new GameObject("LeftArea");
        leftArea.transform.SetParent(panel.transform, false);
        var leftRt = leftArea.AddComponent<RectTransform>();
        leftRt.anchorMin = new Vector2(0f, 0.15f);
        leftRt.anchorMax = new Vector2(0.3f, 0.7f);
        leftRt.sizeDelta = new Vector2(-20f, 0f);
        leftRt.anchoredPosition = new Vector2(10f, 0f);

        var leftLayout = leftArea.AddComponent<VerticalLayoutGroup>();
        leftLayout.spacing = 6f;
        leftLayout.childAlignment = TextAnchor.UpperCenter;
        leftLayout.childControlWidth = false;
        leftLayout.childControlHeight = false;
        leftLayout.childForceExpandWidth = false;
        leftLayout.childForceExpandHeight = false;

        var missionContainerRt = UIFactory.CreateContainer(leftArea.transform, "MissionListContainer");
        missionListContainer = missionContainerRt;
        timerText = UIFactory.CreateLabel(leftArea.transform, "TimerText", "00:00", 20, Color.white);

        var bottomCenterArea = new GameObject("BottomCenterArea");
        bottomCenterArea.transform.SetParent(panel.transform, false);
        var bcRt = bottomCenterArea.AddComponent<RectTransform>();
        bcRt.anchorMin = new Vector2(0.3f, 0f);
        bcRt.anchorMax = new Vector2(0.7f, 0.15f);
        bcRt.sizeDelta = Vector2.zero;

        var photoGo = new GameObject("PhotoIndicator");
        photoGo.transform.SetParent(bcRt, false);
        var photoRt = photoGo.AddComponent<RectTransform>();
        photoRt.anchorMin = Vector2.zero;
        photoRt.anchorMax = Vector2.one;
        photoRt.sizeDelta = Vector2.zero;
        var photoImg = photoGo.AddComponent<Image>();
        photoImg.color = new Color(0.2f, 0.8f, 0.3f, 0.5f);
        photoIndicator = photoGo;

        photoQualityText = UIFactory.CreateLabel(photoGo.transform, "PhotoQualityText", "按 F 拍照", 18, Color.white);
        var pqRt = photoQualityText.GetComponent<RectTransform>();
        pqRt.anchorMin = Vector2.zero;
        pqRt.anchorMax = Vector2.one;
        pqRt.sizeDelta = Vector2.zero;

        var reticleGo = new GameObject("PhotoReticle");
        reticleGo.transform.SetParent(photoGo.transform, false);
        var reticleRt = reticleGo.AddComponent<RectTransform>();
        reticleRt.anchorMin = Vector2.zero;
        reticleRt.anchorMax = Vector2.one;
        reticleRt.sizeDelta = Vector2.zero;
        photoReticle = reticleGo.AddComponent<Image>();
        photoReticle.color = new Color(1f, 1f, 1f, 0.3f);

        var bottomArea = new GameObject("BottomArea");
        bottomArea.transform.SetParent(panel.transform, false);
        var bottomRt = bottomArea.AddComponent<RectTransform>();
        bottomRt.anchorMin = new Vector2(0.7f, 0f);
        bottomRt.anchorMax = new Vector2(1f, 0.15f);
        bottomRt.sizeDelta = new Vector2(-20f, 0f);
        bottomRt.anchoredPosition = new Vector2(-10f, 0f);

        var arrowGo = new GameObject("WindArrow");
        arrowGo.transform.SetParent(bottomArea.transform, false);
        var arrowRt = arrowGo.AddComponent<RectTransform>();
        arrowRt.sizeDelta = new Vector2(40f, 40f);
        var arrowImg = arrowGo.AddComponent<Image>();
        arrowImg.color = Color.cyan;
        windArrow = arrowRt;
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
