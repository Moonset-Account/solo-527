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
    public class FurniturePanelView : UIViewBase
    {
        [Header("Category Tabs")]
        [SerializeField] private Transform categoriesContainer;
        [SerializeField] private GameObject categoryTabPrefab;
        [SerializeField] private FurnitureCategory currentCategory;

        [Header("Items Grid")]
        [SerializeField] private Transform itemsContainer;
        [SerializeField] private GameObject furnitureItemPrefab;
        [SerializeField] private ScrollRect itemsScrollRect;

        [Header("Info Panel")]
        [SerializeField] private TextMeshProUGUI selectedNameText;
        [SerializeField] private TextMeshProUGUI selectedDescText;
        [SerializeField] private TextMeshProUGUI selectedCostText;
        [SerializeField] private TextMeshProUGUI selectedQualityText;
        [SerializeField] private TextMeshProUGUI selectedStyleText;
        [SerializeField] private Image selectedPreviewImage;
        [SerializeField] private Button placeButton;

        [Header("Buttons")]
        [SerializeField] private Button closeButton;

        private FurnitureItem _selectedItem;
        private DecorationSlot _targetSlot;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.FurniturePanel;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (closeButton != null)
                closeButton.onClick.AddListener(OnCloseClicked);
            if (placeButton != null)
                placeButton.onClick.AddListener(OnPlaceClicked);

            EventBus.Subscribe<DecorationSlotClickedEvent>(OnSlotClicked);
        }

        public override void Open()
        {
            base.Open();
            InitializeCategories();
            SetTargetSlotFromActive();
        }

        private void OnSlotClicked(DecorationSlotClickedEvent e)
        {
            _targetSlot = e.Slot;
            currentCategory = e.Slot.AcceptedCategory;
        }

        private void SetTargetSlotFromActive()
        {
            var emptySlots = DecorationSystem.Instance?.GetEmptySlots();
            if (emptySlots != null && emptySlots.Count > 0)
            {
                if (_targetSlot == null || DecorationSystem.Instance.IsSlotEmpty(_targetSlot.SlotId))
                {
                    _targetSlot = emptySlots[0];
                    currentCategory = _targetSlot.AcceptedCategory;
                }
            }
            InitializeCategories();
            RefreshItems();
        }

        private void InitializeCategories()
        {
            if (categoriesContainer == null) return;

            foreach (Transform child in categoriesContainer)
                Destroy(child.gameObject);

            FurnitureCategory[] categories = GetRelevantCategories();
            foreach (var cat in categories)
            {
                if (categoryTabPrefab == null) continue;

                GameObject tabGO = Instantiate(categoryTabPrefab, categoriesContainer);
                Button tabBtn = tabGO.GetComponent<Button>();
                TextMeshProUGUI tabText = tabGO.GetComponentInChildren<TextMeshProUGUI>();

                if (tabText != null)
                    tabText.text = GetCategoryName(cat);

                bool isSelected = cat == currentCategory;
                tabText.color = isSelected ? Color.white : Color.gray;

                FurnitureCategory capturedCat = cat;
                if (tabBtn != null)
                {
                    tabBtn.onClick.AddListener(() =>
                    {
                        AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
                        currentCategory = capturedCat;
                        InitializeCategories();
                        RefreshItems();
                    });
                }
            }
        }

        private FurnitureCategory[] GetRelevantCategories()
        {
            if (_targetSlot != null)
            {
                return new FurnitureCategory[] { _targetSlot.AcceptedCategory };
            }

            return new FurnitureCategory[]
            {
                FurnitureCategory.Sofa, FurnitureCategory.Table, FurnitureCategory.Chair,
                FurnitureCategory.Bed, FurnitureCategory.Cabinet, FurnitureCategory.Lamp,
                FurnitureCategory.Rug, FurnitureCategory.Decoration
            };
        }

        private void RefreshItems()
        {
            if (itemsContainer == null) return;

            foreach (Transform child in itemsContainer)
                Destroy(child.gameObject);

            _selectedItem = null;
            UpdateInfoPanel();

            List<FurnitureItem> items = LevelManager.Instance.GetFurnitureByCategory(currentCategory);
            foreach (var item in items)
            {
                if (furnitureItemPrefab == null) continue;

                GameObject itemGO = Instantiate(furnitureItemPrefab, itemsContainer);
                FurnitureItemCard card = itemGO.GetComponent<FurnitureItemCard>();
                if (card == null) card = itemGO.AddComponent<FurnitureItemCard>();

                card.SetItem(item);
                card.OnSelected += HandleItemSelected;
            }

            if (itemsScrollRect != null)
            {
                itemsScrollRect.normalizedPosition = new Vector2(0, 1);
            }
        }

        private void HandleItemSelected(FurnitureItem item)
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            _selectedItem = item;
            UpdateInfoPanel();
        }

        private void UpdateInfoPanel()
        {
            if (_selectedItem == null)
            {
                if (selectedNameText != null)
                    selectedNameText.text = "请选择家具";
                if (selectedDescText != null)
                    selectedDescText.text = "";
                if (selectedCostText != null)
                    selectedCostText.text = "-";
                if (selectedQualityText != null)
                    selectedQualityText.text = "-";
                if (selectedStyleText != null)
                    selectedStyleText.text = "-";
                if (placeButton != null)
                    placeButton.interactable = false;
                return;
            }

            if (selectedNameText != null)
                selectedNameText.text = _selectedItem.Name;
            if (selectedDescText != null)
                selectedDescText.text = _selectedItem.Description;
            if (selectedCostText != null)
                selectedCostText.text = _selectedItem.Cost.ToString();
            if (selectedQualityText != null)
                selectedQualityText.text = $"品质: {new string('★', _selectedItem.QualityRating)}";
            if (selectedStyleText != null)
                selectedStyleText.text = GetStyleName(_selectedItem.PrimaryColorStyle);
            if (selectedPreviewImage != null)
                selectedPreviewImage.color = Color.white;

            if (placeButton != null)
            {
                int coins = SaveManager.Instance?.CurrentSave.Progress.Coins ?? 0;
                bool canAfford = coins >= _selectedItem.Cost;
                bool hasSlot = _targetSlot != null || DecorationSystem.Instance.GetEmptySlots().Count > 0;
                placeButton.interactable = canAfford && hasSlot;
            }
        }

        private void OnPlaceClicked()
        {
            if (_selectedItem == null) return;

            AudioManager.Instance?.PlaySFX(SFXType.DecorationPlace);

            string slotId = _targetSlot?.SlotId;
            if (string.IsNullOrEmpty(slotId))
            {
                var emptySlots = DecorationSystem.Instance.GetEmptySlots();
                foreach (var slot in emptySlots)
                {
                    if (slot.AcceptedCategory == currentCategory)
                    {
                        slotId = slot.SlotId;
                        break;
                    }
                }
            }

            if (!string.IsNullOrEmpty(slotId))
            {
                bool placed = DecorationSystem.Instance.PlaceFurniture(slotId, _selectedItem);
                if (placed)
                {
                    Close();
                    UIManager.Instance.OpenView(UIView.DecorationHUD);
                }
            }
            else
            {
                EventBus.Publish(new InsufficientFundsEvent
                {
                    Required = _selectedItem.Cost,
                    Current = SaveManager.Instance?.CurrentSave.Progress.Coins ?? 0
                });
            }
        }

        private void OnCloseClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            UIManager.Instance.OpenView(UIView.DecorationHUD, false, true);
        }

        private string GetCategoryName(FurnitureCategory cat)
        {
            switch (cat)
            {
                case FurnitureCategory.Sofa: return "沙发";
                case FurnitureCategory.Table: return "桌子";
                case FurnitureCategory.Chair: return "椅子";
                case FurnitureCategory.Bed: return "床";
                case FurnitureCategory.Cabinet: return "柜子";
                case FurnitureCategory.Lamp: return "灯具";
                case FurnitureCategory.Rug: return "地毯";
                case FurnitureCategory.Decoration: return "装饰";
                default: return cat.ToString();
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
            if (placeButton != null)
                placeButton.onClick.RemoveListener(OnPlaceClicked);
            EventBus.Unsubscribe<DecorationSlotClickedEvent>(OnSlotClicked);
        }
    }

    public class FurnitureItemCard : MonoBehaviour
    {
        [SerializeField] private Image itemIcon;
        [SerializeField] private TextMeshProUGUI itemNameText;
        [SerializeField] private TextMeshProUGUI itemCostText;
        [SerializeField] private Image qualityStars;
        [SerializeField] private Button selectButton;
        [SerializeField] private GameObject selectedIndicator;

        private FurnitureItem _item;

        public event System.Action<FurnitureItem> OnSelected;

        public void SetItem(FurnitureItem item)
        {
            _item = item;

            if (itemNameText != null)
                itemNameText.text = item.Name;
            if (itemCostText != null)
                itemCostText.text = $"{item.Cost}";
            if (itemIcon != null)
                itemIcon.color = GetCategoryColor(item.Category);

            int coins = SaveManager.Instance?.CurrentSave.Progress.Coins ?? 0;
            if (itemCostText != null)
                itemCostText.color = coins >= item.Cost ? new Color(0.95f, 0.85f, 0.3f) : new Color(0.9f, 0.3f, 0.3f);

            if (selectedIndicator != null)
                selectedIndicator.SetActive(false);

            if (selectButton != null)
            {
                selectButton.onClick.RemoveAllListeners();
                selectButton.onClick.AddListener(() =>
                {
                    if (selectedIndicator != null)
                        selectedIndicator.SetActive(true);
                    OnSelected?.Invoke(_item);
                });
            }
        }

        private Color GetCategoryColor(FurnitureCategory cat)
        {
            switch (cat)
            {
                case FurnitureCategory.Sofa: return new Color(0.6f, 0.45f, 0.35f);
                case FurnitureCategory.Table: return new Color(0.7f, 0.55f, 0.4f);
                case FurnitureCategory.Chair: return new Color(0.55f, 0.6f, 0.7f);
                case FurnitureCategory.Bed: return new Color(0.7f, 0.65f, 0.8f);
                case FurnitureCategory.Cabinet: return new Color(0.55f, 0.45f, 0.35f);
                case FurnitureCategory.Lamp: return new Color(0.95f, 0.85f, 0.45f);
                case FurnitureCategory.Rug: return new Color(0.8f, 0.5f, 0.45f);
                case FurnitureCategory.Decoration: return new Color(0.85f, 0.7f, 0.4f);
                default: return Color.white;
            }
        }
    }
}
