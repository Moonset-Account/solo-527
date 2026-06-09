using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class GalleryPanel : UIPanelBase
    {
        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Color TabNormalColor = new Color(0.25f, 0.25f, 0.35f, 0.95f);
        private static readonly Color CardBgColor = new Color(0.15f, 0.18f, 0.28f, 0.95f);
        private static readonly Color LockedOverlayColor = new Color(0, 0, 0, 0.55f);
        private static readonly Color DetailBgColor = new Color(0.12f, 0.14f, 0.22f, 0.97f);

        private struct RarityInfo
        {
            public string Name;
            public Color Color;
            public RarityInfo(string n, Color c) { Name = n; Color = c; }
        }

        private static readonly RarityInfo[] RarityTable =
        {
            new RarityInfo("全部", Color.white),
            new RarityInfo("普通", new Color(0.7f, 0.7f, 0.75f)),
            new RarityInfo("优秀", new Color(0.4f, 0.9f, 0.5f)),
            new RarityInfo("稀有", new Color(0.4f, 0.65f, 1f)),
            new RarityInfo("史诗", new Color(0.85f, 0.45f, 0.95f)),
            new RarityInfo("传说", new Color(1f, 0.8f, 0.25f)),
        };

        private struct MockGalleryItem
        {
            public string Name;
            public int Rarity;
            public string Description;
            public bool Unlocked;
            public string FirstObtainedTime;
            public string BonusEffect;

            public MockGalleryItem(string name, int rarity, string desc, bool unlocked, string obtained, string bonus)
            {
                Name = name;
                Rarity = rarity;
                Description = desc;
                Unlocked = unlocked;
                FirstObtainedTime = obtained;
                BonusEffect = bonus;
            }
        }

        private readonly List<MockGalleryItem> mockItems = new List<MockGalleryItem>
        {
            new MockGalleryItem("白鹭", 1, "优雅的白色涉禽，常在水边踱步捕鱼。", true, "2025-03-15 14:23", "经验+2%"),
            new MockGalleryItem("苍鹭", 1, "灰色的大型涉禽，比白鹭更加警觉。", true, "2025-03-16 09:10", "经验+2%"),
            new MockGalleryItem("水杉倒影", 1, "古老水杉的倒影在水中形成对称图案。", true, "2025-03-17 16:45", "经验+2%"),
            new MockGalleryItem("鸳鸯", 2, "总是成双成对出现，象征永恒的爱情。", true, "2025-03-18 11:32", "金币+3%"),
            new MockGalleryItem("翠鸟", 2, "颜色鲜艳的小型水鸟，捕鱼动作极快。", true, "2025-03-19 15:08", "金币+3%"),
            new MockGalleryItem("白天鹅", 2, "纯洁高贵的象征，叫声如号角般嘹亮。", true, "2025-03-20 08:55", "金币+3%"),
            new MockGalleryItem("睡莲群落", 1, "漂浮在水面的粉白色花朵，夏季盛开。", false, "", "经验+2%"),
            new MockGalleryItem("湖心小岛", 2, "湖中心的神秘小岛，据说藏有宝藏。", true, "2025-03-22 13:40", "金币+3%"),
            new MockGalleryItem("夕阳映照", 3, "夕阳染红整片湖面的壮丽景象。", true, "2025-03-23 18:17", "评分+5%"),
            new MockGalleryItem("彩虹拱桥", 3, "雨后横跨湖面的七色彩虹。", false, "", "评分+5%"),
            new MockGalleryItem("晨雾仙境", 3, "清晨薄雾笼罩湖面的梦幻场景。", true, "2025-03-25 06:24", "评分+5%"),
            new MockGalleryItem("捕鱼鱼鹰", 2, "经过训练的鱼鹰正在协助渔民捕鱼。", false, "", "金币+3%"),
            new MockGalleryItem("黑天鹅", 4, "神秘的黑色精灵，极为罕见。", false, "", "稀有加成+8%"),
            new MockGalleryItem("稀有水獭", 4, "传说中居住在湖底的可爱哺乳动物。", false, "", "稀有加成+8%"),
            new MockGalleryItem("传说湖怪", 5, "只在传说中出现的神秘生物，极难捕捉。", false, "", "全属性+10%"),
        };

        private int currentRarityFilter = 0;
        private Text builtProgressText;
        private Button[] builtTabButtons;
        private Image[] builtTabImages;
        private GameObject gridRoot;
        private GameObject detailPanel;
        private Image builtDetailIconImg;
        private Text builtDetailNameText;
        private Text builtDetailRarityText;
        private Image builtDetailRarityImg;
        private Text builtDetailDescText;
        private Text builtDetailTimeText;
        private Text builtDetailBonusText;

        private void Awake()
        {
            panelType = UIType.Gallery;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();

            if (panelContent == null)
            {
                panelContent = RuntimeUIBuilder.CreatePanel(transform, "GalleryPanelContent");
                gameObject.SetActive(false);
            }

            var contentRoot = panelContent.transform;
            foreach (Transform child in contentRoot) Destroy(child.gameObject);

            RuntimeUIBuilder.CreateTitle(contentRoot, "图鉴收集", 52, -10f);

            builtProgressText = RuntimeUIBuilder.CreateLabel(contentRoot, "已收集 8/15", 26,
                TextAnchor.MiddleCenter, 400, 40);
            var progressRT = builtProgressText.rectTransform;
            progressRT.anchorMin = new Vector2(0.5f, 1f);
            progressRT.anchorMax = new Vector2(0.5f, 1f);
            progressRT.pivot = new Vector2(0.5f, 1f);
            progressRT.anchoredPosition = new Vector2(0, -150f);

            var tabBar = new GameObject("RarityTabBar");
            tabBar.transform.SetParent(contentRoot, false);
            var tabBarRT = tabBar.AddComponent<RectTransform>();
            tabBarRT.anchorMin = new Vector2(0.5f, 1f);
            tabBarRT.anchorMax = new Vector2(0.5f, 1f);
            tabBarRT.pivot = new Vector2(0.5f, 1f);
            tabBarRT.anchoredPosition = new Vector2(0, -210f);
            tabBarRT.sizeDelta = new Vector2(1700, 70);

            var tabHG = tabBar.AddComponent<HorizontalLayoutGroup>();
            tabHG.spacing = 12f;
            tabHG.childAlignment = TextAnchor.MiddleCenter;
            tabHG.childControlHeight = true;
            tabHG.childControlWidth = true;
            tabHG.childForceExpandHeight = true;
            tabHG.childForceExpandWidth = true;

            builtTabButtons = new Button[RarityTable.Length];
            builtTabImages = new Image[RarityTable.Length];
            for (int i = 0; i < RarityTable.Length; i++)
            {
                int idx = i;
                var btn = RuntimeUIBuilder.CreateButton(tabBar.transform, RarityTable[i].Name,
                    new Vector2(200, 56), () => OnRarityTabClicked(idx),
                    22, TabNormalColor, GetTabHoverColor(i));
                builtTabButtons[i] = btn;
                builtTabImages[i] = btn.GetComponent<Image>();

                var labelT = btn.GetComponentInChildren<Text>();
                if (labelT != null) labelT.color = RarityTable[i].Color;
            }

            var mainArea = new GameObject("MainArea");
            mainArea.transform.SetParent(contentRoot, false);
            var mainRT = mainArea.AddComponent<RectTransform>();
            mainRT.anchorMin = new Vector2(0.5f, 0.5f);
            mainRT.anchorMax = new Vector2(0.5f, 0.5f);
            mainRT.pivot = new Vector2(0.5f, 0.5f);
            mainRT.anchoredPosition = new Vector2(0, -50f);
            mainRT.sizeDelta = new Vector2(1700, 600);

            var mainHG = mainArea.AddComponent<HorizontalLayoutGroup>();
            mainHG.spacing = 40f;
            mainHG.childAlignment = TextAnchor.MiddleCenter;
            mainHG.childControlHeight = true;
            mainHG.childControlWidth = true;
            mainHG.childForceExpandHeight = true;
            mainHG.childForceExpandWidth = false;
            mainHG.padding = new RectOffset(20, 20, 20, 20);

            gridRoot = new GameObject("GridRoot");
            gridRoot.transform.SetParent(mainRT, false);
            var gridRT = gridRoot.AddComponent<RectTransform>();
            gridRT.sizeDelta = new Vector2(1050, 560);

            var gridGroup = gridRoot.AddComponent<GridLayoutGroup>();
            gridGroup.cellSize = new Vector2(180, 160);
            gridGroup.spacing = new Vector2(22, 22);
            gridGroup.startCorner = GridLayoutGroup.Corner.UpperLeft;
            gridGroup.startAxis = GridLayoutGroup.Axis.Horizontal;
            gridGroup.childAlignment = TextAnchor.UpperLeft;
            gridGroup.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            gridGroup.constraintCount = 5;

            var gridFitter = gridRoot.AddComponent<ContentSizeFitter>();
            gridFitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            gridFitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;

            detailPanel = new GameObject("DetailPanel");
            detailPanel.transform.SetParent(mainRT, false);
            var detailRT = detailPanel.AddComponent<RectTransform>();
            detailRT.sizeDelta = new Vector2(560, 560);
            var detailImg = detailPanel.AddComponent<Image>();
            detailImg.color = DetailBgColor;
            detailImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            detailImg.type = Image.Type.Sliced;

            BuildDetailPanelContent(detailRT);

            var bottomBar = new GameObject("BottomBar");
            bottomBar.transform.SetParent(contentRoot, false);
            var bottomRT = bottomBar.AddComponent<RectTransform>();
            bottomRT.anchorMin = new Vector2(0.5f, 0f);
            bottomRT.anchorMax = new Vector2(0.5f, 0f);
            bottomRT.pivot = new Vector2(0.5f, 0f);
            bottomRT.anchoredPosition = new Vector2(0, 50f);
            bottomRT.sizeDelta = new Vector2(400, 70);

            RuntimeUIBuilder.CreateButton(bottomBar.transform, "返回",
                new Vector2(360, 64), OnBackClicked, 26, ButtonNormalColor, ButtonHoverColor);

            RefreshTabs();
            BuildGrid();
            HideDetail();
        }

        private Color GetTabHoverColor(int rarityIdx)
        {
            var c = RarityTable[rarityIdx].Color;
            return new Color(
                Mathf.Clamp01(c.r * 0.35f + 0.25f),
                Mathf.Clamp01(c.g * 0.35f + 0.25f),
                Mathf.Clamp01(c.b * 0.35f + 0.45f),
                0.95f);
        }

        private void BuildDetailPanelContent(RectTransform parent)
        {
            var iconBox = RuntimeUIBuilder.CreateIconBox(parent, new Vector2(180, 180), new Color(0.2f, 0.25f, 0.4f, 1f));
            var iconRT = iconBox.rectTransform;
            iconRT.anchorMin = new Vector2(0.5f, 1f);
            iconRT.anchorMax = new Vector2(0.5f, 1f);
            iconRT.pivot = new Vector2(0.5f, 1f);
            iconRT.anchoredPosition = new Vector2(0, -40f);
            builtDetailIconImg = iconBox;

            var iconChar = RuntimeUIBuilder.CreateLabel(iconRT, "?", 80,
                TextAnchor.MiddleCenter, 160, 160);
            iconChar.fontStyle = FontStyle.Bold;
            var icRT = iconChar.rectTransform;
            RuntimeUIBuilder.StretchFull(icRT, 10f);

            var nameLabel = RuntimeUIBuilder.CreateLabel(parent, "物品名称", 32,
                TextAnchor.MiddleCenter, 500, 48);
            var nRT = nameLabel.rectTransform;
            nRT.anchorMin = new Vector2(0.5f, 1f);
            nRT.anchorMax = new Vector2(0.5f, 1f);
            nRT.pivot = new Vector2(0.5f, 1f);
            nRT.anchoredPosition = new Vector2(0, -250f);
            builtDetailNameText = nameLabel;

            var rarityRow = new GameObject("RarityRow");
            rarityRow.transform.SetParent(parent, false);
            var rrRT = rarityRow.AddComponent<RectTransform>();
            rrRT.anchorMin = new Vector2(0.5f, 1f);
            rrRT.anchorMax = new Vector2(0.5f, 1f);
            rrRT.pivot = new Vector2(0.5f, 1f);
            rrRT.anchoredPosition = new Vector2(0, -305f);
            rrRT.sizeDelta = new Vector2(300, 40);
            var rrHG = rarityRow.AddComponent<HorizontalLayoutGroup>();
            rrHG.spacing = 12f;
            rrHG.childAlignment = TextAnchor.MiddleCenter;
            rrHG.childControlHeight = true;

            builtDetailRarityImg = RuntimeUIBuilder.CreateIconBox(rarityRow.transform,
                new Vector2(24, 24), RarityTable[1].Color);
            builtDetailRarityText = RuntimeUIBuilder.CreateLabel(rarityRow.transform, "普通", 22,
                TextAnchor.MiddleLeft, 200, 36);

            var descLabel = RuntimeUIBuilder.CreateLabel(parent, "物品描述内容将显示在这里。", 20,
                TextAnchor.UpperLeft, 500, 80);
            var dRT = descLabel.rectTransform;
            dRT.anchorMin = new Vector2(0.5f, 1f);
            dRT.anchorMax = new Vector2(0.5f, 1f);
            dRT.pivot = new Vector2(0.5f, 1f);
            dRT.anchoredPosition = new Vector2(0, -365f);
            descLabel.horizontalOverflow = HorizontalWrapMode.Wrap;
            descLabel.verticalOverflow = VerticalWrapMode.Truncate;
            builtDetailDescText = descLabel;

            var timeLabel = RuntimeUIBuilder.CreateLabel(parent, "首次获得: --", 18,
                TextAnchor.UpperLeft, 500, 30);
            var tRT = timeLabel.rectTransform;
            tRT.anchorMin = new Vector2(0.5f, 1f);
            tRT.anchorMax = new Vector2(0.5f, 1f);
            tRT.pivot = new Vector2(0.5f, 1f);
            tRT.anchoredPosition = new Vector2(0, -450f);
            timeLabel.color = new Color(0.7f, 0.75f, 0.85f);
            builtDetailTimeText = timeLabel;

            var bonusLabel = RuntimeUIBuilder.CreateLabel(parent, "加成效果: --", 18,
                TextAnchor.UpperLeft, 500, 30);
            var bRT = bonusLabel.rectTransform;
            bRT.anchorMin = new Vector2(0.5f, 1f);
            bRT.anchorMax = new Vector2(0.5f, 1f);
            bRT.pivot = new Vector2(0.5f, 1f);
            bRT.anchoredPosition = new Vector2(0, -485f);
            bonusLabel.color = new Color(1f, 0.85f, 0.4f);
            builtDetailBonusText = bonusLabel;
        }

        private void RefreshTabs()
        {
            for (int i = 0; i < RarityTable.Length; i++)
            {
                if (builtTabImages[i] != null)
                {
                    builtTabImages[i].color = (i == currentRarityFilter)
                        ? GetTabHoverColor(i)
                        : TabNormalColor;
                }
            }
        }

        private void UpdateProgress()
        {
            int unlocked = 0;
            foreach (var it in mockItems) if (it.Unlocked) unlocked++;
            if (builtProgressText != null)
            {
                builtProgressText.text = $"已收集 {unlocked}/{mockItems.Count}";
            }
        }

        private void BuildGrid()
        {
            foreach (Transform child in gridRoot.transform) Destroy(child.gameObject);

            for (int i = 0; i < mockItems.Count; i++)
            {
                if (currentRarityFilter > 0 && mockItems[i].Rarity != currentRarityFilter) continue;
                CreateGalleryCard(mockItems[i], i);
            }
        }

        private void CreateGalleryCard(MockGalleryItem data, int index)
        {
            var cardGO = new GameObject($"GalleryCard_{data.Name}");
            cardGO.transform.SetParent(gridRoot.transform, false);
            var cardRT = cardGO.AddComponent<RectTransform>();
            cardRT.sizeDelta = new Vector2(180, 160);

            var cardImg = cardGO.AddComponent<Image>();
            cardImg.color = CardBgColor;
            cardImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            cardImg.type = Image.Type.Sliced;

            var cardBtn = cardGO.AddComponent<Button>();
            var cardColors = cardBtn.colors;
            cardColors.normalColor = Color.white;
            cardColors.highlightedColor = new Color(1.15f, 1.15f, 1.2f, 1f);
            cardColors.pressedColor = new Color(0.85f, 0.85f, 0.9f, 1f);
            cardColors.colorMultiplier = 1f;
            cardColors.fadeDuration = 0.1f;
            cardBtn.colors = cardColors;
            cardBtn.transition = Selectable.Transition.ColorTint;
            cardBtn.targetGraphic = cardImg;

            if (data.Unlocked)
            {
                int idx = index;
                cardBtn.onClick.AddListener(() => OnCardClicked(idx));
            }

            int rarityIdx = Mathf.Clamp(data.Rarity, 1, RarityTable.Length - 1);
            Color iconBg = RarityTable[rarityIdx].Color;
            var iconBox = RuntimeUIBuilder.CreateIconBox(cardImg.rectTransform, new Vector2(90, 90),
                new Color(iconBg.r * 0.3f, iconBg.g * 0.3f, iconBg.b * 0.4f, 1f));
            var iRT = iconBox.rectTransform;
            iRT.anchorMin = new Vector2(0.5f, 1f);
            iRT.anchorMax = new Vector2(0.5f, 1f);
            iRT.pivot = new Vector2(0.5f, 1f);
            iRT.anchoredPosition = new Vector2(0, -20f);

            string displayChar = data.Unlocked && data.Name.Length > 0 ? data.Name[0].ToString() : "?";
            var iconChar = RuntimeUIBuilder.CreateLabel(iRT, displayChar, 46,
                TextAnchor.MiddleCenter, 80, 80);
            iconChar.color = iconBg;
            iconChar.fontStyle = FontStyle.Bold;
            var icRT2 = iconChar.rectTransform;
            RuntimeUIBuilder.StretchFull(icRT2, 5f);

            var nameLabel = RuntimeUIBuilder.CreateLabel(cardImg.rectTransform,
                data.Unlocked ? data.Name : "???", 18,
                TextAnchor.MiddleCenter, 160, 28);
            var nRT = nameLabel.rectTransform;
            nRT.anchorMin = new Vector2(0.5f, 0f);
            nRT.anchorMax = new Vector2(0.5f, 0f);
            nRT.pivot = new Vector2(0.5f, 0f);
            nRT.anchoredPosition = new Vector2(0, 32f);

            if (!data.Unlocked)
            {
                var lockLabel = RuntimeUIBuilder.CreateLabel(cardImg.rectTransform, "🔒", 28,
                    TextAnchor.MiddleCenter, 60, 40);
                var lRT = lockLabel.rectTransform;
                lRT.anchorMin = new Vector2(0.5f, 0.5f);
                lRT.anchorMax = new Vector2(0.5f, 0.5f);
                lRT.pivot = new Vector2(0.5f, 0.5f);
                lRT.anchoredPosition = Vector2.zero;
            }

            var barGO = new GameObject("RarityBar");
            barGO.transform.SetParent(cardImg.rectTransform, false);
            var barRT = barGO.AddComponent<RectTransform>();
            barRT.anchorMin = new Vector2(0, 0);
            barRT.anchorMax = new Vector2(1, 0);
            barRT.pivot = new Vector2(0.5f, 0f);
            barRT.offsetMin = new Vector2(0, 0);
            barRT.offsetMax = new Vector2(0, 5f);
            var barImg = barGO.AddComponent<Image>();
            barImg.color = iconBg;
        }

        private void HideDetail()
        {
            if (detailPanel != null) detailPanel.SetActive(false);
        }

        private void ShowDetail(MockGalleryItem data)
        {
            if (detailPanel != null) detailPanel.SetActive(true);

            int rarityIdx = Mathf.Clamp(data.Rarity, 1, RarityTable.Length - 1);
            Color iconBg = RarityTable[rarityIdx].Color;

            if (builtDetailIconImg != null)
            {
                builtDetailIconImg.color = new Color(iconBg.r * 0.35f, iconBg.g * 0.35f, iconBg.b * 0.45f, 1f);
                var charT = builtDetailIconImg.GetComponentInChildren<Text>();
                if (charT != null)
                {
                    charT.text = data.Name.Length > 0 ? data.Name[0].ToString() : "?";
                    charT.color = iconBg;
                }
            }

            if (builtDetailNameText != null)
            {
                builtDetailNameText.text = data.Name;
                builtDetailNameText.color = Color.white;
            }
            if (builtDetailRarityImg != null) builtDetailRarityImg.color = iconBg;
            if (builtDetailRarityText != null)
            {
                builtDetailRarityText.text = RarityTable[rarityIdx].Name;
                builtDetailRarityText.color = iconBg;
            }
            if (builtDetailDescText != null) builtDetailDescText.text = data.Description;
            if (builtDetailTimeText != null)
            {
                builtDetailTimeText.text = string.IsNullOrEmpty(data.FirstObtainedTime)
                    ? "首次获得: 未解锁"
                    : $"首次获得: {data.FirstObtainedTime}";
            }
            if (builtDetailBonusText != null)
            {
                builtDetailBonusText.text = string.IsNullOrEmpty(data.BonusEffect)
                    ? "加成效果: --"
                    : $"加成效果: {data.BonusEffect}";
            }
        }

        private void OnRarityTabClicked(int idx)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            currentRarityFilter = idx;
            RefreshTabs();
            BuildGrid();
        }

        private void OnCardClicked(int idx)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (idx < 0 || idx >= mockItems.Count) return;
            var data = mockItems[idx];
            if (!data.Unlocked) return;
            ShowDetail(data);
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.Gallery);
            UpdateProgress();
            HideDetail();
        }
    }
}
