using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class MapPanel : MonoBehaviour
{
    [SerializeField] private RectTransform mapContainer;
    [SerializeField] private RectTransform playerMarker;
    [SerializeField] private RectTransform windIndicator;
    [SerializeField] private TMP_Text positionText;
    [SerializeField] private TMP_Text headingText;
    [SerializeField] private Button closeButton;
    [SerializeField] private float mapScale = 0.1f;

    private BoatController _boat;
    private bool _uiBuilt;

    private void Start()
    {
        if (!_uiBuilt) BuildUI();

        _boat = FindObjectOfType<BoatController>();

        if (closeButton != null)
            closeButton.onClick.AddListener(OnCloseClicked);
    }

    private void BuildUI()
    {
        _uiBuilt = true;

        var panel = UIFactory.CreatePanel(transform, "MapPanel", false);
        var panelRt = panel.GetComponent<RectTransform>();
        panelRt.anchorMin = Vector2.zero;
        panelRt.anchorMax = Vector2.one;
        panelRt.sizeDelta = Vector2.zero;

        if (mapContainer == null)
        {
            var mapArea = new GameObject("MapContainer");
            mapArea.transform.SetParent(panel.transform, false);
            mapContainer = mapArea.AddComponent<RectTransform>();
            mapContainer.anchorMin = Vector2.zero;
            mapContainer.anchorMax = Vector2.one;
            mapContainer.sizeDelta = Vector2.zero;
        }

        var playerGo = new GameObject("PlayerMarker");
        playerGo.transform.SetParent(mapContainer, false);
        var playerRt = playerGo.AddComponent<RectTransform>();
        playerRt.sizeDelta = new Vector2(20f, 20f);
        var playerImg = playerGo.AddComponent<Image>();
        playerImg.color = Color.white;
        playerMarker = playerRt;

        var windGo = new GameObject("WindIndicator");
        windGo.transform.SetParent(mapContainer, false);
        var windRt = windGo.AddComponent<RectTransform>();
        windRt.sizeDelta = new Vector2(16f, 16f);
        var windImg = windGo.AddComponent<Image>();
        windImg.color = Color.cyan;
        windIndicator = windRt;

        var infoArea = new GameObject("InfoArea");
        infoArea.transform.SetParent(panel.transform, false);
        var infoRt = infoArea.AddComponent<RectTransform>();
        infoRt.anchorMin = new Vector2(0f, 0f);
        infoRt.anchorMax = new Vector2(0.5f, 0.12f);
        infoRt.sizeDelta = new Vector2(-20f, 0f);
        infoRt.anchoredPosition = new Vector2(10f, 10f);

        var infoLayout = infoArea.AddComponent<VerticalLayoutGroup>();
        infoLayout.spacing = 4f;
        infoLayout.childAlignment = TextAnchor.LowerLeft;
        infoLayout.childControlWidth = false;
        infoLayout.childControlHeight = false;
        infoLayout.childForceExpandWidth = false;
        infoLayout.childForceExpandHeight = false;

        positionText = UIFactory.CreateLabel(infoArea.transform, "PositionText", "位置: (0, 0)", 16, Color.white);
        headingText = UIFactory.CreateLabel(infoArea.transform, "HeadingText", "航向: 0° E", 16, Color.white);

        var btnArea = new GameObject("BtnArea");
        btnArea.transform.SetParent(panel.transform, false);
        var btnRt = btnArea.AddComponent<RectTransform>();
        btnRt.anchorMin = new Vector2(0.5f, 0f);
        btnRt.anchorMax = new Vector2(1f, 0.12f);
        btnRt.sizeDelta = new Vector2(-20f, 0f);
        btnRt.anchoredPosition = new Vector2(-10f, 10f);

        var btnLayout = btnArea.AddComponent<HorizontalLayoutGroup>();
        btnLayout.childAlignment = TextAnchor.LowerRight;
        btnLayout.childControlWidth = false;
        btnLayout.childControlHeight = false;
        btnLayout.childForceExpandWidth = false;
        btnLayout.childForceExpandHeight = false;

        closeButton = UIFactory.CreateSmallButton(btnArea.transform, "CloseButton", "关闭", 120f, 40f);
    }

    private void Update()
    {
        UpdatePlayerMarker();
        UpdateWindIndicator();
    }

    private void UpdatePlayerMarker()
    {
        if (_boat == null || playerMarker == null) return;

        Vector2 pos = new Vector2(_boat.transform.position.x, _boat.transform.position.z);
        playerMarker.anchoredPosition = pos * mapScale;

        float heading = _boat.transform.eulerAngles.y;
        playerMarker.localEulerAngles = new Vector3(0f, 0f, -heading);

        if (positionText != null)
            positionText.text = $"位置: ({pos.x:F0}, {pos.y:F0})";

        if (headingText != null)
        {
            string dir = GetDirectionLabel(heading);
            headingText.text = $"航向: {heading:F0}° {dir}";
        }
    }

    private void UpdateWindIndicator()
    {
        if (windIndicator == null || WeatherSystem.Instance == null) return;

        WeatherState weather = WeatherSystem.Instance.GetCurrentState();
        windIndicator.localEulerAngles = new Vector3(0f, 0f, -weather.windAngle);
    }

    private string GetDirectionLabel(float angle)
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

    private void OnCloseClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_back", 0.5f);

        if (UIStateManager.Instance != null)
            UIStateManager.Instance.PopState();
    }
}
