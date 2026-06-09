using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class LevelSelectPanel : UIPanelBase
    {
        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Color TabSelectedColor = new Color(0.3f, 0.6f, 1f, 0.95f);
        private static readonly Color TabNormalColor = new Color(0.25f, 0.25f, 0.35f, 0.95f);
        private static readonly Color CardBgColor = new Color(0.15f, 0.18f, 0.28f, 0.95f);
        private static readonly Color LockedOverlayColor = new Color(0, 0, 0, 0.65f);
        private static readonly Color StarOnColor = new Color(1f, 0.85f, 0.2f, 1f);
        private static readonly Color StarOffColor = new Color(0.4f, 0.4f, 0.45f, 0.5f);

        private struct MockLevelData
        {
            public string LevelName;
            public string Difficulty;
            public int Stars;
            public bool IsLocked;
            public int Chapter;

            public MockLevelData(string name, string diff, int stars, bool locked, int chapter)
            {
                LevelName = name;
                Difficulty = diff;
                Stars = stars;
                IsLocked = locked;
                Chapter = chapter;
            }
        }

        private readonly List<MockLevelData> mockLevels = new List<MockLevelData>
        {
            new MockLevelData("新手教程", "简单", 3, false, 1),
            new MockLevelData("翠湖春晓", "简单", 2, false, 1),
            new MockLevelData("迷雾仙踪", "普通", 1, false, 2),
            new MockLevelData("风暴航线", "普通", 0, false, 2),
            new MockLevelData("金秋秘境", "困难", 0, false, 3),
            new MockLevelData("终极试炼", "噩梦", 0, true, 3),
        };

        private readonly string[] chapterNames = { "第一章", "第二章", "第三章" };
        private readonly Color[] difficultyColors =
        {
            new Color(0.4f, 0.9f, 0.4f),
            new Color(0.95f, 0.85f, 0.3f),
            new Color(1f, 0.55f, 0.2f),
            new Color(0.95f, 0.3f, 0.3f)
        };

        private int currentChapter = 1;
        private Text builtTotalStarsText;
        private Text builtCurrentChapterText;
        private GameObject[] builtChapterPanels;
        private Button[] builtChapterTabButtons;
        private Image[] builtChapterTabImages;
        private GameObject cardsGridRoot;

        private void Awake()
        {
            panelType = UIType.LevelSelect;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();

            if (panelContent == null)
            {
                panelContent = RuntimeUIBuilder.CreatePanel(transform, "LevelSelectPanelContent");
                gameObject.SetActive(false);
            }

            var contentRoot = panelContent.transform;
            foreach (Transform child in contentRoot) Destroy(child.gameObject);

            RuntimeUIBuilder.CreateTitle(contentRoot, "关卡选择", 52, -10f);

            var topBar = new GameObject("TopInfoBar");
            topBar.transform.SetParent(contentRoot, false);
            var topBarRT = topBar.AddComponent<RectTransform>();
            topBarRT.anchorMin = new Vector2(0.5f, 1f);
            topBarRT.anchorMax = new Vector2(0.5f, 1f);
            topBarRT.pivot = new Vector2(0.5f, 1f);
            topBarRT.anchoredPosition = new Vector2(0, -150f);
            topBarRT.sizeDelta = new Vector2(1200, 50);

            var topHGroup = topBar.AddComponent<HorizontalLayoutGroup>();
            topHGroup.spacing = 80f;
            topHGroup.childAlignment = TextAnchor.MiddleCenter;
            topHGroup.childControlHeight = true;
            topHGroup.childForceExpandHeight = true;

            builtTotalStarsText = RuntimeUIBuilder.CreateLabel(topBar.transform, "总星数: 6/18 ★", 26,
                TextAnchor.MiddleCenter, 400, 44);
            builtCurrentChapterText = RuntimeUIBuilder.CreateLabel(topBar.transform, "当前章节: 第一章", 26,
                TextAnchor.MiddleCenter, 400, 44);

            var tabBar = new GameObject("ChapterTabBar");
            tabBar.transform.SetParent(contentRoot, false);
            var tabBarRT = tabBar.AddComponent<RectTransform>();
            tabBarRT.anchorMin = new Vector2(0.5f, 1f);
            tabBarRT.anchorMax = new Vector2(0.5f, 1f);
            tabBarRT.pivot = new Vector2(0.5f, 1f);
            tabBarRT.anchoredPosition = new Vector2(0, -220f);
            tabBarRT.sizeDelta = new Vector2(900, 70);

            var tabHGroup = tabBar.AddComponent<HorizontalLayoutGroup>();
            tabHGroup.spacing = 30f;
            tabHGroup.childAlignment = TextAnchor.MiddleCenter;
            tabHGroup.childControlHeight = true;
            tabHGroup.childControlWidth = true;
            tabHGroup.childForceExpandHeight = true;
            tabHGroup.childForceExpandWidth = true;

            builtChapterTabButtons = new Button[3];
            builtChapterTabImages = new Image[3];
            for (int i = 0; i < 3; i++)
            {
                int chapterIdx = i;
                var tabBtn = RuntimeUIBuilder.CreateButton(tabBar.transform, chapterNames[i],
                    new Vector2(260, 60), () => OnChapterTabClicked(chapterIdx + 1),
                    24, TabNormalColor, TabSelectedColor);
                builtChapterTabButtons[i] = tabBtn;
                builtChapterTabImages[i] = tabBtn.GetComponent<Image>();
            }

            cardsGridRoot = new GameObject("CardsGridRoot");
            cardsGridRoot.transform.SetParent(contentRoot, false);
            var gridRT = cardsGridRoot.AddComponent<RectTransform>();
            gridRT.anchorMin = new Vector2(0.5f, 0.5f);
            gridRT.anchorMax = new Vector2(0.5f, 0.5f);
            gridRT.pivot = new Vector2(0.5f, 0.5f);
            gridRT.anchoredPosition = new Vector2(0, -30f);
            gridRT.sizeDelta = new Vector2(1300, 520);

            var gridGroup = cardsGridRoot.AddComponent<GridLayoutGroup>();
            gridGroup.cellSize = new Vector2(380, 230);
            gridGroup.spacing = new Vector2(40, 40);
            gridGroup.startCorner = GridLayoutGroup.Corner.UpperLeft;
            gridGroup.startAxis = GridLayoutGroup.Axis.Horizontal;
            gridGroup.childAlignment = TextAnchor.MiddleCenter;
            gridGroup.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            gridGroup.constraintCount = 3;

            var bottomBar = new GameObject("BottomBar");
            bottomBar.transform.SetParent(contentRoot, false);
            var bottomRT = bottomBar.AddComponent<RectTransform>();
            bottomRT.anchorMin = new Vector2(0.5f, 0f);
            bottomRT.anchorMax = new Vector2(0.5f, 0f);
            bottomRT.pivot = new Vector2(0.5f, 0f);
            bottomRT.anchoredPosition = new Vector2(0, 50f);
            bottomRT.sizeDelta = new Vector2(400, 70);

            RuntimeUIBuilder.CreateButton(bottomBar.transform, "返回主菜单",
                new Vector2(360, 64), OnBackClicked, 26, ButtonNormalColor, ButtonHoverColor);

            RefreshChapterTabs();
            BuildLevelCards();
        }

        private void BuildLevelCards()
        {
            foreach (Transform child in cardsGridRoot.transform) Destroy(child.gameObject);

            for (int i = 0; i < mockLevels.Count; i++)
            {
                if (mockLevels[i].Chapter != currentChapter) continue;
                CreateLevelCard(mockLevels[i], i);
            }
        }

        private void CreateLevelCard(MockLevelData data, int levelIndex)
        {
            var cardGO = new GameObject($"LevelCard_{data.LevelName}");
            cardGO.transform.SetParent(cardsGridRoot.transform, false);
            var cardRT = cardGO.AddComponent<RectTransform>();
            cardRT.sizeDelta = new Vector2(380, 230);

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
            cardBtn.interactable = !data.IsLocked;

            if (!data.IsLocked)
            {
                int idx = levelIndex;
                cardBtn.onClick.AddListener(() => OnLevelCardClicked(idx));
            }

            var contentRT = cardImg.rectTransform;

            var nameText = RuntimeUIBuilder.CreateLabel(contentRT, data.LevelName, 28,
                TextAnchor.MiddleCenter, 340, 44);
            var nameRT = nameText.rectTransform;
            nameRT.anchorMin = new Vector2(0.5f, 1f);
            nameRT.anchorMax = new Vector2(0.5f, 1f);
            nameRT.pivot = new Vector2(0.5f, 1f);
            nameRT.anchoredPosition = new Vector2(0, -28f);

            var diffText = RuntimeUIBuilder.CreateLabel(contentRT, data.Difficulty, 20,
                TextAnchor.MiddleCenter, 120, 32);
            int diffIdx = Mathf.Clamp(System.Array.IndexOf(new[] { "简单", "普通", "困难", "噩梦" }, data.Difficulty), 0, 3);
            diffText.color = difficultyColors[diffIdx];
            diffText.fontStyle = FontStyle.Bold;
            var diffRT = diffText.rectTransform;
            diffRT.anchorMin = new Vector2(0.5f, 1f);
            diffRT.anchorMax = new Vector2(0.5f, 1f);
            diffRT.pivot = new Vector2(0.5f, 1f);
            diffRT.anchoredPosition = new Vector2(0, -72f);

            var starsGO = new GameObject("StarsRow");
            starsGO.transform.SetParent(contentRT, false);
            var starsRT = starsGO.AddComponent<RectTransform>();
            starsRT.anchorMin = new Vector2(0.5f, 0.5f);
            starsRT.anchorMax = new Vector2(0.5f, 0.5f);
            starsRT.pivot = new Vector2(0.5f, 0.5f);
            starsRT.anchoredPosition = new Vector2(0, -10f);
            starsRT.sizeDelta = new Vector2(240, 56);

            var starsHG = starsGO.AddComponent<HorizontalLayoutGroup>();
            starsHG.spacing = 16f;
            starsHG.childAlignment = TextAnchor.MiddleCenter;
            starsHG.childControlHeight = true;
            starsHG.childControlWidth = true;
            starsHG.childForceExpandHeight = true;
            starsHG.childForceExpandWidth = true;

            for (int s = 0; s < 3; s++)
            {
                var starGO = new GameObject($"Star_{s}");
                starGO.transform.SetParent(starsRT, false);
                var starRT = starGO.AddComponent<RectTransform>();
                starRT.sizeDelta = new Vector2(56, 56);
                var starImg = starGO.AddComponent<Image>();
                starImg.color = s < data.Stars ? StarOnColor : StarOffColor;
                starImg.sprite = CreateStarSprite();
                starImg.type = Image.Type.Simple;
                starImg.preserveAspect = true;
            }

            var statusText = RuntimeUIBuilder.CreateLabel(contentRT,
                data.IsLocked ? "🔒 未解锁" : "点击开始", 22,
                TextAnchor.MiddleCenter, 320, 40);
            statusText.color = data.IsLocked ? new Color(0.7f, 0.7f, 0.75f) : new Color(0.6f, 0.9f, 1f);
            var statusRT = statusText.rectTransform;
            statusRT.anchorMin = new Vector2(0.5f, 0f);
            statusRT.anchorMax = new Vector2(0.5f, 0f);
            statusRT.pivot = new Vector2(0.5f, 0f);
            statusRT.anchoredPosition = new Vector2(0, 24f);

            if (data.IsLocked)
            {
                var lockGO = new GameObject("LockOverlay");
                lockGO.transform.SetParent(contentRT, false);
                var lockRT = lockGO.AddComponent<RectTransform>();
                RuntimeUIBuilder.StretchFull(lockRT);
                var lockImg = lockGO.AddComponent<Image>();
                lockImg.color = LockedOverlayColor;
                lockImg.raycastTarget = false;
            }
        }

        private Sprite CreateStarSprite()
        {
            int size = 64;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            var colors = new Color[size * size];
            Vector2 center = new Vector2(size / 2f, size / 2f);
            float outerR = size * 0.46f;
            float innerR = size * 0.2f;
            int points = 5;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    Vector2 p = new Vector2(x, y) - center;
                    float dist = p.magnitude;
                    float angle = Mathf.Atan2(p.y, p.x) * Mathf.Rad2Deg;
                    if (angle < 0) angle += 360f;
                    float seg = 360f / (points * 2);
                    float segIdx = Mathf.Floor(angle / seg);
                    float t = (angle - segIdx * seg) / seg;
                    float r = (segIdx % 2 == 0) ? outerR : innerR;
                    float nextR = ((segIdx + 1) % 2 == 0) ? outerR : innerR;
                    float radius = Mathf.Lerp(r, nextR, t);
                    colors[y * size + x] = dist <= radius ? Color.white : new Color(0, 0, 0, 0);
                }
            }
            tex.SetPixels(colors);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        private void RefreshChapterTabs()
        {
            for (int i = 0; i < 3; i++)
            {
                if (builtChapterTabImages[i] != null)
                {
                    builtChapterTabImages[i].color = (i + 1 == currentChapter) ? TabSelectedColor : TabNormalColor;
                }
            }
            if (builtCurrentChapterText != null)
            {
                builtCurrentChapterText.text = $"当前章节: {chapterNames[currentChapter - 1]}";
            }
        }

        private void UpdateTotalStars()
        {
            int total = 0;
            foreach (var l in mockLevels) total += l.Stars;
            int max = mockLevels.Count * 3;
            if (builtTotalStarsText != null)
            {
                builtTotalStarsText.text = $"总星数: {total}/{max} ★";
            }
        }

        private void OnChapterTabClicked(int chapter)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            currentChapter = chapter;
            RefreshChapterTabs();
            BuildLevelCards();
        }

        private void OnLevelCardClicked(int levelIndex)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (levelIndex < 0 || levelIndex >= mockLevels.Count) return;
            var data = mockLevels[levelIndex];
            if (data.IsLocked) return;

            GameManager.Instance?.SetCurrentLevel($"Level{levelIndex + 1}", (levelIndex / 2) + 1);
            GameManager.Instance?.ChangeState(GameState.Playing);
            Close();
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
            GameManager.Instance?.ChangeState(GameState.LevelSelect);
            UpdateTotalStars();
        }
    }
}
