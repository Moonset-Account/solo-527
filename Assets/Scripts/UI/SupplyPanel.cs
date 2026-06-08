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

    private void Start()
    {
        _supply = FindObjectOfType<SupplySystem>();

        if (closeButton != null)
            closeButton.onClick.AddListener(OnCloseClicked);
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
