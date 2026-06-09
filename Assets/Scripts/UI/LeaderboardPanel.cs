using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;

namespace LakeSailing.UI
{
    public class LeaderboardPanel : UIPanelBase
    {
        private static readonly Color ButtonNormalColor = new Color(0.2f, 0.45f, 0.9f, 0.95f);
        private static readonly Color ButtonHoverColor = new Color(0.2f * 1.3f, 0.45f * 1.3f, 0.9f * 1.3f, 1f);
        private static readonly Color ConfirmColor = new Color(0.2f, 0.7f, 0.4f, 0.95f);
        private static readonly Color ConfirmHoverColor = new Color(0.2f * 1.3f, 0.7f * 1.3f, 0.4f * 1.3f, 1f);
        private static readonly Color TabNormalColor = new Color(0.25f, 0.25f, 0.35f, 0.95f);
        private static readonly Color TabSelectedColor = new Color(0.3f, 0.6f, 1f, 0.95f);
        private static readonly Color RowBgColor = new Color(0.14f, 0.17f, 0.26f, 0.95f);
        private static readonly Color PlayerHighlightColor = new Color(0.2f, 0.4f, 0.7f, 0.95f);
        private static readonly Color LevelBtnNormalColor = new Color(0.22f, 0.28f, 0.4f, 0.95f);
        private static readonly Color LevelBtnSelectedColor = new Color(0.35f, 0.55f, 0.95f, 0.95f);

        private struct LevelEntry
        {
            public int Rank;
            public string PlayerName;
            public int Score;
            public int Stars;
            public string Time;

            public LevelEntry(int r, string n, int s, int st, string t)
            {
                Rank = r; PlayerName = n; Score = s; Stars = st; Time = t;
            }
        }

        private struct GlobalEntry
        {
            public int Rank;
            public string PlayerName;
            public string Flag;
            public int Score;
            public string Time;
            public bool IsPlayer;

            public GlobalEntry(int r, string n, string f, int s, string t, bool p = false)
            {
                Rank = r; PlayerName = n; Flag = f; Score = s; Time = t; IsPlayer = p;
            }
        }

        private readonly string[] levelNames = { "翠湖春晓", "迷雾仙踪", "风暴航线" };

        private readonly List<List<LevelEntry>> mockLevelBoards = new List<List<LevelEntry>>
        {
            new List<LevelEntry>
            {
                new LevelEntry(1, "WindMaster", 12850, 3, "04:12"),
                new LevelEntry(2, "湖面漫步者", 11920, 3, "04:45"),
                new LevelEntry(3, "SailorBob", 10560, 2, "05:02"),
                new LevelEntry(4, "晨曦之星", 9840, 2, "05:18"),
                new LevelEntry(5, "CaptainLee", 9120, 2, "05:34"),
                new LevelEntry(6, "追光者", 8760, 2, "05:51"),
                new LevelEntry(7, "Navigator", 8010, 1, "06:12"),
                new LevelEntry(8, "青山绿水", 7650, 1, "06:28"),
                new LevelEntry(9, "StormRider", 7200, 1, "06:45"),
                new LevelEntry(10, "小船长", 6890, 1, "07:03"),
            },
            new List<LevelEntry>
            {
                new LevelEntry(1, "迷雾猎手", 15680, 3, "05:22"),
                new LevelEntry(2, "摄影艺术家", 14520, 3, "05:50"),
                new LevelEntry(3, "LakeDreamer", 13200, 2, "06:15"),
                new LevelEntry(4, "云中客", 12100, 2, "06:38"),
                new LevelEntry(5, "FogWatcher", 11450, 2, "06:59"),
                new LevelEntry(6, "寂静之声", 10800, 2, "07:20"),
                new LevelEntry(7, "Wanderer", 9960, 1, "07:45"),
                new LevelEntry(8, "雾都孤儿", 9350, 1, "08:02"),
                new LevelEntry(9, "GhostShip", 8720, 1, "08:24"),
                new LevelEntry(10, "探索者", 8100, 1, "08:48"),
            },
            new List<LevelEntry>
            {
                new LevelEntry(1, "风暴征服者", 22580, 3, "06:40"),
                new LevelEntry(2, "无畏者号", 20950, 3, "07:12"),
                new LevelEntry(3, "ThunderBold", 18720, 2, "07:38"),
                new LevelEntry(4, "破浪前行", 17340, 2, "08:05"),
                new LevelEntry(5, "SeaWolf", 16100, 2, "08:32"),
                new LevelEntry(6, "风雨无阻", 14880, 2, "09:00"),
                new LevelEntry(7, "Hurricane", 13560, 1, "09:28"),
                new LevelEntry(8, "风中残烛", 12400, 1, "09:55"),
                new LevelEntry(9, "RoughSea", 11220, 1, "10:20"),
                new LevelEntry(10, "勇敢的心", 10080, 1, "10:48"),
            },
        };

        private readonly List<GlobalEntry> mockGlobalBoard = new List<GlobalEntry>
        {
            new GlobalEntry(1, "OceanKing", "🇺🇸", 248900, "32:15:40"),
            new GlobalEntry(2, "龙王传说", "🇨🇳", 235600, "35:02:18"),
            new GlobalEntry(3, "風の侍", "🇯🇵", 221800, "36:44:52"),
            new GlobalEntry(4, "LakeVoyager", "🇬🇧", 208400, "38:20:10"),
            new GlobalEntry(5, "北海船长", "🇩🇪", 196200, "40:11:35"),
            new GlobalEntry(6, "自由之翼", "🇫🇷", 184500, "42:30:08"),
            new GlobalEntry(7, "Explorer", "🇨🇦", 173800, "44:18:44"),
            new GlobalEntry(8, "千岛之主", "🇯🇵", 162900, "46:05:22"),
            new GlobalEntry(9, "SailForever", "🇦🇺", 151200, "48:40:50"),
            new GlobalEntry(10, "华夏水手", "🇨🇳", 142800, "50:22:15"),
            new GlobalEntry(100, "本地玩家", "🇨🇳", 18560, "08:12:30", true),
        };

        private bool isGlobalTab = true;
        private int currentLevelIndex = 0;

        private Text builtTotalPlayersText;
        private Text builtBestRankText;
        private Text builtHighestScoreText;

        private Button[] builtMainTabButtons;
        private Image[] builtMainTabImages;
        private Button[] builtLevelTabButtons;
        private Image[] builtLevelTabImages;

        private GameObject levelBoardContainer;
        private GameObject globalBoardContainer;
        private GameObject levelBoardListRoot;
        private GameObject globalBoardListRoot;

        private void Awake()
        {
            panelType = UIType.Leaderboard;
            UIManager.Instance?.RegisterPanel(panelType, this);
            BuildUI();
        }

        private void BuildUI()
        {
            RuntimeUIBuilder.EnsureEventSystem();

            if (panelContent == null)
            {
                panelContent = RuntimeUIBuilder.CreatePanel(transform, "LeaderboardPanelContent");
                gameObject.SetActive(false);
            }

            var contentRoot = panelContent.transform;
            foreach (Transform child in contentRoot) Destroy(child.gameObject);

            RuntimeUIBuilder.CreateTitle(contentRoot, "排行榜", 52, -10f);

            var statsBar = new GameObject("StatsBar");
            statsBar.transform.SetParent(contentRoot, false);
            var statsRT = statsBar.AddComponent<RectTransform>();
            statsRT.anchorMin = new Vector2(0.5f, 1f);
            statsRT.anchorMax = new Vector2(0.5f, 1f);
            statsRT.pivot = new Vector2(0.5f, 1f);
            statsRT.anchoredPosition = new Vector2(0, -120f);
            statsRT.sizeDelta = new Vector2(1500, 50);

            var statsHG = statsBar.AddComponent<HorizontalLayoutGroup>();
            statsHG.spacing = 60f;
            statsHG.childAlignment = TextAnchor.MiddleCenter;
            statsHG.childControlHeight = true;

            builtTotalPlayersText = RuntimeUIBuilder.CreateLabel(statsBar.transform, "总参与: 12,845 人", 22,
                TextAnchor.MiddleCenter, 350, 40);
            builtBestRankText = RuntimeUIBuilder.CreateLabel(statsBar.transform, "最佳排名: 第 100 名", 22,
                TextAnchor.MiddleCenter, 350, 40);
            builtHighestScoreText = RuntimeUIBuilder.CreateLabel(statsBar.transform, "最高分数: 18,560", 22,
                TextAnchor.MiddleCenter, 350, 40);

            var mainTabBar = new GameObject("MainTabBar");
            mainTabBar.transform.SetParent(contentRoot, false);
            var mainTabRT = mainTabBar.AddComponent<RectTransform>();
            mainTabRT.anchorMin = new Vector2(0.5f, 1f);
            mainTabRT.anchorMax = new Vector2(0.5f, 1f);
            mainTabRT.pivot = new Vector2(0.5f, 1f);
            mainTabRT.anchoredPosition = new Vector2(0, -190f);
            mainTabRT.sizeDelta = new Vector2(700, 64);

            var mainTabHG = mainTabBar.AddComponent<HorizontalLayoutGroup>();
            mainTabHG.spacing = 30f;
            mainTabHG.childAlignment = TextAnchor.MiddleCenter;
            mainTabHG.childControlHeight = true;
            mainTabHG.childControlWidth = true;
            mainTabHG.childForceExpandHeight = true;
            mainTabHG.childForceExpandWidth = true;

            builtMainTabButtons = new Button[2];
            builtMainTabImages = new Image[2];
            string[] mainTabNames = { "全球榜", "关卡榜" };
            for (int i = 0; i < 2; i++)
            {
                int idx = i;
                var btn = RuntimeUIBuilder.CreateButton(mainTabBar.transform, mainTabNames[i],
                    new Vector2(300, 54), () => OnMainTabClicked(idx == 0),
                    24, TabNormalColor, TabSelectedColor);
                builtMainTabButtons[i] = btn;
                builtMainTabImages[i] = btn.GetComponent<Image>();
            }

            var mainArea = new GameObject("MainArea");
            mainArea.transform.SetParent(contentRoot, false);
            var mainAreaRT = mainArea.AddComponent<RectTransform>();
            mainAreaRT.anchorMin = new Vector2(0.5f, 0.5f);
            mainAreaRT.anchorMax = new Vector2(0.5f, 0.5f);
            mainAreaRT.pivot = new Vector2(0.5f, 0.5f);
            mainAreaRT.anchoredPosition = new Vector2(0, -60f);
            mainAreaRT.sizeDelta = new Vector2(1500, 540);

            var mainAreaHG = mainArea.AddComponent<HorizontalLayoutGroup>();
            mainAreaHG.spacing = 24f;
            mainAreaHG.padding = new RectOffset(10, 10, 10, 10);
            mainAreaHG.childAlignment = TextAnchor.UpperCenter;
            mainAreaHG.childControlHeight = true;
            mainAreaHG.childControlWidth = true;
            mainAreaHG.childForceExpandHeight = true;
            mainAreaHG.childForceExpandWidth = false;

            levelBoardContainer = CreateBoardContainer(mainAreaRT, "LevelBoardContainer", new Vector2(420, 520));
            globalBoardContainer = CreateBoardContainer(mainAreaRT, "GlobalBoardContainer", new Vector2(1020, 520));

            BuildLevelBoardContent(levelBoardContainer.GetComponent<RectTransform>());
            BuildGlobalBoardContent(globalBoardContainer.GetComponent<RectTransform>());

            var bottomBar = new GameObject("BottomBar");
            bottomBar.transform.SetParent(contentRoot, false);
            var bottomRT = bottomBar.AddComponent<RectTransform>();
            bottomRT.anchorMin = new Vector2(0.5f, 0f);
            bottomRT.anchorMax = new Vector2(0.5f, 0f);
            bottomRT.pivot = new Vector2(0.5f, 0f);
            bottomRT.anchoredPosition = new Vector2(0, 50f);
            bottomRT.sizeDelta = new Vector2(820, 70);

            var bottomHG = bottomBar.AddComponent<HorizontalLayoutGroup>();
            bottomHG.spacing = 40f;
            bottomHG.childAlignment = TextAnchor.MiddleCenter;

            RuntimeUIBuilder.CreateButton(bottomBar.transform, "刷新",
                new Vector2(340, 64), OnRefreshClicked, 26, ConfirmColor, ConfirmHoverColor);
            RuntimeUIBuilder.CreateButton(bottomBar.transform, "返回",
                new Vector2(340, 64), OnBackClicked, 26, ButtonNormalColor, ButtonHoverColor);

            RefreshMainTabs();
            SwitchBoardVisibility();
            RefreshLevelTabs();
            BuildLevelBoardRows();
            BuildGlobalBoardRows();
        }

        private GameObject CreateBoardContainer(Transform parent, string name, Vector2 size)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.sizeDelta = size;
            var img = go.AddComponent<Image>();
            img.color = new Color(0.1f, 0.12f, 0.18f, 0.6f);
            img.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            img.type = Image.Type.Sliced;
            return go;
        }

        private void BuildLevelBoardContent(RectTransform parent)
        {
            var levelTabBar = new GameObject("LevelTabBar");
            levelTabBar.transform.SetParent(parent, false);
            var ltRT = levelTabBar.AddComponent<RectTransform>();
            ltRT.anchorMin = new Vector2(0.5f, 1f);
            ltRT.anchorMax = new Vector2(0.5f, 1f);
            ltRT.pivot = new Vector2(0.5f, 1f);
            ltRT.anchoredPosition = new Vector2(0, -12f);
            ltRT.sizeDelta = new Vector2(390, 380);

            var ltVG = levelTabBar.AddComponent<VerticalLayoutGroup>();
            ltVG.spacing = 14f;
            ltVG.padding = new RectOffset(5, 5, 5, 5);
            ltVG.childAlignment = TextAnchor.UpperCenter;
            ltVG.childControlHeight = false;
            ltVG.childControlWidth = true;
            ltVG.childForceExpandHeight = false;
            ltVG.childForceExpandWidth = true;

            var hintLabel = RuntimeUIBuilder.CreateLabel(levelTabBar.transform, "选择关卡", 20,
                TextAnchor.MiddleCenter, 370, 32);
            hintLabel.color = new Color(0.7f, 0.75f, 0.85f);

            builtLevelTabButtons = new Button[levelNames.Length];
            builtLevelTabImages = new Image[levelNames.Length];
            for (int i = 0; i < levelNames.Length; i++)
            {
                int idx = i;
                var btn = RuntimeUIBuilder.CreateButton(levelTabBar.transform, levelNames[i],
                    new Vector2(380, 70), () => OnLevelTabClicked(idx),
                    20, LevelBtnNormalColor, LevelBtnSelectedColor);
                builtLevelTabButtons[i] = btn;
                builtLevelTabImages[i] = btn.GetComponent<Image>();
            }

            levelBoardListRoot = new GameObject("ListRoot");
            levelBoardListRoot.transform.SetParent(parent, false);
            var lbrRT = levelBoardListRoot.AddComponent<RectTransform>();
            lbrRT.anchorMin = new Vector2(0.5f, 1f);
            lbrRT.anchorMax = new Vector2(0.5f, 1f);
            lbrRT.pivot = new Vector2(0.5f, 1f);
            lbrRT.anchoredPosition = new Vector2(0, -410f);
            lbrRT.sizeDelta = new Vector2(390, 100);

            var listHint = RuntimeUIBuilder.CreateLabel(lbrRT, "← 请选择关卡", 18,
                TextAnchor.MiddleCenter, 370, 36);
            listHint.color = new Color(0.6f, 0.65f, 0.75f);
        }

        private void BuildGlobalBoardContent(RectTransform parent)
        {
            var headerGO = new GameObject("HeaderRow");
            headerGO.transform.SetParent(parent, false);
            var hRT = headerGO.AddComponent<RectTransform>();
            hRT.anchorMin = new Vector2(0.5f, 1f);
            hRT.anchorMax = new Vector2(0.5f, 1f);
            hRT.pivot = new Vector2(0.5f, 1f);
            hRT.anchoredPosition = new Vector2(0, -14f);
            hRT.sizeDelta = new Vector2(980, 40);

            string[] headers = { "排名", "玩家", "分数", "用时" };
            float[] widths = { 100, 360, 260, 200 };
            TextAnchor[] anchors = { TextAnchor.MiddleCenter, TextAnchor.MiddleLeft, TextAnchor.MiddleRight, TextAnchor.MiddleCenter };
            var headerHG = headerGO.AddComponent<HorizontalLayoutGroup>();
            headerHG.spacing = 10f;
            headerHG.childAlignment = TextAnchor.MiddleLeft;
            headerHG.childControlHeight = true;

            for (int i = 0; i < headers.Length; i++)
            {
                var t = RuntimeUIBuilder.CreateLabel(headerGO.transform, headers[i], 18,
                    anchors[i], widths[i], 36);
                t.color = new Color(0.75f, 0.8f, 0.9f);
                t.fontStyle = FontStyle.Bold;
            }

            var scrollViewGO = new GameObject("ScrollView");
            scrollViewGO.transform.SetParent(parent, false);
            var svRT = scrollViewGO.AddComponent<RectTransform>();
            svRT.anchorMin = new Vector2(0.5f, 1f);
            svRT.anchorMax = new Vector2(0.5f, 1f);
            svRT.pivot = new Vector2(0.5f, 1f);
            svRT.anchoredPosition = new Vector2(0, -64f);
            svRT.sizeDelta = new Vector2(980, 430);

            var scrollRect = scrollViewGO.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            scrollRect.scrollSensitivity = 30f;

            var viewportGO = new GameObject("Viewport");
            viewportGO.transform.SetParent(scrollViewGO.transform, false);
            var vpRT = viewportGO.AddComponent<RectTransform>();
            RuntimeUIBuilder.StretchFull(vpRT);
            viewportGO.AddComponent<Image>().color = new Color(0, 0, 0, 0);
            viewportGO.AddComponent<Mask>();
            scrollRect.viewport = vpRT;

            globalBoardListRoot = new GameObject("Content");
            globalBoardListRoot.transform.SetParent(viewportGO.transform, false);
            var gbRT = globalBoardListRoot.AddComponent<RectTransform>();
            gbRT.anchorMin = new Vector2(0.5f, 1f);
            gbRT.anchorMax = new Vector2(0.5f, 1f);
            gbRT.pivot = new Vector2(0.5f, 1f);
            gbRT.anchoredPosition = Vector2.zero;
            gbRT.sizeDelta = new Vector2(980, 0);

            var gbVG = globalBoardListRoot.AddComponent<VerticalLayoutGroup>();
            gbVG.spacing = 4f;
            gbVG.padding = new RectOffset(0, 0, 2, 2);
            gbVG.childAlignment = TextAnchor.UpperCenter;
            gbVG.childControlHeight = false;
            gbVG.childControlWidth = true;
            gbVG.childForceExpandHeight = false;
            gbVG.childForceExpandWidth = true;

            var gbFitter = globalBoardListRoot.AddComponent<ContentSizeFitter>();
            gbFitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            gbFitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;

            scrollRect.content = gbRT;
        }

        private void RefreshMainTabs()
        {
            for (int i = 0; i < 2; i++)
            {
                if (builtMainTabImages[i] != null)
                {
                    bool selected = (i == 0 && isGlobalTab) || (i == 1 && !isGlobalTab);
                    builtMainTabImages[i].color = selected ? TabSelectedColor : TabNormalColor;
                }
            }
        }

        private void RefreshLevelTabs()
        {
            for (int i = 0; i < levelNames.Length; i++)
            {
                if (builtLevelTabImages[i] != null)
                {
                    builtLevelTabImages[i].color = (i == currentLevelIndex)
                        ? LevelBtnSelectedColor
                        : LevelBtnNormalColor;
                }
            }
        }

        private void SwitchBoardVisibility()
        {
            if (levelBoardContainer != null) levelBoardContainer.SetActive(!isGlobalTab);
            if (globalBoardContainer != null) globalBoardContainer.SetActive(isGlobalTab);
        }

        private Color GetRankBgColor(int rank)
        {
            switch (rank)
            {
                case 1: return new Color(1f, 0.82f, 0.18f, 0.45f);
                case 2: return new Color(0.78f, 0.78f, 0.82f, 0.35f);
                case 3: return new Color(0.82f, 0.55f, 0.25f, 0.35f);
                default: return RowBgColor;
            }
        }

        private Color GetRankTextColor(int rank)
        {
            switch (rank)
            {
                case 1: return new Color(1f, 0.9f, 0.3f);
                case 2: return new Color(0.9f, 0.9f, 0.95f);
                case 3: return new Color(1f, 0.7f, 0.35f);
                default: return Color.white;
            }
        }

        private void BuildLevelBoardRows()
        {
            if (levelBoardListRoot == null) return;
            foreach (Transform child in levelBoardListRoot.transform) Destroy(child.gameObject);

            var data = mockLevelBoards[currentLevelIndex];

            var containerGO = new GameObject("RowsContainer");
            containerGO.transform.SetParent(levelBoardListRoot.transform, false);
            var cRT = containerGO.AddComponent<RectTransform>();
            RuntimeUIBuilder.StretchFull(cRT);

            var vg = containerGO.AddComponent<VerticalLayoutGroup>();
            vg.spacing = 3f;
            vg.childAlignment = TextAnchor.UpperCenter;
            vg.childControlHeight = false;
            vg.childControlWidth = true;
            vg.childForceExpandHeight = false;
            vg.childForceExpandWidth = true;

            for (int i = 0; i < data.Count; i++)
            {
                CreateLevelBoardRow(vg.transform, data[i], i);
            }
        }

        private void CreateLevelBoardRow(Transform parent, LevelEntry entry, int idx)
        {
            var rowGO = new GameObject($"Row_{idx}");
            rowGO.transform.SetParent(parent, false);
            var rt = rowGO.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(380, 42);

            var img = rowGO.AddComponent<Image>();
            img.color = GetRankBgColor(entry.Rank);
            img.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            img.type = Image.Type.Sliced;

            var hg = rowGO.AddComponent<HorizontalLayoutGroup>();
            hg.spacing = 4f;
            hg.padding = new RectOffset(6, 6, 3, 3);
            hg.childAlignment = TextAnchor.MiddleLeft;
            hg.childControlHeight = true;

            var rankT = RuntimeUIBuilder.CreateLabel(hg.transform, entry.Rank.ToString(), 18,
                TextAnchor.MiddleCenter, 46, 34);
            rankT.color = GetRankTextColor(entry.Rank);
            rankT.fontStyle = FontStyle.Bold;

            var nameT = RuntimeUIBuilder.CreateLabel(hg.transform, entry.PlayerName, 16,
                TextAnchor.MiddleLeft, 130, 34);
            nameT.color = Color.white;

            var starsStr = new string('★', entry.Stars) + new string('☆', Mathf.Max(0, 3 - entry.Stars));
            var starsT = RuntimeUIBuilder.CreateLabel(hg.transform, starsStr, 16,
                TextAnchor.MiddleCenter, 66, 34);
            starsT.color = new Color(1f, 0.85f, 0.25f);

            var scoreT = RuntimeUIBuilder.CreateLabel(hg.transform, entry.Score.ToString("N0"), 16,
                TextAnchor.MiddleRight, 78, 34);
            scoreT.color = new Color(0.85f, 0.95f, 1f);

            var timeT = RuntimeUIBuilder.CreateLabel(hg.transform, entry.Time, 14,
                TextAnchor.MiddleCenter, 44, 34);
            timeT.color = new Color(0.7f, 0.75f, 0.85f);
        }

        private void BuildGlobalBoardRows()
        {
            if (globalBoardListRoot == null) return;
            foreach (Transform child in globalBoardListRoot.transform) Destroy(child.gameObject);

            for (int i = 0; i < mockGlobalBoard.Count; i++)
            {
                CreateGlobalBoardRow(globalBoardListRoot.transform, mockGlobalBoard[i], i);
            }
        }

        private void CreateGlobalBoardRow(Transform parent, GlobalEntry entry, int idx)
        {
            var rowGO = new GameObject($"Row_{idx}");
            rowGO.transform.SetParent(parent, false);
            var rt = rowGO.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(980, 48);

            var img = rowGO.AddComponent<Image>();
            img.color = entry.IsPlayer ? PlayerHighlightColor : GetRankBgColor(entry.Rank);
            img.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            img.type = Image.Type.Sliced;

            var hg = rowGO.AddComponent<HorizontalLayoutGroup>();
            hg.spacing = 10f;
            hg.padding = new RectOffset(10, 10, 4, 4);
            hg.childAlignment = TextAnchor.MiddleLeft;
            hg.childControlHeight = true;

            var rankT = RuntimeUIBuilder.CreateLabel(hg.transform, entry.Rank.ToString(), 22,
                TextAnchor.MiddleCenter, 90, 40);
            rankT.color = entry.IsPlayer ? Color.white : GetRankTextColor(entry.Rank);
            rankT.fontStyle = FontStyle.Bold;

            var playerDisplay = $"{entry.Flag} {entry.PlayerName}";
            if (entry.IsPlayer) playerDisplay += " (我)";
            var nameT = RuntimeUIBuilder.CreateLabel(hg.transform, playerDisplay, 20,
                TextAnchor.MiddleLeft, 350, 40);
            nameT.color = Color.white;

            var scoreT = RuntimeUIBuilder.CreateLabel(hg.transform, entry.Score.ToString("N0"), 22,
                TextAnchor.MiddleRight, 250, 40);
            scoreT.color = new Color(0.9f, 0.95f, 1f);
            scoreT.fontStyle = FontStyle.Bold;

            var timeT = RuntimeUIBuilder.CreateLabel(hg.transform, entry.Time, 18,
                TextAnchor.MiddleCenter, 190, 40);
            timeT.color = new Color(0.75f, 0.8f, 0.9f);
        }

        private void OnMainTabClicked(bool global)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            isGlobalTab = global;
            RefreshMainTabs();
            SwitchBoardVisibility();
        }

        private void OnLevelTabClicked(int idx)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            currentLevelIndex = idx;
            RefreshLevelTabs();
            BuildLevelBoardRows();
        }

        private void OnRefreshClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (!isGlobalTab) BuildLevelBoardRows();
            else BuildGlobalBoardRows();
            UIManager.Instance?.ShowNotification("排行榜已刷新", 1.2f);
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
            GameManager.Instance?.ChangeState(GameState.Leaderboard);
        }
    }
}
