using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public class MaterialInventoryView : UIViewBase
    {
        [Header("Inventory Grid")]
        [SerializeField] private Transform inventoryContainer;
        [SerializeField] private GameObject inventoryItemPrefab;

        [Header("Info")]
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI coinsText;

        [Header("Buttons")]
        [SerializeField] private Button closeButton;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.MaterialInventory;
        }

        public override void Initialize()
        {
            base.Initialize();
            if (closeButton != null)
                closeButton.onClick.AddListener(OnCloseClicked);
        }

        public override void Open()
        {
            base.Open();
            PopulateInventory();
        }

        private void PopulateInventory()
        {
            if (inventoryContainer == null) return;

            foreach (Transform child in inventoryContainer)
                Destroy(child.gameObject);

            var progress = SaveManager.Instance?.CurrentSave.Progress;
            if (progress == null) return;

            if (coinsText != null)
                coinsText.text = progress.Coins.ToString();

            foreach (var mat in progress.PlayerMaterials)
            {
                if (inventoryItemPrefab == null) continue;

                GameObject itemGO = Instantiate(inventoryItemPrefab, inventoryContainer);
                MaterialInventoryItem itemUI = itemGO.GetComponent<MaterialInventoryItem>();
                if (itemUI == null) itemUI = itemGO.AddComponent<MaterialInventoryItem>();

                itemUI.SetItem(mat.MaterialType, mat.CurrentAmount, mat.MaxStorage);
            }
        }

        private void OnCloseClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            UIManager.Instance.GoBack();
        }

        private void OnDestroy()
        {
            if (closeButton != null)
                closeButton.onClick.RemoveListener(OnCloseClicked);
        }
    }

    public class MaterialInventoryItem : MonoBehaviour
    {
        [SerializeField] private Image iconImage;
        [SerializeField] private TextMeshProUGUI nameText;
        [SerializeField] private TextMeshProUGUI amountText;
        [SerializeField] private TextMeshProUGUI capacityText;
        [SerializeField] private Image progressFill;

        public void SetItem(MaterialType type, int amount, int max)
        {
            if (nameText != null)
                nameText.text = GetMaterialName(type);
            if (amountText != null)
                amountText.text = amount.ToString();
            if (capacityText != null)
                capacityText.text = $"/{max}";
            if (progressFill != null)
                progressFill.fillAmount = (float)amount / max;
            if (iconImage != null)
                iconImage.color = GetMaterialColor(type);
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

        private Color GetMaterialColor(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Paint: return new Color(0.95f, 0.4f, 0.4f);
                case MaterialType.Fabric: return new Color(0.4f, 0.6f, 0.95f);
                case MaterialType.Wood: return new Color(0.7f, 0.5f, 0.3f);
                case MaterialType.Metal: return new Color(0.85f, 0.85f, 0.3f);
                case MaterialType.Tile: return new Color(0.75f, 0.45f, 0.9f);
                case MaterialType.Wallpaper: return new Color(0.95f, 0.6f, 0.3f);
                default: return Color.gray;
            }
        }
    }
}
