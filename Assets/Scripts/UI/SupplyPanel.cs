using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class SupplyPanel : MonoBehaviour
{
    [SerializeField] private Image fuelBar;
    [SerializeField] private Image foodBar;
    [SerializeField] private TMP_Text fuelCountText;
    [SerializeField] private TMP_Text foodCountText;
    [SerializeField] private TMP_Text filmCountText;
    [SerializeField] private TMP_Text dockStatusText;
    [SerializeField] private Button closeButton;

    private SupplySystem _supply;
    private bool _uiBuilt;

    private void Start()
    {
        if (!_uiBuilt) BuildUI();

        _supply = FindObjectOfType<SupplySystem>();

        if (closeButton != null)
            closeButton.onClick.AddListener(OnCloseClicked);
    }

    private void BuildUI()
    {
        _uiBuilt = true;

        var panel = UIFactory.CreatePanel(transform, "SupplyPanel", false);
        var panelRt = panel.GetComponent<RectTransform>();
        panelRt.anchorMin = new Vector2(0.5f, 0.5f);
        panelRt.anchorMax = new Vector2(0.5f, 0.5f);
        panelRt.pivot = new Vector2(0.5f, 0.5f);
        panelRt.sizeDelta = new Vector2(400f, 500f);
        panelRt.anchoredPosition = Vector2.zero;

        var container = UIFactory.CreateContainer(panel.transform, "SupplyContainer");
        var containerRt = container.GetComponent<RectTransform>();
        containerRt.anchorMin = Vector2.zero;
        containerRt.anchorMax = Vector2.one;
        containerRt.sizeDelta = Vector2.zero;

        UIFactory.CreateLabel(container, "FuelLabel", "燃料", 22, new Color(0.2f, 0.8f, 0.3f));
        fuelBar = UIFactory.CreateBar(container, "FuelBar", new Color(0.2f, 0.8f, 0.3f), 300f, 24f);
        fuelCountText = UIFactory.CreateLabel(container, "FuelCountText", "0/0", 18, Color.white);

        UIFactory.CreateLabel(container, "FoodLabel", "食物", 22, new Color(1f, 0.6f, 0.2f));
        foodBar = UIFactory.CreateBar(container, "FoodBar", new Color(1f, 0.6f, 0.2f), 300f, 24f);
        foodCountText = UIFactory.CreateLabel(container, "FoodCountText", "0/0", 18, Color.white);

        UIFactory.CreateLabel(container, "FilmLabel", "胶卷", 22, new Color(0.3f, 0.7f, 1f));
        filmCountText = UIFactory.CreateLabel(container, "FilmCountText", "0/0", 18, new Color(0.3f, 0.7f, 1f));

        dockStatusText = UIFactory.CreateLabel(container, "DockStatusText", "⚪ 不在补给范围内", 18, Color.gray);

        closeButton = UIFactory.CreateButton(container, "CloseButton", "关闭", 200f, 50f);
    }

    private void Update()
    {
        if (_supply == null) return;

        float fuelPct = _supply.GetSupplyPercentage(SupplyType.Fuel);
        float foodPct = _supply.GetSupplyPercentage(SupplyType.Food);
        float filmPct = _supply.GetSupplyPercentage(SupplyType.Film);

        if (fuelBar != null)
        {
            fuelBar.fillAmount = fuelPct;
            fuelBar.color = GetBarColor(fuelPct);
        }

        if (foodBar != null)
        {
            foodBar.fillAmount = foodPct;
            foodBar.color = GetBarColor(foodPct);
        }

        if (fuelCountText != null)
            fuelCountText.text = $"{_supply.Fuel:F0}/{_supply.maxFuel:F0}";

        if (foodCountText != null)
            foodCountText.text = $"{_supply.Food:F0}/{_supply.maxFood:F0}";

        if (filmCountText != null)
            filmCountText.text = $"{_supply.Film}/{_supply.maxFilm}";

        UpdateDockStatus();
    }

    private void UpdateDockStatus()
    {
        if (dockStatusText == null || _supply == null || _supply.boatTransform == null) return;

        bool nearDock = false;
        Vector2 boatPos2D = new Vector2(_supply.boatTransform.position.x, _supply.boatTransform.position.z);

        for (int i = 0; i < _supply.supplyDocks.Count; i++)
        {
            if (_supply.supplyDocks[i] == null) continue;
            Vector2 dockPos2D = new Vector2(_supply.supplyDocks[i].position.x, _supply.supplyDocks[i].position.z);
            if (Vector2.Distance(boatPos2D, dockPos2D) <= _supply.dockDetectionRadius)
            {
                nearDock = true;
                break;
            }
        }

        dockStatusText.text = nearDock ? "🟢 补给中..." : "⚪ 不在补给范围内";
        dockStatusText.color = nearDock ? Color.green : Color.gray;
    }

    private Color GetBarColor(float pct)
    {
        if (pct > 0.6f) return Color.green;
        if (pct > 0.3f) return Color.yellow;
        return Color.red;
    }

    private void OnCloseClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_back", 0.5f);

        if (UIStateManager.Instance != null)
            UIStateManager.Instance.PopState();
    }
}
