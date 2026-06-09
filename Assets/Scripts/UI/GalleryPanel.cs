using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Data;
using LakeSailing.Gameplay;

namespace LakeSailing.UI
{
    public class GalleryPanel : UIPanelBase
    {
        [Header("组件")]
        [SerializeField] private Transform gridContainer;
        [SerializeField] private GameObject itemPrefab;
        [SerializeField] private Dropdown rarityFilterDropdown;
        [SerializeField] private Toggle showOnlyUnlockedToggle;
        [SerializeField] private Text completionText;

        [Header("详情")]
        [SerializeField] private GameObject detailPanel;
        [SerializeField] private Image detailPreview;
        [SerializeField] private Text detailName;
        [SerializeField] private Text detailRarity;
        [SerializeField] private Image detailRarityColor;
        [SerializeField] private Text detailDescription;
        [SerializeField] private Text detailHint;
        [SerializeField] private Button detailCloseButton;

        [Header("其他按钮")]
        [SerializeField] private Button backButton;

        private List<GalleryItemData> filteredItems = new List<GalleryItemData>();

        private void Awake()
        {
            panelType = UIType.Gallery;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start()
        {
            InitializeFilters();
            InitializeButtons();
            EnsureMockData();
        }

        private void InitializeFilters()
        {
            if (rarityFilterDropdown != null)
            {
                rarityFilterDropdown.ClearOptions();
                rarityFilterDropdown.AddOptions(new List<string> { "全部稀有度", "普通", "稀有", "珍贵", "史诗", "传说" });
                rarityFilterDropdown.onValueChanged.AddListener(_ => RefreshGrid());
            }
            if (showOnlyUnlockedToggle != null)
            {
                showOnlyUnlockedToggle.onValueChanged.AddListener(_ => RefreshGrid());
            }
        }

        private void InitializeButtons()
        {
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
            if (detailCloseButton != null) detailCloseButton.onClick.AddListener(CloseDetail);
        }

        private void EnsureMockData()
        {
            if (GallerySystem.Instance == null) return;
            var items = new List<GalleryItemData>();

            string[] names = { "白鹭", "苍鹭", "鸳鸯", "翠鸟", "白天鹅", "黑天鹅", "水杉倒影", "湖心小岛", "睡莲群落", "夕阳映照", "彩虹拱桥", "晨雾仙境", "捕鱼鱼鹰", "稀有水獭", "传说湖怪" };
            string[] descs = {
                "优雅的白色涉禽，常在水边踱步捕鱼。",
                "灰色的大型涉禽，比白鹭更加警觉。",
                "总是成双成对出现，象征永恒的爱情。",
                "颜色鲜艳的小型水鸟，捕鱼动作极快。",
                "纯洁高贵的象征，叫声如号角般嘹亮。",
                "神秘的黑色精灵，极为罕见。",
                "古老水杉的倒影在水中形成对称图案。",
                "湖中心的神秘小岛，据说藏有宝藏。",
                "漂浮在水面的粉白色花朵，夏季盛开。",
                "夕阳染红整片湖面的壮丽景象。",
                "雨后横跨湖面的七色彩虹。",
                "清晨薄雾笼罩湖面的梦幻场景。",
                "经过训练的鱼鹰正在协助渔民捕鱼。",
                "传说中居住在湖底的可爱哺乳动物。",
                "只在传说中出现的神秘生物，极难捕捉。"
            };
            int[] rarities = { 1, 1, 2, 2, 2, 4, 1, 2, 1, 3, 3, 3, 2, 4, 5 };

            for (int i = 0; i < names.Length; i++)
            {
                var item = ScriptableObject.CreateInstance<GalleryItemData>();
                item.itemId = $"gallery_{i:D3}";
                item.itemName = names[i];
                item.description = descs[i];
                item.rarity = rarities[i];
                item.unlockHint = $"在特定天气下拍摄获得";
                items.Add(item);
            }

            GallerySystem.Instance.Initialize(items);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.Gallery);
            RefreshGrid();
            UpdateCompletion();
            HideDetail();
        }

        private void RefreshGrid()
        {
            if (gridContainer == null || GallerySystem.Instance == null) return;
            foreach (Transform child in gridContainer) Destroy(child.gameObject);

            int rarityFilter = rarityFilterDropdown != null ? rarityFilterDropdown.value : 0;
            bool onlyUnlocked = showOnlyUnlockedToggle != null && showOnlyUnlockedToggle.isOn;

            filteredItems.Clear();
            foreach (var item in GallerySystem.Instance.AllItems)
            {
                if (rarityFilter > 0 && item.rarity != rarityFilter) continue;
                if (onlyUnlocked && !GallerySystem.Instance.IsUnlocked(item.itemId)) continue;
                filteredItems.Add(item);
            }

            foreach (var item in filteredItems)
            {
                if (itemPrefab == null) continue;
                var go = Instantiate(itemPrefab, gridContainer);
                var ui = go.GetComponent<GalleryItemUI>();
                if (ui != null) ui.Initialize(item, GallerySystem.Instance.IsUnlocked(item.itemId), OnItemClicked);
            }
        }

        private void UpdateCompletion()
        {
            if (completionText != null && GallerySystem.Instance != null)
            {
                completionText.text = $"收集进度: {GallerySystem.Instance.GetUnlockedCount()}/{GallerySystem.Instance.GetTotalItemCount()} ({GallerySystem.Instance.GetCompletionPercent():F1}%)";
            }
        }

        private void OnItemClicked(GalleryItemData item)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            ShowDetail(item);
        }

        private void ShowDetail(GalleryItemData item)
        {
            if (detailPanel == null) return;
            detailPanel.SetActive(true);

            bool unlocked = GallerySystem.Instance.IsUnlocked(item.itemId);

            if (detailName != null) detailName.text = unlocked ? item.itemName : "???";
            if (detailDescription != null) detailDescription.text = unlocked ? item.description : "未解锁";
            if (detailRarity != null) detailRarity.text = GallerySystem.Instance.GetRarityName(item.rarity);
            if (detailRarityColor != null) detailRarityColor.color = GallerySystem.Instance.GetRarityColor(item.rarity);
            if (detailHint != null) detailHint.text = unlocked ? "已解锁" : item.unlockHint;
        }

        private void CloseDetail()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            HideDetail();
        }

        private void HideDetail()
        {
            if (detailPanel != null) detailPanel.SetActive(false);
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }
    }
}
