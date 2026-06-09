using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class AchievementsPanel : UIPanelBase
    {
        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Color TabNormalColor = new Color(0.25f, 0.25f, 0.35f, 0.95f);
        private static readonly Color TabSelectedColor = new Color(0.3f, 0.6f, 1f, 0.95f);
        private static readonly Color RowBgColor = new Color(0.15f, 0.18f, 0.28f, 0.95f);
        private static readonly Color ProgressBgColor = new Color(0.1f, 0.12f, 0.18f, 1f);
        private static readonly Color ProgressFillColor = new Color(0.4f, 0.75f, 1f, 1f);
        private static readonly Color UnlockedGlowColor = new Color(1f, 0.85f, 0.3f, 0.3f);

        private struct CategoryInfo
        {
            public string Name;
            public CategoryInfo(string n) { Name = n; }
        }

        private static readonly CategoryInfo[] Categories =
        {
            new CategoryInfo("全部"),
            new CategoryInfo("航行"),
            new CategoryInfo("拍摄"),
            new CategoryInfo("收集"),
            new CategoryInfo("挑战"),
        };

        private struct MockAchievement
        {
            public string Name;
            public string Description;
            public int Category;
            public int TargetValue;
            public int CurrentValue;
            public bool IsUnlocked;

            public MockAchievement(string name, string desc, int cat, int target, int current, bool unlocked)
            {
                Name = name;
                Description = desc;
                Category = cat;
                TargetValue = target;
                CurrentValue = current;
                IsUnlocked = unlocked;
            }
        }

        private readonly List<MockAchievement> mockAchievements = new List<MockAchievement>
        {
            new MockAchievement("初次启航", "完成第一次航行", 1, 1, 1, true),
            new MockAchievement("百里航程", "累计航行100米", 1, 100, 85, false),
            new MockAchievement("千里航程", "累计航行1000米", 1, 1000, 256, false),
            new MockAchievement("万里长征", "累计航行10000米", 1, 10000, 256, false),
            new MockAchievement("摄影入门", "拍摄10张照片", 2, 10, 10, true),
            new MockAchievement("摄影达人", "拍摄50张照片", 2, 50, 34, false),
            new MockAchievement("百图斩", "拍摄100张照片", 2, 100, 34, false),
            new MockAchievement("完美构图", "单次拍摄获得90分以上", 2, 1, 1, true),
            new MockAchievement("收藏家", "解锁5种图鉴物品", 3, 5, 8, true),
            new MockAchievement("博物学家", "解锁全部图鉴", 3, 15, 8, false),
            new MockAchievement("星级猎手", "获得20颗关卡星", 3, 20, 6, false),
            new MockAchievement("连续七天", "连续完成7天每日挑战", 4, 7, 3, false),
            new MockAchievement("毫发无损", "无损伤完成任意关卡", 4, 1, 0, false),
            new MockAchievement("风暴勇士", "在暴风雨中完成关卡", 4, 1, 0, false),
            new MockAchievement("传奇船长", "解锁全部成就", 4, 15, 4, false),
        };

        private int currentCategory = 0;
        private Text builtProgressText;
        private Button[] builtTabButtons;
        private Image[] builtTabImages;
        private GameObject scrollContentRoot;

        private void Awake()
        {
            panelType = UIType.Achievements;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();

            if (panelContent == null)
            {
                panelContent = RuntimeUIBuilder.CreatePanel(transform, "AchievementsPanelContent");
                gameObject.SetActive(false);
            }

            var contentRoot = panelContent.transform;
            foreach (Transform child in contentRoot) Destroy(child.gameObject);

            RuntimeUIBuilder.CreateTitle(contentRoot, "成就系统", 52, -10f);

            builtProgressText = RuntimeUIBuilder.CreateLabel(contentRoot, "已解锁 4/15", 26,
                TextAnchor.MiddleCenter, 400, 40);
            var progressRT = builtProgressText.rectTransform;
            progressRT.anchorMin = new Vector2(0.5f, 1f);
            progressRT.anchorMax = new Vector2(0.5f, 1f);
            progressRT.pivot = new Vector2(0.5f, 1f);
            progressRT.anchoredPosition = new Vector2(0, -150f);

            var tabBar = new GameObject("CategoryTabBar");
            tabBar.transform.SetParent(contentRoot, false);
            var tabBarRT = tabBar.AddComponent<RectTransform>();
            tabBarRT.anchorMin = new Vector2(0.5f, 1f);
            tabBarRT.anchorMax = new Vector2(0.5f, 1f);
            tabBarRT.pivot = new Vector2(0.5f, 1f);
            tabBarRT.anchoredPosition = new Vector2(0, -210f);
            tabBarRT.sizeDelta = new Vector2(1500, 70);

            var tabHG = tabBar.AddComponent<HorizontalLayoutGroup>();
            tabHG.spacing = 20f;
            tabHG.childAlignment = TextAnchor.MiddleCenter;
            tabHG.childControlHeight = true;
            tabHG.childControlWidth = true;
            tabHG.childForceExpandHeight = true;
            tabHG.childForceExpandWidth = true;

            builtTabButtons = new Button[Categories.Length];
            builtTabImages = new Image[Categories.Length];
            for (int i = 0; i < Categories.Length; i++)
            {
                int idx = i;
                var btn = RuntimeUIBuilder.CreateButton(tabBar.transform, Categories[i].Name,
                    new Vector2(220, 56), () => OnCategoryTabClicked(idx),
                    22, TabNormalColor, TabSelectedColor);
                builtTabButtons[i] = btn;
                builtTabImages[i] = btn.GetComponent<Image>();
            }

            var scrollViewGO = new GameObject("ScrollView");
            scrollViewGO.transform.SetParent(contentRoot, false);
            var svRT = scrollViewGO.AddComponent<RectTransform>();
            svRT.anchorMin = new Vector2(0.5f, 0.5f);
            svRT.anchorMax = new Vector2(0.5f, 0.5f);
            svRT.pivot = new Vector2(0.5f, 0.5f);
            svRT.anchoredPosition = new Vector2(0, -60f);
            svRT.sizeDelta = new Vector2(1400, 560);

            var scrollImg = scrollViewGO.AddComponent<Image>();
            scrollImg.color = new Color(0.08f, 0.1f, 0.16f, 0.6f);
            scrollImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            scrollImg.type = Image.Type.Sliced;

            var scrollRect = scrollViewGO.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.verticalScrollbarVisibility = ScrollRect.ScrollbarVisibility.Auto;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            scrollRect.scrollSensitivity = 30f;

            var viewportGO = new GameObject("Viewport");
            viewportGO.transform.SetParent(scrollViewGO.transform, false);
            var vpRT = viewportGO.AddComponent<RectTransform>();
            RuntimeUIBuilder.StretchFull(vpRT, 8f);
            var vpImg = viewportGO.AddComponent<Image>();
            vpImg.color = new Color(0, 0, 0, 0);
            viewportGO.AddComponent<Mask>();
            scrollRect.viewport = vpRT;

            scrollContentRoot = new GameObject("Content");
            scrollContentRoot.transform.SetParent(viewportGO.transform, false);
            var scRT = scrollContentRoot.AddComponent<RectTransform>();
            scRT.anchorMin = new Vector2(0.5f, 1f);
            scRT.anchorMax = new Vector2(0.5f, 1f);
            scRT.pivot = new Vector2(0.5f, 1f);
            scRT.anchoredPosition = new Vector2(0, 0);
            scRT.sizeDelta = new Vector2(1360, 0);

            var scVG = scrollContentRoot.AddComponent<VerticalLayoutGroup>();
            scVG.spacing = 14f;
            scVG.padding = new RectOffset(10, 10, 10, 10);
            scVG.childAlignment = TextAnchor.UpperCenter;
            scVG.childControlHeight = false;
            scVG.childControlWidth = true;
            scVG.childForceExpandHeight = false;
            scVG.childForceExpandWidth = true;

            var scFitter = scrollContentRoot.AddComponent<ContentSizeFitter>();
            scFitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scFitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;

            scrollRect.content = scRT;

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
            BuildAchievementRows();
        }

        private void RefreshTabs()
        {
            for (int i = 0; i < Categories.Length; i++)
            {
                if (builtTabImages[i] != null)
                {
                    builtTabImages[i].color = (i == currentCategory) ? TabSelectedColor : TabNormalColor;
                }
            }
        }

        private void UpdateProgress()
        {
            int unlocked = 0;
            foreach (var a in mockAchievements) if (a.IsUnlocked) unlocked++;
            if (builtProgressText != null)
            {
                builtProgressText.text = $"已解锁 {unlocked}/{mockAchievements.Count}";
            }
        }

        private void BuildAchievementRows()
        {
            foreach (Transform child in scrollContentRoot.transform) Destroy(child.gameObject);

            for (int i = 0; i < mockAchievements.Count; i++)
            {
                if (currentCategory > 0 && mockAchievements[i].Category != currentCategory) continue;
                CreateAchievementRow(mockAchievements[i], i);
            }
        }

        private void CreateAchievementRow(MockAchievement data, int index)
        {
            var rowGO = new GameObject($"AchievementRow_{index}");
            rowGO.transform.SetParent(scrollContentRoot.transform, false);
            var rowRT = rowGO.AddComponent<RectTransform>();
            rowRT.sizeDelta = new Vector2(1340, 100);

            var rowImg = rowGO.AddComponent<Image>();
            rowImg.color = data.IsUnlocked
                ? new Color(RowBgColor.r + 0.06f, RowBgColor.g + 0.05f, RowBgColor.b + 0.03f, RowBgColor.a)
                : RowBgColor;
            rowImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            rowImg.type = Image.Type.Sliced;

            var iconBox = RuntimeUIBuilder.CreateIconBox(rowRT, new Vector2(72, 72),
                data.IsUnlocked ? new Color(0.35f, 0.55f, 0.95f, 0.9f) : new Color(0.25f, 0.28f, 0.38f, 0.9f));
            var icRT = iconBox.rectTransform;
            icRT.anchorMin = new Vector2(0, 0.5f);
            icRT.anchorMax = new Vector2(0, 0.5f);
            icRT.pivot = new Vector2(0, 0.5f);
            icRT.anchoredPosition = new Vector2(16f, 0);

            var iconChar = RuntimeUIBuilder.CreateLabel(icRT,
                data.IsUnlocked ? GetCategoryIcon(data.Category) : "🔒", 36,
                TextAnchor.MiddleCenter, 64, 64);
            iconChar.color = data.IsUnlocked ? Color.white : new Color(0.5f, 0.5f, 0.55f);
            var iconCharRT = iconChar.rectTransform;
            RuntimeUIBuilder.StretchFull(iconCharRT, 4f);

            var titleLabel = RuntimeUIBuilder.CreateLabel(rowRT,
                data.IsUnlocked ? data.Name : "??? ???", 24,
                TextAnchor.UpperLeft, 700, 34);
            titleLabel.fontStyle = FontStyle.Bold;
            titleLabel.color = data.IsUnlocked ? Color.white : new Color(0.55f, 0.55f, 0.6f);
            var tRT = titleLabel.rectTransform;
            tRT.anchorMin = new Vector2(0, 1f);
            tRT.anchorMax = new Vector2(0, 1f);
            tRT.pivot = new Vector2(0, 1f);
            tRT.anchoredPosition = new Vector2(108f, -14f);

            var descLabel = RuntimeUIBuilder.CreateLabel(rowRT,
                data.IsUnlocked ? data.Description : "解锁条件未知", 17,
                TextAnchor.UpperLeft, 700, 26);
            descLabel.color = new Color(0.7f, 0.75f, 0.82f);
            var dRT = descLabel.rectTransform;
            dRT.anchorMin = new Vector2(0, 1f);
            dRT.anchorMax = new Vector2(0, 1f);
            dRT.pivot = new Vector2(0, 1f);
            dRT.anchoredPosition = new Vector2(108f, -50f);

            var progressBarGO = new GameObject("ProgressBar");
            progressBarGO.transform.SetParent(rowRT, false);
            var pbRT = progressBarGO.AddComponent<RectTransform>();
            pbRT.anchorMin = new Vector2(0, 0f);
            pbRT.anchorMax = new Vector2(0, 0f);
            pbRT.pivot = new Vector2(0, 0f);
            pbRT.anchoredPosition = new Vector2(108f, 14f);
            pbRT.sizeDelta = new Vector2(620, 22);

            var pbBg = progressBarGO.AddComponent<Image>();
            pbBg.color = ProgressBgColor;
            pbBg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            pbBg.type = Image.Type.Sliced;

            var pbFillGO = new GameObject("Fill");
            pbFillGO.transform.SetParent(progressBarGO.transform, false);
            var pfRT = pbFillGO.AddComponent<RectTransform>();
            pfRT.anchorMin = new Vector2(0, 0);
            pfRT.anchorMax = new Vector2(0, 1);
            pfRT.pivot = new Vector2(0, 0.5f);
            pfRT.offsetMin = new Vector2(2, 2);
            float ratio = data.TargetValue > 0
                ? Mathf.Clamp01((float)data.CurrentValue / data.TargetValue)
                : 0f;
            pfRT.offsetMax = new Vector2(Mathf.Max(2f, (620f - 4f) * ratio), -2);
            var pfImg = pbFillGO.AddComponent<Image>();
            pfImg.color = data.IsUnlocked ? new Color(0.4f, 0.9f, 0.55f) : ProgressFillColor;
            pfImg.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            pfImg.type = Image.Type.Sliced;

            int pct = data.IsUnlocked ? 100 : Mathf.RoundToInt(ratio * 100f);
            var pctLabel = RuntimeUIBuilder.CreateLabel(rowRT, $"{pct}%", 20,
                TextAnchor.MiddleRight, 90, 28);
            pctLabel.color = new Color(0.8f, 0.85f, 0.95f);
            pctLabel.fontStyle = FontStyle.Bold;
            var pctRT = pctLabel.rectTransform;
            pctRT.anchorMin = new Vector2(0, 0f);
            pctRT.anchorMax = new Vector2(0, 0f);
            pctRT.pivot = new Vector2(1, 0.5f);
            pctRT.anchoredPosition = new Vector2(740f, 25f);

            var progressLabel = RuntimeUIBuilder.CreateLabel(rowRT,
                data.IsUnlocked
                    ? $"{data.TargetValue}/{data.TargetValue}"
                    : $"{Mathf.Min(data.CurrentValue, data.TargetValue)}/{data.TargetValue}",
                16, TextAnchor.UpperRight, 200, 26);
            progressLabel.color = new Color(0.65f, 0.7f, 0.8f);
            var plRT = progressLabel.rectTransform;
            plRT.anchorMin = new Vector2(0, 1f);
            plRT.anchorMax = new Vector2(0, 1f);
            plRT.pivot = new Vector2(1, 1f);
            plRT.anchoredPosition = new Vector2(740f, -18f);

            var checkLabel = RuntimeUIBuilder.CreateLabel(rowRT,
                data.IsUnlocked ? "✓" : "", 50,
                TextAnchor.MiddleCenter, 80, 80);
            checkLabel.color = new Color(0.45f, 0.95f, 0.55f);
            checkLabel.fontStyle = FontStyle.Bold;
            var ckRT = checkLabel.rectTransform;
            ckRT.anchorMin = new Vector2(1, 0.5f);
            ckRT.anchorMax = new Vector2(1, 0.5f);
            ckRT.pivot = new Vector2(1, 0.5f);
            ckRT.anchoredPosition = new Vector2(-28f, 0);

            if (data.IsUnlocked)
            {
                var glowGO = new GameObject("UnlockedGlow");
                glowGO.transform.SetParent(rowRT, false);
                glowGO.transform.SetAsFirstSibling();
                var gRT = glowGO.AddComponent<RectTransform>();
                RuntimeUIBuilder.StretchFull(gRT);
                var gImg = glowGO.AddComponent<Image>();
                gImg.color = UnlockedGlowColor;
                gImg.raycastTarget = false;
            }
        }

        private string GetCategoryIcon(int cat)
        {
            switch (cat)
            {
                case 1: return "⛵";
                case 2: return "📷";
                case 3: return "⭐";
                case 4: return "🏆";
                default: return "★";
            }
        }

        private void OnCategoryTabClicked(int idx)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            currentCategory = idx;
            RefreshTabs();
            BuildAchievementRows();
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
            GameManager.Instance?.ChangeState(GameState.Achievements);
            UpdateProgress();
        }
    }
}
