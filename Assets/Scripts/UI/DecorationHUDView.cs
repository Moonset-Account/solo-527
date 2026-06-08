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
    public class DecorationHUDView : UIViewBase
    {
        [Header("Customer Info")]
        [SerializeField] private TextMeshProUGUI customerNameText;
        [SerializeField] private TextMeshProUGUI customerDescriptionText;
        [SerializeField] private Image customerAvatar;
        [SerializeField] private TextMeshProUGUI roomTypeText;

        [Header("Customer Preferences")]
        [SerializeField] private TextMeshProUGUI preferredStyleText;
        [SerializeField] private Transform preferredFurnitureContainer;
        [SerializeField] private TextMeshProUGUI budgetText;

        [Header("Cost Display")]
        [SerializeField] private TextMeshProUGUI totalCostText;
        [SerializeField] private TextMeshProUGUI coinsText;
        [SerializeField] private Image costStatusImage;

        [Header("Materials")]
        [SerializeField] private Transform materialsContainer;
        [SerializeField] private GameObject materialItemPrefab;

        [Header("Buttons")]
        [SerializeField] private Button wallColorButton;
        [SerializeField] private Button floorColorButton;
        [SerializeField] private Button furnitureButton;
        [SerializeField] private Button colorsButton;
        [SerializeField] private Button submitButton;
        [SerializeField] private Button resetButton;
        [SerializeField] private Button inventoryButton;
        [SerializeField] private Button backButton;

        [Header("Active Slot")]
        [SerializeField] private TextMeshProUGUI activeSlotText;
        [SerializeField] private GameObject activeSlotPanel;

        private DecorationSlot _activeSlot;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.DecorationHUD;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (wallColorButton != null)
                wallColorButton.onClick.AddListener(OnWallColorClicked);
            if (floorColorButton != null)
                floorColorButton.onClick.AddListener(OnFloorColorClicked);
            if (furnitureButton != null)
                furnitureButton.onClick.AddListener(OnFurnitureClicked);
            if (colorsButton != null)
                colorsButton.onClick.AddListener(OnColorsClicked);
            if (submitButton != null)
                submitButton.onClick.AddListener(OnSubmitClicked);
            if (resetButton != null)
                resetButton.onClick.AddListener(OnResetClicked);
            if (inventoryButton != null)
                inventoryButton.onClick.AddListener(OnInventoryClicked);
            if (backButton != null)
                backButton.onClick.AddListener(OnBackClicked);

            EventBus.Subscribe<DecorationSlotClickedEvent>(OnSlotClicked);
        }

        public override void Open()
        {
            base.Open();
            RegisterDecorationEvents();
            UpdateAllDisplay();
        }

        public override void Close(bool animate = true)
        {
            base.Close(animate);
            UnregisterDecorationEvents();
        }

        private void RegisterDecorationEvents()
        {
            var decoSystem = DecorationSystem.Instance;
            if (decoSystem != null)
            {
                decoSystem.OnRoomLoaded += HandleRoomLoaded;
                decoSystem.OnFurniturePlaced += HandleFurniturePlaced;
                decoSystem.OnFurnitureRemoved += HandleFurnitureRemoved;
                decoSystem.OnColorApplied += HandleColorApplied;
                decoSystem.OnTotalCostChanged += HandleCostChanged;
            }
        }

        private void UnregisterDecorationEvents()
        {
            var decoSystem = DecorationSystem.Instance;
            if (decoSystem != null)
            {
                decoSystem.OnRoomLoaded -= HandleRoomLoaded;
                decoSystem.OnFurniturePlaced -= HandleFurniturePlaced;
                decoSystem.OnFurnitureRemoved -= HandleFurnitureRemoved;
                decoSystem.OnColorApplied -= HandleColorApplied;
                decoSystem.OnTotalCostChanged -= HandleCostChanged;
            }
        }

        private void OnSlotClicked(DecorationSlotClickedEvent e)
        {
            _activeSlot = e.Slot;
            if (activeSlotText != null)
                activeSlotText.text = $"当前: {e.Slot.SlotName}";
            if (activeSlotPanel != null)
                activeSlotPanel.SetActive(true);

            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            UIManager.Instance.OpenView(UIView.FurniturePanel, true, false);
        }

        private void HandleRoomLoaded(RoomData room)
        {
            UpdateCustomerInfo();
            UpdateMaterialsDisplay();
        }

        private void HandleFurniturePlaced(string slotId, FurnitureItem item)
        {
            UpdateAllDisplay();
        }

        private void HandleFurnitureRemoved(string slotId, FurnitureItem item)
        {
            UpdateAllDisplay();
        }

        private void HandleColorApplied(MaterialType type, ColorOption option)
        {
            UpdateMaterialsDisplay();
        }

        private void HandleCostChanged(int cost)
        {
            UpdateCostDisplay();
        }

        private void UpdateAllDisplay()
        {
            UpdateCustomerInfo();
            UpdateCostDisplay();
            UpdateMaterialsDisplay();
        }

        private void UpdateCustomerInfo()
        {
            var order = LevelManager.Instance?.CurrentOrder;
            if (order == null || order.Customer == null) return;

            if (customerNameText != null)
                customerNameText.text = order.Customer.Name;
            if (customerDescriptionText != null)
                customerDescriptionText.text = order.Customer.Description;
            if (roomTypeText != null)
                roomTypeText.text = GetRoomTypeName(order.TargetRoom.RoomType);

            var prefs = order.Customer.Preferences;
            if (preferredStyleText != null)
                preferredStyleText.text = $"偏好: {GetStyleName(prefs.PreferredColorStyle)}";
            if (budgetText != null)
                budgetText.text = $"预算: {prefs.BudgetMin} - {prefs.BudgetMax}";

            if (preferredFurnitureContainer != null)
            {
                foreach (Transform child in preferredFurnitureContainer)
                    Destroy(child.gameObject);

                foreach (var cat in prefs.RequiredFurniture)
                {
                    GameObject tag = new GameObject("Tag");
                    tag.transform.SetParent(preferredFurnitureContainer, false);
                    var text = tag.AddComponent<TextMeshProUGUI>();
                    text.text = $"[必需] {GetCategoryName(cat)}";
                    text.fontSize = 14;
                    text.color = new Color(0.95f, 0.4f, 0.4f);
                }

                foreach (var cat in prefs.PreferredFurniture)
                {
                    if (prefs.RequiredFurniture.Contains(cat)) continue;
                    GameObject tag = new GameObject("Tag");
                    tag.transform.SetParent(preferredFurnitureContainer, false);
                    var text = tag.AddComponent<TextMeshProUGUI>();
                    text.text = $"[喜欢] {GetCategoryName(cat)}";
                    text.fontSize = 14;
                    text.color = new Color(0.4f, 0.7f, 0.95f);
                }
            }
        }

        private void UpdateCostDisplay()
        {
            var decoSystem = DecorationSystem.Instance;
            var saveManager = SaveManager.Instance;
            var order = LevelManager.Instance?.CurrentOrder;

            if (decoSystem == null || saveManager == null) return;

            if (totalCostText != null)
            {
                totalCostText.text = $"{decoSystem.TotalCost}";
            }
            if (coinsText != null)
            {
                coinsText.text = saveManager.CurrentSave.Progress.Coins.ToString();
            }

            if (costStatusImage != null && order?.Customer?.Preferences != null)
            {
                int cost = decoSystem.TotalCost;
                var prefs = order.Customer.Preferences;
                if (cost < prefs.BudgetMin)
                    costStatusImage.color = new Color(0.95f, 0.7f, 0.3f);
                else if (cost > prefs.BudgetMax)
                    costStatusImage.color = new Color(0.95f, 0.3f, 0.3f);
                else
                    costStatusImage.color = new Color(0.3f, 0.85f, 0.4f);
            }
        }

        private void UpdateMaterialsDisplay()
        {
            if (materialsContainer == null) return;

            foreach (Transform child in materialsContainer)
                Destroy(child.gameObject);

            var progress = SaveManager.Instance?.CurrentSave.Progress;
            if (progress == null) return;

            foreach (var mat in progress.PlayerMaterials)
            {
                if (materialItemPrefab != null)
                {
                    GameObject matObj = Instantiate(materialItemPrefab, materialsContainer);
                    var matUI = matObj.GetComponent<MaterialItemUI>();
                    if (matUI != null)
                    {
                        matUI.SetMaterial(mat.MaterialType, mat.CurrentAmount);
                    }
                    else
                    {
                        TextMeshProUGUI text = matObj.GetComponentInChildren<TextMeshProUGUI>();
                        if (text != null)
                            text.text = $"{GetMaterialName(mat.MaterialType)}: {mat.CurrentAmount}";
                    }
                }
            }
        }

        private void OnWallColorClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            var colorPanel = UIManager.Instance.GetView<ColorPanelView>(UIView.ColorPanel);
            if (colorPanel != null)
            {
                colorPanel.SetTarget(ColorPanelView.ColorTarget.Wall);
            }
            UIManager.Instance.OpenView(UIView.ColorPanel, true, false);
        }

        private void OnFloorColorClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            var colorPanel = UIManager.Instance.GetView<ColorPanelView>(UIView.ColorPanel);
            if (colorPanel != null)
            {
                colorPanel.SetTarget(ColorPanelView.ColorTarget.Floor);
            }
            UIManager.Instance.OpenView(UIView.ColorPanel, true, false);
        }

        private void OnFurnitureClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            UIManager.Instance.OpenView(UIView.FurniturePanel, true, false);
        }

        private void OnColorsClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            if (_activeSlot != null)
            {
                var colorPanel = UIManager.Instance.GetView<ColorPanelView>(UIView.ColorPanel);
                if (colorPanel != null)
                {
                    colorPanel.SetTarget(ColorPanelView.ColorTarget.Furniture);
                    colorPanel.SetSlotId(_activeSlot.SlotId);
                }
                UIManager.Instance.OpenView(UIView.ColorPanel, true, false);
            }
        }

        private void OnSubmitClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            var order = LevelManager.Instance?.CurrentOrder;
            if (order != null)
            {
                Gameplay.Customer.CustomerReviewSystem.Instance.EvaluateDecoration(order);
            }
        }

        private void OnResetClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            DecorationSystem.Instance?.ResetDecoration();
        }

        private void OnInventoryClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            UIManager.Instance.OpenView(UIView.MaterialInventory, true, false);
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            GameStateManager.Instance.ChangeState(GameState.MainMenu);
            SceneLoader.Instance.LoadScene(SceneType.MainMenu);
        }

        private string GetRoomTypeName(RoomType type)
        {
            switch (type)
            {
                case RoomType.LivingRoom: return "客厅";
                case RoomType.Bedroom: return "卧室";
                case RoomType.Kitchen: return "厨房";
                case RoomType.Bathroom: return "浴室";
                case RoomType.Study: return "书房";
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

        private void OnDestroy()
        {
            if (wallColorButton != null)
                wallColorButton.onClick.RemoveListener(OnWallColorClicked);
            if (floorColorButton != null)
                floorColorButton.onClick.RemoveListener(OnFloorColorClicked);
            if (furnitureButton != null)
                furnitureButton.onClick.RemoveListener(OnFurnitureClicked);
            if (colorsButton != null)
                colorsButton.onClick.RemoveListener(OnColorsClicked);
            if (submitButton != null)
                submitButton.onClick.RemoveListener(OnSubmitClicked);
            if (resetButton != null)
                resetButton.onClick.RemoveListener(OnResetClicked);
            if (inventoryButton != null)
                inventoryButton.onClick.RemoveListener(OnInventoryClicked);
            if (backButton != null)
                backButton.onClick.RemoveListener(OnBackClicked);
            EventBus.Unsubscribe<DecorationSlotClickedEvent>(OnSlotClicked);
        }
    }

    public class MaterialItemUI : MonoBehaviour
    {
        [SerializeField] private Image iconImage;
        [SerializeField] private TextMeshProUGUI amountText;
        [SerializeField] private TextMeshProUGUI nameText;

        public void SetMaterial(MaterialType type, int amount)
        {
            if (amountText != null)
                amountText.text = amount.ToString();
            if (nameText != null)
            {
                switch (type)
                {
                    case MaterialType.Paint: nameText.text = "油漆"; break;
                    case MaterialType.Fabric: nameText.text = "布料"; break;
                    case MaterialType.Wood: nameText.text = "木材"; break;
                    case MaterialType.Metal: nameText.text = "金属"; break;
                    case MaterialType.Tile: nameText.text = "瓷砖"; break;
                    case MaterialType.Wallpaper: nameText.text = "壁纸"; break;
                    default: nameText.text = type.ToString(); break;
                }
            }
            if (iconImage != null)
            {
                switch (type)
                {
                    case MaterialType.Paint: iconImage.color = new Color(0.95f, 0.4f, 0.4f); break;
                    case MaterialType.Fabric: iconImage.color = new Color(0.4f, 0.6f, 0.95f); break;
                    case MaterialType.Wood: iconImage.color = new Color(0.7f, 0.5f, 0.3f); break;
                    case MaterialType.Metal: iconImage.color = new Color(0.85f, 0.85f, 0.3f); break;
                    case MaterialType.Tile: iconImage.color = new Color(0.75f, 0.45f, 0.9f); break;
                    case MaterialType.Wallpaper: iconImage.color = new Color(0.95f, 0.6f, 0.3f); break;
                    default: iconImage.color = Color.gray; break;
                }
            }
        }
    }
}
