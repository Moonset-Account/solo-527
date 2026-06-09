using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using KitchenChaos.Core;
using KitchenChaos.Config;
using KitchenChaos.Persistence;
using KitchenChaos.Leaderboards;
using KitchenChaos.Achievements;

namespace KitchenChaos.UI
{
    public class MainMenuPanel : MonoBehaviour
    {
        [Header("Pages")]
        [SerializeField] GameObject _mainRoot;
        [SerializeField] GameObject _levelSelectRoot;
        [SerializeField] GameObject _settingsRoot;
        [SerializeField] GameObject _leaderboardRoot;
        [SerializeField] GameObject _dailyRoot;
        [SerializeField] GameObject _achievementRoot;

        [Header("Main")]
        [SerializeField] Button _startButton;
        [SerializeField] Button _leaderboardButton;
        [SerializeField] Button _dailyButton;
        [SerializeField] Button _achievementButton;
        [SerializeField] Button _settingsButton;
        [SerializeField] Button _exitButton;
        [SerializeField] Toggle _singlePlayerToggle;
        [SerializeField] TMP_Text _playerNameText;
        [SerializeField] TMP_Text _totalStarsText;
        [SerializeField] TMP_Text _totalCoinsText;

        [Header("Level Select")]
        [SerializeField] Transform _levelListParent;
        [SerializeField] Button _levelBackButton;
        [SerializeField] GameObject _levelItemPrefab;

        [Header("Level Preview")]
        [SerializeField] GameObject _previewRoot;
        [SerializeField] TMP_Text _previewLevelName;
        [SerializeField] TMP_Text _previewDuration;
        [SerializeField] TMP_Text _previewRecipes;
        [SerializeField] TMP_Text _previewTips;
        [SerializeField] TMP_Text _previewBest;
        [SerializeField] Image[] _previewStars;
        [SerializeField] Button _previewStart;
        [SerializeField] Button _previewCancel;
        LevelConfig _selectedLevel;

        [Header("Daily")]
        [SerializeField] TMP_Text _dailyTitle;
        [SerializeField] TMP_Text _dailyBest;
        [SerializeField] TMP_Text _dailyStatus;
        [SerializeField] Button _dailyStart;
        [SerializeField] Button _dailyBack;

        [Header("Leaderboard")]
        [SerializeField] Transform _lbEntries;
        [SerializeField] Button _lbBack;

        [Header("Achievements")]
        [SerializeField] Transform _achEntries;
        [SerializeField] Button _achBack;

        [Header("Settings")]
        [SerializeField] TMP_InputField _nameInput;
        [SerializeField] Slider _volumeSlider;
        [SerializeField] Toggle _fullscreenToggle;
        [SerializeField] Button _settingsBack;
        [SerializeField] Button _resetSaveButton;

        void OnEnable()
        {
            AutoBuildUI();
            BindMain();
            BindLevelSelect();
            BindPreview();
            BindDaily();
            BindLeaderboard();
            BindAchievements();
            BindSettings();
            ShowMain();
            UpdateSummary();
        }

        void AutoBuildUI()
        {
            var root = (RectTransform)transform;

            EnsurePage(ref _mainRoot, root, "MainPage", out var mainContent);
            EnsurePage(ref _levelSelectRoot, root, "LevelSelectPage", out var levelContent);
            EnsurePage(ref _previewRoot, root, "PreviewPage", out var previewContent);
            EnsurePage(ref _dailyRoot, root, "DailyPage", out var dailyContent);
            EnsurePage(ref _leaderboardRoot, root, "LeaderboardPage", out var lbContent);
            EnsurePage(ref _achievementRoot, root, "AchievementPage", out var achContent);
            EnsurePage(ref _settingsRoot, root, "SettingsPage", out var settingsContent);

            BuildMainPage(mainContent);
            BuildLevelSelectPage(levelContent);
            BuildPreviewPage(previewContent);
            BuildDailyPage(dailyContent);
            BuildLeaderboardPage(lbContent);
            BuildAchievementPage(achContent);
            BuildSettingsPage(settingsContent);
        }

        static void EnsurePage(ref GameObject pageField, RectTransform parent, string name, out RectTransform content)
        {
            if (pageField == null)
            {
                var go = new GameObject(name, typeof(RectTransform));
                go.transform.SetParent(parent, false);
                var rt = (RectTransform)go.transform;
                rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero; rt.offsetMax = Vector2.zero;
                pageField = go;
            }
            content = (RectTransform)pageField.transform;
            if (content.childCount == 0)
            {
                var scrollGo = new GameObject("Content", typeof(RectTransform));
                scrollGo.transform.SetParent(content, false);
                var srt = (RectTransform)scrollGo.transform;
                srt.anchorMin = new Vector2(0.1f, 0.05f); srt.anchorMax = new Vector2(0.9f, 0.95f);
                srt.offsetMin = Vector2.zero; srt.offsetMax = Vector2.zero;
                content = srt;
            }
        }

        void BuildMainPage(RectTransform content)
        {
            AddLabel(content, "Title", "🍳 厨房混乱 KITCHEN CHAOS", 38, new Vector2(0, 0.88f), new Color(1f, 0.9f, 0.5f));
            AddLabel(ref _playerNameText, content, "PlayerName", "👨‍🍳 Chef", 22, new Vector2(0, 0.75f));
            AddLabel(ref _totalStarsText, content, "StarsText", "⭐ 0", 20, new Vector2(-0.25f, 0.68f));
            AddLabel(ref _totalCoinsText, content, "CoinsText", "💰 0", 20, new Vector2(0.25f, 0.68f));

            _startButton = AddButton(content, "StartBtn", "🚀  开 始 游 戏", new Vector2(0, 0.52f), new Vector2(420, 72));
            _dailyButton = AddButton(content, "DailyBtn", "📅  每 日 挑 战", new Vector2(0, 0.40f), new Vector2(420, 56));
            _leaderboardButton = AddButton(content, "LbBtn", "🏆  排 行 榜", new Vector2(-0.25f, 0.28f), new Vector2(200, 56));
            _achievementButton = AddButton(content, "AchBtn", "🎖  成 就", new Vector2(0.25f, 0.28f), new Vector2(200, 56));
            _settingsButton = AddButton(content, "SetBtn", "⚙️  设 置", new Vector2(-0.25f, 0.16f), new Vector2(200, 56));
            _exitButton = AddButton(content, "ExitBtn", "❌  退 出", new Vector2(0.25f, 0.16f), new Vector2(200, 56));

            AddToggle(ref _singlePlayerToggle, content, "SingleToggle", "单人模式（Tab 切角色）", new Vector2(0, 0.05f));
            _singlePlayerToggle.isOn = true;
        }

        void BuildLevelSelectPage(RectTransform content)
        {
            AddLabel(content, "LsTitle", "选择关卡", 32, new Vector2(0, 0.95f), new Color(0.9f, 1f, 1f));
            _levelBackButton = AddButton(content, "BackBtn", "←  返回主菜单", new Vector2(0.5f, 0.95f), new Vector2(200, 48));
            AddLabel(content, "Hint", "点击下方任一关卡卡片开始", 16, new Vector2(0, 0.85f), new Color(0.7f, 0.8f, 0.9f));

            var scrollGo = new GameObject("LevelCards", typeof(RectTransform), typeof(ScrollRect));
            scrollGo.transform.SetParent(content, false);
            var srt = (RectTransform)scrollGo.transform;
            srt.anchorMin = new Vector2(0.05f, 0.05f); srt.anchorMax = new Vector2(0.95f, 0.80f);
            srt.offsetMin = Vector2.zero; srt.offsetMax = Vector2.zero;

            var viewport = new GameObject("Viewport", typeof(RectTransform), typeof(RectMask2D));
            viewport.transform.SetParent(scrollGo.transform, false);
            var vrt = (RectTransform)viewport.transform;
            vrt.anchorMin = Vector2.zero; vrt.anchorMax = Vector2.one;
            vrt.offsetMin = Vector2.zero; vrt.offsetMax = Vector2.zero;

            var cardsGo = new GameObject("Cards", typeof(RectTransform), typeof(GridLayoutGroup), typeof(ContentSizeFitter));
            cardsGo.transform.SetParent(viewport.transform, false);
            var crt = (RectTransform)cardsGo.transform;
            crt.anchorMin = new Vector2(0, 1); crt.anchorMax = new Vector2(1, 1);
            crt.pivot = new Vector2(0.5f, 1); crt.sizeDelta = new Vector2(0, 600);

            var grid = cardsGo.GetComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(280, 110);
            grid.spacing = new Vector2(20, 18);
            grid.childAlignment = TextAnchor.UpperCenter;
            grid.startAxis = GridLayoutGroup.Axis.Horizontal;
            grid.startCorner = GridLayoutGroup.Corner.UpperLeft;
            grid.constraint = GridLayoutGroup.Constraint.Flexible;

            var fitter = cardsGo.GetComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            var sr = scrollGo.GetComponent<ScrollRect>();
            sr.viewport = vrt;
            sr.content = crt;
            sr.horizontal = false;
            sr.vertical = true;
            sr.scrollSensitivity = 30f;

            _levelListParent = crt;
        }

        void BuildPreviewPage(RectTransform content)
        {
            AddLabel(content, "PrevTitle", "— 关卡预览 —", 26, new Vector2(0, 0.92f), new Color(1f, 0.85f, 0.6f));
            AddLabel(ref _previewLevelName, content, "LName", "新手厨房", 30, new Vector2(0, 0.80f));
            AddLabel(ref _previewDuration, content, "LDur", "⏱ 3 分钟   🎯 目标 100", 20, new Vector2(0, 0.70f));
            AddLabel(ref _previewRecipes, content, "LRec", "食谱：Salad / Soup", 18, new Vector2(0, 0.60f));
            AddLabel(ref _previewTips, content, "LTip", "挑战自己的速度与配合！", 16, new Vector2(0, 0.50f), new Color(0.8f, 0.9f, 1f));
            AddLabel(ref _previewBest, content, "LBest", "最佳：0", 18, new Vector2(0, 0.40f));

            var starsGo = new GameObject("Stars", typeof(RectTransform));
            starsGo.transform.SetParent(content, false);
            var srt = (RectTransform)starsGo.transform;
            srt.anchoredPosition = new Vector2(0, -content.rect.height * 0.28f);
            srt.sizeDelta = new Vector2(300, 60);
            _previewStars = new Image[3];
            for (int i = 0; i < 3; i++)
            {
                var starGo = new GameObject($"Star{i}", typeof(RectTransform), typeof(Image));
                starGo.transform.SetParent(starsGo.transform, false);
                var srt_i = (RectTransform)starGo.transform;
                srt_i.anchorMin = new Vector2((float)i / 3f, 0); srt_i.anchorMax = new Vector2((float)(i + 1) / 3f, 1);
                srt_i.offsetMin = new Vector2(10, 0); srt_i.offsetMax = new Vector2(-10, 0);
                var img = starGo.GetComponent<Image>();
                img.color = new Color(1f, 1f, 1f, 0.3f);
                var txt = starGo.AddComponent<TextMeshProUGUI>();
                txt.text = "⭐"; txt.fontSize = 40; txt.alignment = TextAlignmentOptions.Center;
                _previewStars[i] = img;
            }

            _previewStart = AddButton(content, "StartBtn", "✅  开始关卡", new Vector2(-0.25f, 0.10f), new Vector2(240, 64));
            _previewCancel = AddButton(content, "CancelBtn", "✖  返回", new Vector2(0.25f, 0.10f), new Vector2(240, 64));
        }

        void BuildDailyPage(RectTransform content)
        {
            AddLabel(content, "DTitle", "📅 每日挑战", 30, new Vector2(0, 0.93f), new Color(0.9f, 1f, 0.8f));
            AddLabel(ref _dailyTitle, content, "DDate", $"每日挑战 · {DateTime.Today:yyyy/MM/dd}", 22, new Vector2(0, 0.80f));
            AddLabel(ref _dailyBest, content, "DBest", "今日最佳：0", 20, new Vector2(0, 0.70f));
            AddLabel(ref _dailyStatus, content, "DStatus", "🕒 尚未完成", 18, new Vector2(0, 0.60f));
            _dailyStart = AddButton(content, "DStartBtn", "🎯  开始每日挑战", new Vector2(0, 0.40f), new Vector2(360, 64));
            _dailyBack = AddButton(content, "DBackBtn", "←  返回", new Vector2(0, 0.20f), new Vector2(240, 56));
        }

        void BuildLeaderboardPage(RectTransform content)
        {
            AddLabel(content, "LbTitle", "🏆 排行榜", 30, new Vector2(0, 0.93f), new Color(1f, 0.9f, 0.6f));
            _lbEntries = content;
            _lbBack = AddButton(content, "LbBack", "←  返回", new Vector2(0.5f, 0.93f), new Vector2(180, 48));
        }

        void BuildAchievementPage(RectTransform content)
        {
            AddLabel(content, "AchTitle", "🎖 成就一览", 30, new Vector2(0, 0.93f), new Color(0.85f, 0.75f, 1f));
            _achEntries = content;
            _achBack = AddButton(content, "AchBack", "←  返回", new Vector2(0.5f, 0.93f), new Vector2(180, 48));
        }

        void BuildSettingsPage(RectTransform content)
        {
            AddLabel(content, "STitle", "⚙️ 设置", 30, new Vector2(0, 0.93f), new Color(0.7f, 0.9f, 1f));
            AddLabel(content, "NameLbl", "玩家名称", 18, new Vector2(-0.35f, 0.80f));
            _nameInput = AddInputField(content, "NameInput", new Vector2(0.15f, 0.80f), new Vector2(260, 44));
            AddLabel(content, "VolLbl", "音量", 18, new Vector2(-0.35f, 0.68f));
            _volumeSlider = AddSlider(content, "VolSlider", new Vector2(0.15f, 0.68f), new Vector2(260, 32), 1f);
            AddToggle(ref _fullscreenToggle, content, "FullScr", "全屏模式", new Vector2(0, 0.56f));
            _resetSaveButton = AddButton(content, "ResetBtn", "🔄  重置存档", new Vector2(-0.25f, 0.42f), new Vector2(200, 48));
            _settingsBack = AddButton(content, "SetBack", "←  保存并返回", new Vector2(0.25f, 0.42f), new Vector2(220, 48));
        }

        static TMP_Text AddLabel(RectTransform parent, string name, string text, int fontSize, Vector2 anchorY, Color? color = null)
        {
            TMP_Text tmp = null;
            AddLabel(ref tmp, parent, name, text, fontSize, anchorY, color);
            return tmp;
        }

        static void AddLabel(ref TMP_Text field, RectTransform parent, string name, string text, int fontSize, Vector2 anchorY, Color? color = null)
        {
            if (field != null) return;
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0, anchorY.y); rt.anchorMax = new Vector2(1, anchorY.y);
            rt.pivot = new Vector2(0.5f, anchorY.y > 0.5f ? 1 : 0);
            rt.sizeDelta = new Vector2(0, fontSize + 16);
            rt.anchoredPosition = new Vector2(anchorY.x * parent.rect.width, 0);
            field = go.AddComponent<TextMeshProUGUI>();
            field.text = text;
            field.fontSize = fontSize;
            field.alignment = TextAlignmentOptions.Center;
            field.color = color ?? Color.white;
            field.enableWordWrapping = true;
        }

        static Button AddButton(RectTransform parent, string name, string text, Vector2 anchor, Vector2 size)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0.5f + anchor.x * 0.5f, anchor.y);
            rt.anchorMax = rt.anchorMin;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.color = new Color(0.2f, 0.55f, 0.9f, 0.95f);
            var btn = go.GetComponent<Button>();
            var colors = btn.colors;
            colors.highlightedColor = new Color(0.3f, 0.7f, 1f);
            colors.pressedColor = new Color(0.15f, 0.4f, 0.75f);
            btn.colors = colors;
            var txtGo = new GameObject("Text", typeof(RectTransform));
            txtGo.transform.SetParent(go.transform, false);
            var trt = (RectTransform)txtGo.transform;
            trt.anchorMin = Vector2.zero; trt.anchorMax = Vector2.one;
            trt.offsetMin = Vector2.zero; trt.offsetMax = Vector2.zero;
            var txt = txtGo.AddComponent<TextMeshProUGUI>();
            txt.text = text;
            txt.fontSize = Mathf.RoundToInt(size.y * 0.4f);
            txt.alignment = TextAlignmentOptions.Center;
            txt.color = Color.white;
            txt.fontStyle = FontStyles.Bold;
            return btn;
        }

        static void AddToggle(ref Toggle field, RectTransform parent, string name, string label, Vector2 anchor)
        {
            if (field != null) return;
            var go = new GameObject(name, typeof(RectTransform), typeof(Toggle));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0.5f + anchor.x * 0.5f, anchor.y);
            rt.anchorMax = rt.anchorMin;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(360, 40);
            rt.anchoredPosition = Vector2.zero;
            field = go.GetComponent<Toggle>();

            var bgGo = new GameObject("Background", typeof(RectTransform), typeof(Image));
            bgGo.transform.SetParent(go.transform, false);
            var bgRt = (RectTransform)bgGo.transform;
            bgRt.anchorMin = new Vector2(0, 0.15f); bgRt.anchorMax = new Vector2(0.1f, 0.85f);
            bgRt.offsetMin = Vector2.zero; bgRt.offsetMax = Vector2.zero;
            bgGo.GetComponent<Image>().color = new Color(0.3f, 0.35f, 0.45f);

            var checkGo = new GameObject("Checkmark", typeof(RectTransform), typeof(Image));
            checkGo.transform.SetParent(bgGo.transform, false);
            var crt = (RectTransform)checkGo.transform;
            crt.anchorMin = new Vector2(0.2f, 0.2f); crt.anchorMax = new Vector2(0.8f, 0.8f);
            crt.offsetMin = Vector2.zero; crt.offsetMax = Vector2.zero;
            checkGo.GetComponent<Image>().color = new Color(0.4f, 0.9f, 0.5f);
            field.graphic = checkGo.GetComponent<Image>();

            var lblGo = new GameObject("Label", typeof(RectTransform));
            lblGo.transform.SetParent(go.transform, false);
            var lblRt = (RectTransform)lblGo.transform;
            lblRt.anchorMin = new Vector2(0.12f, 0); lblRt.anchorMax = Vector2.one;
            lblRt.offsetMin = Vector2.zero; lblRt.offsetMax = Vector2.zero;
            var lbl = lblGo.AddComponent<TextMeshProUGUI>();
            lbl.text = label; lbl.fontSize = 18; lbl.alignment = TextAlignmentOptions.MidlineLeft;
        }

        static TMP_InputField AddInputField(RectTransform parent, string name, Vector2 anchor, Vector2 size)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(TMP_InputField));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0.5f + anchor.x * 0.5f, anchor.y);
            rt.anchorMax = rt.anchorMin;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = Vector2.zero;
            go.GetComponent<Image>().color = new Color(0.15f, 0.18f, 0.22f);
            var input = go.GetComponent<TMP_InputField>();

            var placeGo = new GameObject("Placeholder", typeof(RectTransform));
            placeGo.transform.SetParent(go.transform, false);
            var prt = (RectTransform)placeGo.transform;
            prt.anchorMin = Vector2.zero; prt.anchorMax = Vector2.one;
            prt.offsetMin = new Vector2(12, 0); prt.offsetMax = new Vector2(-12, 0);
            var placeHolder = placeGo.AddComponent<TextMeshProUGUI>();
            placeHolder.text = "输入名称..."; placeHolder.color = new Color(1, 1, 1, 0.5f);
            placeHolder.fontSize = 18;

            var txtGo = new GameObject("Text", typeof(RectTransform));
            txtGo.transform.SetParent(go.transform, false);
            var trt = (RectTransform)txtGo.transform;
            trt.anchorMin = Vector2.zero; trt.anchorMax = Vector2.one;
            trt.offsetMin = new Vector2(12, 0); trt.offsetMax = new Vector2(-12, 0);
            var txt = txtGo.AddComponent<TextMeshProUGUI>();
            txt.color = Color.white; txt.fontSize = 18; txt.enableWordWrapping = false;

            input.textComponent = txt;
            input.placeholder = placeHolder;
            input.textViewport = trt;
            return input;
        }

        static Slider AddSlider(RectTransform parent, string name, Vector2 anchor, Vector2 size, float defVal)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Slider));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0.5f + anchor.x * 0.5f, anchor.y);
            rt.anchorMax = rt.anchorMin;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size;
            rt.anchoredPosition = Vector2.zero;
            var slider = go.GetComponent<Slider>();

            var bgGo = new GameObject("BG", typeof(RectTransform), typeof(Image));
            bgGo.transform.SetParent(go.transform, false);
            var bgRt = (RectTransform)bgGo.transform;
            bgRt.anchorMin = new Vector2(0, 0.35f); bgRt.anchorMax = new Vector2(1, 0.65f);
            bgRt.offsetMin = Vector2.zero; bgRt.offsetMax = Vector2.zero;
            bgGo.GetComponent<Image>().color = new Color(0.2f, 0.25f, 0.3f);

            var fillGo = new GameObject("Fill", typeof(RectTransform), typeof(Image));
            fillGo.transform.SetParent(go.transform, false);
            var fillRt = (RectTransform)fillGo.transform;
            fillRt.anchorMin = new Vector2(0, 0.35f); fillRt.anchorMax = new Vector2(defVal, 0.65f);
            fillRt.offsetMin = Vector2.zero; fillRt.offsetMax = Vector2.zero;
            fillGo.GetComponent<Image>().color = new Color(0.3f, 0.8f, 0.5f);
            slider.fillRect = fillRt;

            var handleGo = new GameObject("Handle", typeof(RectTransform), typeof(Image));
            handleGo.transform.SetParent(go.transform, false);
            var hRt = (RectTransform)handleGo.transform;
            hRt.anchorMin = new Vector2(defVal, 0); hRt.anchorMax = new Vector2(defVal, 1);
            hRt.pivot = new Vector2(0.5f, 0.5f);
            hRt.sizeDelta = new Vector2(size.y, size.y);
            handleGo.GetComponent<Image>().color = Color.white;
            slider.handleRect = hRt;
            slider.targetGraphic = handleGo.GetComponent<Image>();

            slider.value = defVal;
            slider.minValue = 0; slider.maxValue = 1;
            return slider;
        }

        void OnDisable()
        {
            if (_startButton) _startButton.onClick.RemoveListener(OnStart);
            if (_leaderboardButton) _leaderboardButton.onClick.RemoveListener(ShowLeaderboard);
            if (_dailyButton) _dailyButton.onClick.RemoveListener(ShowDaily);
            if (_achievementButton) _achievementButton.onClick.RemoveListener(ShowAchievements);
            if (_settingsButton) _settingsButton.onClick.RemoveListener(ShowSettings);
            if (_exitButton) _exitButton.onClick.RemoveListener(OnExit);
        }

        void BindMain()
        {
            if (_startButton) _startButton.onClick.AddListener(OnStart);
            if (_leaderboardButton) _leaderboardButton.onClick.AddListener(ShowLeaderboard);
            if (_dailyButton) _dailyButton.onClick.AddListener(ShowDaily);
            if (_achievementButton) _achievementButton.onClick.AddListener(ShowAchievements);
            if (_settingsButton) _settingsButton.onClick.AddListener(ShowSettings);
            if (_exitButton) _exitButton.onClick.AddListener(OnExit);
            if (_singlePlayerToggle) _singlePlayerToggle.onValueChanged.AddListener(v =>
            {
                var gm = ServiceLocator.Get<GameManager>();
                gm?.SetSinglePlayerMode(v);
            });
        }

        void BindLevelSelect()
        {
            if (_levelBackButton) _levelBackButton.onClick.AddListener(ShowMain);
        }

        void BindPreview()
        {
            if (_previewStart) _previewStart.onClick.AddListener(StartSelectedLevel);
            if (_previewCancel) _previewCancel.onClick.AddListener(HidePreview);
        }

        void BindDaily()
        {
            if (_dailyBack) _dailyBack.onClick.AddListener(ShowMain);
            if (_dailyStart) _dailyStart.onClick.AddListener(StartDaily);
        }

        void BindLeaderboard()
        {
            if (_lbBack) _lbBack.onClick.AddListener(ShowMain);
        }

        void BindAchievements()
        {
            if (_achBack) _achBack.onClick.AddListener(ShowMain);
        }

        void BindSettings()
        {
            if (_settingsBack) _settingsBack.onClick.AddListener(ShowMain);
            if (_nameInput) _nameInput.onEndEdit.AddListener(v =>
            {
                var save = ServiceLocator.Get<SaveSystem>();
                save?.SetPlayerName(v);
                UpdateSummary();
            });
            if (_volumeSlider) _volumeSlider.onValueChanged.AddListener(v => AudioListener.volume = v);
            if (_fullscreenToggle) _fullscreenToggle.onValueChanged.AddListener(v => Screen.fullScreen = v);
            if (_resetSaveButton) _resetSaveButton.onClick.AddListener(ResetSave);
        }

        void UpdateSummary()
        {
            var save = ServiceLocator.Get<SaveSystem>();
            if (save == null) return;
            if (_playerNameText) _playerNameText.text = $"👨‍🍳 {save.Data.PlayerName}";
            if (_totalStarsText) _totalStarsText.text = $"⭐ {save.TotalStarsEarned()}";
            if (_totalCoinsText) _totalCoinsText.text = $"💰 {save.Data.TotalCoins}";
            if (_nameInput) _nameInput.text = save.Data.PlayerName;
        }

        void HideAll()
        {
            if (_mainRoot) _mainRoot.SetActive(false);
            if (_levelSelectRoot) _levelSelectRoot.SetActive(false);
            if (_settingsRoot) _settingsRoot.SetActive(false);
            if (_leaderboardRoot) _leaderboardRoot.SetActive(false);
            if (_dailyRoot) _dailyRoot.SetActive(false);
            if (_achievementRoot) _achievementRoot.SetActive(false);
            if (_previewRoot) _previewRoot.SetActive(false);
        }

        public void ShowMain()
        {
            HideAll();
            if (_mainRoot) _mainRoot.SetActive(true);
            UpdateSummary();
            var gm = ServiceLocator.Get<GameManager>();
            gm?.ChangeState(GameState.MainMenu);
        }

        void OnStart()
        {
            HideAll();
            if (_levelSelectRoot) _levelSelectRoot.SetActive(true);
            BuildLevelList();
            var gm = ServiceLocator.Get<GameManager>();
            gm?.ChangeState(GameState.LevelSelect);
        }

        void BuildLevelList()
        {
            if (_levelListParent == null) return;
            for (int i = _levelListParent.childCount - 1; i >= 0; i--) Destroy(_levelListParent.GetChild(i).gameObject);
            var gm = ServiceLocator.Get<GameManager>();
            if (gm?.Config == null) return;
            var save = ServiceLocator.Get<SaveSystem>();
            for (int i = 0; i < gm.Config.Levels.Length; i++)
            {
                var lvl = gm.Config.Levels[i];
                var go = _levelItemPrefab != null
                    ? Instantiate(_levelItemPrefab, _levelListParent)
                    : CreateFallbackLevelItem(_levelListParent);
                var btn = go.GetComponent<Button>() ?? go.AddComponent<Button>();
                int idx = i;
                btn.onClick.AddListener(() => SelectLevel(idx));
                PopulateLevelItem(go, lvl, i, save?.GetLevelResult(i));
            }
        }

        GameObject CreateFallbackLevelItem(Transform parent)
        {
            var go = new GameObject("LevelItem", typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = new Color(0.2f, 0.25f, 0.3f, 0.95f);
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(280, 100);
            return go;
        }

        void PopulateLevelItem(GameObject go, LevelConfig cfg, int idx, LevelResult res)
        {
            var title = new GameObject("Title", typeof(RectTransform));
            title.transform.SetParent(go.transform, false);
            var t = title.AddComponent<TextMeshProUGUI>();
            t.fontSize = 22;
            t.alignment = TextAlignmentOptions.MidlineLeft;
            t.text = $"L{idx + 1} {cfg.LevelName}";
            t.color = Color.white;
            var rt = (RectTransform)title.transform;
            rt.anchorMin = new Vector2(0, 0.5f); rt.anchorMax = new Vector2(1, 1);
            rt.offsetMin = new Vector2(12, 0); rt.offsetMax = new Vector2(-12, 0);

            var starsGo = new GameObject("Stars", typeof(RectTransform));
            starsGo.transform.SetParent(go.transform, false);
            var s = starsGo.AddComponent<TextMeshProUGUI>();
            s.fontSize = 20;
            s.alignment = TextAlignmentOptions.MidlineLeft;
            int stars = res?.Stars ?? 0;
            s.text = $"⭐ x{stars}   最高 {res?.BestScore ?? 0}";
            s.color = new Color(1f, 0.85f, 0.3f);
            var rts = (RectTransform)starsGo.transform;
            rts.anchorMin = new Vector2(0, 0); rts.anchorMax = new Vector2(1, 0.5f);
            rts.offsetMin = new Vector2(12, 0); rts.offsetMax = new Vector2(-12, 0);
        }

        void SelectLevel(int idx)
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm?.Config == null) return;
            _selectedLevel = gm.Config.Levels[idx];
            if (_previewLevelName) _previewLevelName.text = _selectedLevel.LevelName;
            if (_previewDuration) _previewDuration.text = $"⏱ {_selectedLevel.Duration / 60f:0} 分钟   🎯 目标 {_selectedLevel.StarThresholds[0]}";
            if (_previewRecipes) _previewRecipes.text = "食谱：" + string.Join(" / ", _selectedLevel.AvailableRecipeNames ?? Array.Empty<string>());
            if (_previewTips) _previewTips.text = _selectedLevel.LevelTips != null && _selectedLevel.LevelTips.Length > 0 ? _selectedLevel.LevelTips[0] : "挑战自己的速度与配合！";
            var save = ServiceLocator.Get<SaveSystem>();
            var res = save?.GetLevelResult(idx);
            if (_previewBest) _previewBest.text = $"最佳：{res?.BestScore ?? 0}";
            int stars = res?.Stars ?? 0;
            for (int i = 0; i < 3; i++)
                if (_previewStars != null && i < _previewStars.Length)
                    _previewStars[i].color = i < stars ? Color.yellow : new Color(1f, 1f, 1f, 0.3f);
            if (_previewRoot) _previewRoot.SetActive(true);
            gm.ChangeState(GameState.PreGame);
        }

        void HidePreview()
        {
            if (_previewRoot) _previewRoot.SetActive(false);
        }

        void StartSelectedLevel()
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm?.Config == null || _selectedLevel == null) return;
            int idx = Array.IndexOf(gm.Config.Levels, _selectedLevel);
            if (idx < 0) idx = 0;
            HideAll();
            gm.StartLevel(idx);
        }

        void ShowDaily()
        {
            HideAll();
            if (_dailyRoot) _dailyRoot.SetActive(true);
            var dm = DailyChallengeManager.Instance;
            if (_dailyTitle) _dailyTitle.text = $"每日挑战 · {DateTime.Today:yyyy/MM/dd}";
            if (_dailyBest) _dailyBest.text = $"今日最佳：{dm?.TodayBestScore ?? 0}";
            if (_dailyStatus) _dailyStatus.text = dm?.HasCompletedToday() == true ? "✅ 已完成，可继续挑战高分" : "🕒 尚未完成";
        }

        void StartDaily()
        {
            var gm = ServiceLocator.Get<GameManager>();
            var dm = DailyChallengeManager.Instance;
            if (gm == null || dm == null) return;
            var levelCfg = dm.GetTodayChallenge();
            if (levelCfg == null || gm.Config == null || gm.Config.Levels == null || gm.Config.Levels.Length == 0) return;
            int idx = Mathf.Clamp(levelCfg.LevelIndex, 0, gm.Config.Levels.Length - 1);
            HideAll();
            gm.StartLevel(idx);
        }

        void ShowLeaderboard()
        {
            HideAll();
            if (_leaderboardRoot) _leaderboardRoot.SetActive(true);
            if (_lbEntries == null) return;
            for (int i = _lbEntries.childCount - 1; i >= 0; i--) Destroy(_lbEntries.GetChild(i).gameObject);
            var gm = ServiceLocator.Get<GameManager>();
            var lb = LeaderboardManager.Instance;
            if (gm?.Config == null || lb == null) return;
            for (int i = 0; i < gm.Config.Levels.Length; i++)
            {
                var entries = lb.GetLeaderboard($"level_{i}", 5);
                AddLbHeader($"关卡 L{i + 1} {gm.Config.Levels[i].LevelName}");
                if (entries.Count == 0) AddLbEntry(0, "暂无记录", 0, 0);
                for (int j = 0; j < entries.Count; j++)
                    AddLbEntry(j + 1, entries[j].PlayerName, entries[j].Score, entries[j].Stars);
            }
        }

        void AddLbHeader(string title)
        {
            var go = new GameObject("H", typeof(RectTransform));
            go.transform.SetParent(_lbEntries, false);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.fontSize = 18;
            t.fontStyle = FontStyles.Bold;
            t.color = new Color(0.8f, 0.95f, 1f);
            t.text = title;
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(0, 28);
        }

        void AddLbEntry(int rank, string name, int score, int stars)
        {
            var go = new GameObject($"Entry_{rank}", typeof(RectTransform));
            go.transform.SetParent(_lbEntries, false);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.fontSize = 15;
            t.color = Color.white;
            t.text = $"#{rank}  {name}  -  ${score}  ⭐ x{stars}";
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(0, 22);
        }

        void ShowAchievements()
        {
            HideAll();
            if (_achievementRoot) _achievementRoot.SetActive(true);
            if (_achEntries == null) return;
            for (int i = _achEntries.childCount - 1; i >= 0; i--) Destroy(_achEntries.GetChild(i).gameObject);
            var save = ServiceLocator.Get<SaveSystem>();
            foreach (var a in AchievementLibrary.All)
            {
                bool unlocked = save?.IsAchievementUnlocked(a.Id) == true;
                var go = new GameObject($"Ach_{a.Id}", typeof(RectTransform));
                go.transform.SetParent(_achEntries, false);
                var t = go.AddComponent<TextMeshProUGUI>();
                t.fontSize = 16;
                t.color = unlocked ? new Color(0.8f, 1f, 0.7f) : new Color(0.5f, 0.5f, 0.55f);
                t.enableWordWrapping = true;
                t.text = $"{a.Icon} {a.Name}\n{a.Description}\n奖励: 💰 {a.RewardCoins}";
                var rt = (RectTransform)go.transform;
                rt.sizeDelta = new Vector2(0, 68);
            }
        }

        void ShowSettings()
        {
            HideAll();
            if (_settingsRoot) _settingsRoot.SetActive(true);
        }

        void ResetSave()
        {
            var save = ServiceLocator.Get<SaveSystem>();
            save?.Load();
            if (save != null)
            {
                save.Data.PlayerName = "Chef";
                save.Data.TotalScore = 0;
                save.Data.TotalCoins = 0;
                save.Data.LevelResults.Clear();
                save.Data.UnlockedAchievements.Clear();
                save.SaveNow();
            }
            UpdateSummary();
        }

        void OnExit()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
