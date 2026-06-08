using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;
using DecorMatch3.Gameplay.Decoration;

namespace DecorMatch3.UI
{
    public class ColorPanelView : UIViewBase
    {
        public enum ColorTarget
        {
            Wall,
            Floor,
            Furniture
        }

        [Header("Target")]
        [SerializeField] private ColorTarget currentTarget = ColorTarget.Wall;
        [SerializeField] private string targetSlotId;

        [Header("Filters")]
        [SerializeField] private Transform materialTabsContainer;
        [SerializeField] private GameObject materialTabPrefab;
        [SerializeField] private MaterialType currentMaterialFilter = MaterialType.Paint;

        [Header("Colors Grid")]
        [SerializeField] private Transform colorsContainer;
        [SerializeField] private GameObject colorSwatchPrefab;
        [SerializeField] private ScrollRect colorsScrollRect;

        [Header("Info Panel")]
        [SerializeField] private TextMeshProUGUI selectedNameText;
        [SerializeField] private TextMeshProUGUI selectedStyleText;
        [SerializeField] private TextMeshProUGUI selectedCostText;
        [SerializeField] private TextMeshProUGUI selectedMaterialText;
        [SerializeField] private TextMeshProUGUI selectedQualityText;
        [SerializeField] private Image selectedPreviewImage;
        [SerializeField] private TextMeshProUGUI requiredMaterialsText;
        [SerializeField] private Button applyButton;

        [Header("Buttons")]
        [SerializeField] private Button closeButton;

        private ColorOption _selectedColor;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.ColorPanel;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (closeButton != null)
                closeButton.onClick.AddListener(OnCloseClicked);
            if (applyButton != null)
                applyButton.onClick.AddListener(OnApplyClicked);
        }

        public override void Open()
        {
            base.Open();
            InitializeMaterialTabs();
            RefreshColorSwatches();
        }

        public void SetTarget(ColorTarget target)
        {
            currentTarget = target;
            SetDefaultMaterialFilter();
        }

        public void SetSlotId(string slotId)
        {
            targetSlotId = slotId;
        }

        private void SetDefaultMaterialFilter()
        {
            switch (currentTarget)
            {
                case ColorTarget.Wall:
                    currentMaterialFilter = MaterialType.Paint;
                    break;
                case ColorTarget.Floor:
                    currentMaterialFilter = MaterialType.Wood;
                    break;
                case ColorTarget.Furniture:
                    currentMaterialFilter = MaterialType.Fabric;
                    break;
            }
        }

        private void InitializeMaterialTabs()
        {
            if (materialTabsContainer == null) return;

            foreach (Transform child in materialTabsContainer)
                Destroy(child.gameObject);

            MaterialType[] materials = GetRelevantMaterials();
            foreach (var mat in materials)
            {
                if (materialTabPrefab == null) continue;

                GameObject tabGO = Instantiate(materialTabPrefab, materialTabsContainer);
                Button tabBtn = tabGO.GetComponent<Button>();
                TextMeshProUGUI tabText = tabGO.GetComponentInChildren<TextMeshProUGUI>();

                if (tabText != null)
                    tabText.text = GetMaterialName(mat);

                bool isSelected = mat == currentMaterialFilter;
                tabText.color = isSelected ? Color.white : Color.gray;

                MaterialType capturedMat = mat;
                if (tabBtn != null)
                {
                    tabBtn.onClick.AddListener(() =>
                    {
                        AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
                        currentMaterialFilter = capturedMat;
                        InitializeMaterialTabs();
                        RefreshColorSwatches();
                    });
                }
            }
        }

        private MaterialType[] GetRelevantMaterials()
        {
            switch (currentTarget)
            {
                case ColorTarget.Wall:
                    return new MaterialType[] { MaterialType.Paint, MaterialType.Wallpaper };
                case ColorTarget.Floor:
                    return new MaterialType[] { MaterialType.Wood, MaterialType.Tile, MaterialType.Fabric };
                case ColorTarget.Furniture:
                    return new MaterialType[] { MaterialType.Fabric, MaterialType.Wood, MaterialType.Metal, MaterialType.Paint };
                default:
                    return new MaterialType[] { MaterialType.Paint };
            }
        }

        private void RefreshColorSwatches()
        {
            if (colorsContainer == null) return;

            foreach (Transform child in colorsContainer)
                Destroy(child.gameObject);

            _selectedColor = null;
            UpdateInfoPanel();

            List<ColorOption> colors = LevelManager.Instance.GetColorOptionsByMaterial(currentMaterialFilter);
            foreach (var color in colors)
            {
                if (colorSwatchPrefab == null) continue;

                GameObject swatchGO = Instantiate(colorSwatchPrefab, colorsContainer);
                ColorSwatchCard card = swatchGO.GetComponent<ColorSwatchCard>();
                if (card == null) card = swatchGO.AddComponent<ColorSwatchCard>();

                card.SetColor(color);
                card.OnSelected += HandleColorSelected;
            }

            if (colorsScrollRect != null)
            {
                colorsScrollRect.normalizedPosition = new Vector2(0, 1);
            }
        }

        private void HandleColorSelected(ColorOption color)
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            _selectedColor = color;
            UpdateInfoPanel();
        }

        private void UpdateInfoPanel()
        {
            if (_selectedColor == null)
            {
                if (selectedNameText != null)
                    selectedNameText.text = "请选择颜色";
                if (selectedStyleText != null)
                    selectedStyleText.text = "-";
                if (selectedCostText != null)
                    selectedCostText.text = "-";
                if (selectedMaterialText != null)
                    selectedMaterialText.text = "-";
                if (selectedQualityText != null)
                    selectedQualityText.text = "-";
                if (selectedPreviewImage != null)
                    selectedPreviewImage.color = Color.white;
                if (requiredMaterialsText != null)
                    requiredMaterialsText.text = "-";
                if (applyButton != null)
                    applyButton.interactable = false;
                return;
            }

            if (selectedNameText != null)
                selectedNameText.text = _selectedColor.ColorName;
            if (selectedStyleText != null)
                selectedStyleText.text = GetStyleName(_selectedColor.Style);
            if (selectedCostText != null)
                selectedCostText.text = _selectedColor.Cost.ToString();
            if (selectedMaterialText != null)
                selectedMaterialText.text = GetMaterialName(_selectedColor.MaterialType);
            if (selectedQualityText != null)
                selectedQualityText.text = $"品质: {new string('★', _selectedColor.QualityRating)}";
            if (selectedPreviewImage != null)
                selectedPreviewImage.color = _selectedColor.HexColor;

            int materialNeeded = GetMaterialAmountNeeded();
            int materialAvailable = SaveManager.Instance?.GetMaterialAmount(_selectedColor.MaterialType) ?? 0;
            int coinsAvailable = SaveManager.Instance?.CurrentSave.Progress.Coins ?? 0;

            if (requiredMaterialsText != null)
            {
                requiredMaterialsText.text = $"需要 {GetMaterialName(_selectedColor.MaterialType)}: {materialNeeded}/{materialAvailable}";
                requiredMaterialsText.color = materialAvailable >= materialNeeded
                    ? new Color(0.3f, 0.85f, 0.4f)
                    : new Color(0.95f, 0.3f, 0.3f);
            }

            if (applyButton != null)
            {
                bool hasMaterials = materialAvailable >= materialNeeded;
                bool hasCoins = coinsAvailable >= _selectedColor.Cost;
                bool validTarget = currentTarget != ColorTarget.Furniture || !string.IsNullOrEmpty(targetSlotId);
                applyButton.interactable = hasMaterials && hasCoins && validTarget;
            }
        }

        private int GetMaterialAmountNeeded()
        {
            switch (currentTarget)
            {
                case ColorTarget.Wall: return 5;
                case ColorTarget.Floor: return 8;
                case ColorTarget.Furniture: return 3;
                default: return 1;
            }
        }

        private void OnApplyClicked()
        {
            if (_selectedColor == null) return;

            AudioManager.Instance?.PlaySFX(SFXType.DecorationPlace);
            bool success = false;

            switch (currentTarget)
            {
                case ColorTarget.Wall:
                    success = DecorationSystem.Instance.ApplyWallColor(_selectedColor);
                    break;
                case ColorTarget.Floor:
                    success = DecorationSystem.Instance.ApplyFloorColor(_selectedColor);
                    break;
                case ColorTarget.Furniture:
                    if (!string.IsNullOrEmpty(targetSlotId))
                    {
                        success = DecorationSystem.Instance.ApplyFurnitureColor(targetSlotId, _selectedColor);
                    }
                    break;
            }

            if (success)
            {
                Close();
                UIManager.Instance.OpenView(UIView.DecorationHUD, false, true);
            }
            else
            {
                AudioManager.Instance?.PlaySFX(SFXType.Error);
            }
        }

        private void OnCloseClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            UIManager.Instance.OpenView(UIView.DecorationHUD, false, true);
        }

        private string GetMaterialName(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Paint: return "油漆";
                case MaterialType.Fabric: return "布料";
                case MaterialType.Wood: return "木材";
                case MaterialType.Metal: return "金属";
                case MaterialType.Tile: return "瓷砖";
                case MaterialType.Wallpaper: return "壁纸";
                default: return type.ToString();
            }
        }

        private string GetStyleName(ColorStyle style)
        {
            switch (style)
            {
                case ColorStyle.Warm: return "暖色调";
                case ColorStyle.Cool: return "冷色调";
                case ColorStyle.Neutral: return "中性色";
                case ColorStyle.Vibrant: return "鲜艳色";
                case ColorStyle.Pastel: return "柔和色";
                case ColorStyle.Earthy: return "大地色";
                default: return style.ToString();
            }
        }

        private void OnDestroy()
        {
            if (closeButton != null)
                closeButton.onClick.RemoveListener(OnCloseClicked);
            if (applyButton != null)
                applyButton.onClick.RemoveListener(OnApplyClicked);
        }
    }

    public class ColorSwatchCard : MonoBehaviour
    {
        [SerializeField] private Image colorImage;
        [SerializeField] private TextMeshProUGUI colorNameText;
        [SerializeField] private TextMeshProUGUI costText;
        [SerializeField] private Button selectButton;
        [SerializeField] private GameObject selectedIndicator;

        private ColorOption _color;

        public event System.Action<ColorOption> OnSelected;

        public void SetColor(ColorOption color)
        {
            _color = color;

            if (colorImage != null)
                colorImage.color = color.HexColor;
            if (colorNameText != null)
                colorNameText.text = color.ColorName;
            if (costText != null)
                costText.text = $"{color.Cost}";

            int coins = SaveManager.Instance?.CurrentSave.Progress.Coins ?? 0;
            if (costText != null)
                costText.color = coins >= color.Cost ? new Color(0.95f, 0.85f, 0.3f) : new Color(0.9f, 0.3f, 0.3f);

            if (selectedIndicator != null)
                selectedIndicator.SetActive(false);

            if (selectButton != null)
            {
                selectButton.onClick.RemoveAllListeners();
                selectButton.onClick.AddListener(() =>
                {
                    if (selectedIndicator != null)
                        selectedIndicator.SetActive(true);
                    OnSelected?.Invoke(_color);
                });
            }
        }
    }
}
