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

    private void Start()
    {
        _boat = FindObjectOfType<BoatController>();

        if (closeButton != null)
            closeButton.onClick.AddListener(OnCloseClicked);
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
