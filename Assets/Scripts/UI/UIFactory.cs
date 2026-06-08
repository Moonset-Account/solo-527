using UnityEngine;
using UnityEngine.UI;
using RainAlley.UI;
using RainAlley.GameFlow;
using RainAlley.Gameplay;
using RainAlley.Audio;

namespace RainAlley.UI
{
    public static class UIFactory
    {
        public static void BuildAll(Transform canvasRoot)
        {
            if (canvasRoot == null) return;

            var menuRoot = NewPanel("MenuRoot", canvasRoot, new Color(0.06f, 0.08f, 0.14f, 1));
            BuildMainMenu(menuRoot);

            var calibRoot = NewPanel("CalibrationRoot", canvasRoot, new Color(0.06f, 0.09f, 0.15f, 1));
            calibRoot.SetActive(false);
            BuildCalibrationPage(calibRoot);

            var hudRoot = NewPanel("HUDRoot", canvasRoot, new Color(0, 0, 0, 0));
            hudRoot.SetActive(false);
            BuildGameplayHUD(hudRoot);

            var resRoot = NewPanel("ResultsRoot", canvasRoot, new Color(0.05f, 0.07f, 0.12f, 0.97f));
            resRoot.SetActive(false);
            BuildResultsPage(resRoot);

            BuildGameplayScene();
        }

        private static GameObject NewPanel(string name, Transform parent, Color bg)
        {
            return UIUtils.NewPanel(name, parent, bg);
        }

        private static void BuildGameplayScene()
        {
            if (GameplaySceneVisuals.Instance == null)
            {
                var go = new GameObject("GameplayScene");
                go.AddComponent<GameplaySceneVisuals>();
            }
        }

        private static void BuildMainMenu(GameObject root)
        {
            var comp = root.AddComponent<MainMenuUI>();

            UIUtils.NewText("Title", root.transform, "雨巷 · 纸伞跑酷", 56,
                TextAnchor.UpperCenter, new Color(1f, 0.92f, 0.75f));
            var titleRT = root.transform.Find("Title").GetComponent<RectTransform>();
            UIUtils.SetAnchors(titleRT, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(800, 100), new Vector2(0, -80));

            UIUtils.NewText("Subtitle", root.transform, "跟随雨声节拍，切换纸伞颜色穿过雨巷", 22,
                TextAnchor.UpperCenter, new Color(0.75f, 0.85f, 1f));
            var subRT = root.transform.Find("Subtitle").GetComponent<RectTransform>();
            UIUtils.SetAnchors(subRT, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(800, 50), new Vector2(0, -180));

            var btnContainer = UIUtils.NewEmpty("LevelContainer", root.transform);
            UIUtils.SetAnchors(btnContainer.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(900, 360), new Vector2(0, 20));

            comp.LevelButtonContainer = btnContainer.GetComponent<RectTransform>();
            comp.LevelButtonPrefab = CreateLevelButtonPrefab();

            UIUtils.NewButton("CalibrationBtn", root.transform, "🎵 节拍校准",
                new Vector2(0, 0), new Vector2(1, 0),
                new Vector2(60, 60), new Vector2(-60, 140),
                new Color(0.25f, 0.35f, 0.55f, 0.95f))
                .onClick.AddListener(() => comp.OpenCalibration());

            UIUtils.NewButton("LeaderboardBtn", root.transform, "🏆 排行榜",
                new Vector2(0, 0), new Vector2(1, 0),
                new Vector2(60, 60), new Vector2(-60, 220),
                new Color(0.35f, 0.28f, 0.48f, 0.95f))
                .onClick.AddListener(() => comp.ShowLeaderboards());

            UIUtils.NewButton("QuickPlayBtn", root.transform, "▶ 快速开始",
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(-120, 60), new Vector2(120, 140),
                new Color(0.2f, 0.6f, 0.4f, 0.95f), fontSize: 26)
                .onClick.AddListener(() => comp.QuickPlay());

            UIUtils.NewText("Footer", root.transform,
                "键盘：空格判定 | A/D 切色 | W 切轨  |  触屏：下方判定 / 上部切色 / 中部切轨",
                16, TextAnchor.LowerCenter, new Color(0.5f, 0.6f, 0.7f));

            comp.Init(root);
        }

        private static GameObject CreateLevelButtonPrefab()
        {
            var go = new GameObject("LevelBtnPrefab", typeof(RectTransform));
            var img = go.AddComponent<Image>();
            img.color = new Color(0.16f, 0.22f, 0.36f, 0.95f);
            var btn = go.AddComponent<Button>();
            var cs = btn.colors;
            cs.highlightedColor = new Color(0.25f, 0.35f, 0.55f);
            cs.pressedColor = new Color(0.1f, 0.15f, 0.25f);
            btn.colors = cs;
            UIUtils.NewText("LevelNum", go.transform, "1", 48,
                TextAnchor.MiddleLeft, new Color(1f, 0.92f, 0.7f));
            UIUtils.NewText("LevelName", go.transform, "关卡名", 26,
                TextAnchor.MiddleCenter, Color.white);
            UIUtils.NewText("BestScore", go.transform, "未通关", 18,
                TextAnchor.MiddleRight, new Color(0.7f, 0.85f, 1f));
            go.SetActive(false);
            return go;
        }

        private static void BuildCalibrationPage(GameObject root)
        {
            var comp = root.AddComponent<CalibrationPageUI>();

            UIUtils.NewText("Title", root.transform, "节拍校准", 44,
                TextAnchor.UpperCenter, new Color(1f, 0.92f, 0.75f));
            var rt = root.transform.Find("Title").GetComponent<RectTransform>();
            UIUtils.SetAnchors(rt, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(600, 80), new Vector2(0, -60));

            var beatIndicator = UIUtils.NewEmpty("BeatIndicator", root.transform);
            UIUtils.SetAnchors(beatIndicator.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0.55f), new Vector2(0.5f, 0.55f),
                new Vector2(200, 200), Vector2.zero);
            var ringImg = beatIndicator.AddComponent<Image>();
            ringImg.color = new Color(1f, 0.85f, 0.35f, 0.25f);
            ringImg.sprite = CreateCircleSprite();
            comp.BeatIndicator = beatIndicator;
            comp.BeatRingImage = ringImg;

            var center = UIUtils.NewEmpty("BeatCenter", beatIndicator.transform);
            UIUtils.SetAnchors(center.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(50, 50), Vector2.zero);
            var centerImg = center.AddComponent<Image>();
            centerImg.color = new Color(1f, 0.88f, 0.4f);

            comp.ProgressText = UIUtils.NewText("ProgressText", root.transform, "0 / 8", 30,
                TextAnchor.MiddleCenter, new Color(0.85f, 1f, 0.92f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.ProgressText.rectTransform,
                new Vector2(0.5f, 0.55f), new Vector2(0.5f, 0.55f),
                new Vector2(300, 50), new Vector2(0, 130));

            comp.InstructionText = UIUtils.NewText("Instruction", root.transform,
                "点击按钮开始校准，跟随雨声的节拍点击判定按钮", 22,
                TextAnchor.UpperCenter, new Color(0.8f, 0.9f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.InstructionText.rectTransform,
                new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(900, 50), new Vector2(0, -150));

            var fillBg = UIUtils.NewImage("ProgressBg", root.transform,
                new Color(0.15f, 0.18f, 0.25f),
                new Vector2(0.5f, 0.55f), new Vector2(0.5f, 0.55f),
                new Vector2(400, 14), new Vector2(0, 180));
            var fill = UIUtils.NewImage("ProgressFill", fillBg.transform,
                new Color(0.4f, 0.9f, 0.7f),
                Vector2.zero, new Vector2(0, 1), Vector2.zero, new Vector2(0, 0));
            fill.rectTransform.anchorMin = Vector2.zero;
            fill.rectTransform.anchorMax = new Vector2(0, 1);
            fill.rectTransform.offsetMin = Vector2.zero;
            fill.rectTransform.offsetMax = new Vector2(0, 0);
            comp.ProgressFill = fill;

            var resultPanel = UIUtils.NewPanel("ResultPanel", root.transform, new Color(0.1f, 0.15f, 0.25f, 0.98f));
            UIUtils.SetAnchors(resultPanel.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(560, 320), new Vector2(0, -80));

            UIUtils.NewText("ResultTitle", resultPanel.transform, "校准结果", 30,
                TextAnchor.UpperCenter, new Color(1f, 0.92f, 0.75f));
            UIUtils.SetAnchors(resultPanel.transform.Find("ResultTitle").GetComponent<RectTransform>(),
                new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(400, 50), new Vector2(0, -15));

            UIUtils.NewText("RecLabel", resultPanel.transform, "推荐延迟值：", 20,
                TextAnchor.MiddleLeft, new Color(0.75f, 0.85f, 1f));
            UIUtils.SetAnchors(resultPanel.transform.Find("RecLabel").GetComponent<RectTransform>(),
                new Vector2(0, 1f), new Vector2(0, 1f),
                new Vector2(250, 40), new Vector2(30, -70));

            comp.RecommendedLatencyText = UIUtils.NewText("RecVal", resultPanel.transform, "0 ms", 28,
                TextAnchor.MiddleRight, new Color(1f, 0.95f, 0.65f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.RecommendedLatencyText.rectTransform,
                new Vector2(1f, 1f), new Vector2(1f, 1f),
                new Vector2(200, 50), new Vector2(-30, -75));

            comp.StandardDeviationText = UIUtils.NewText("StdDev", resultPanel.transform, "", 18,
                TextAnchor.UpperLeft, new Color(0.65f, 0.8f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.StandardDeviationText.rectTransform,
                new Vector2(0, 1f), new Vector2(1f, 1f),
                new Vector2(500, 40), new Vector2(30, -125));

            comp.WindowDescriptionText = UIUtils.NewText("WinDesc", resultPanel.transform, "", 18,
                TextAnchor.UpperLeft, new Color(0.8f, 0.95f, 0.85f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.WindowDescriptionText.rectTransform,
                new Vector2(0, 0.5f), new Vector2(1f, 0.5f),
                new Vector2(500, 80), new Vector2(30, -20));

            comp.LatencyDescriptionText = UIUtils.NewText("LatDesc", resultPanel.transform, "", 17,
                TextAnchor.UpperLeft, new Color(0.75f, 0.9f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.LatencyDescriptionText.rectTransform,
                new Vector2(0, 0.5f), new Vector2(1f, 0.5f),
                new Vector2(500, 80), new Vector2(30, -110));

            comp.ResultPanel = resultPanel;

            comp.UseRecommendedBtn = UIUtils.NewButton("UseRecBtn", resultPanel.transform, "使用推荐值",
                new Vector2(0, 0), new Vector2(0.5f, 0),
                new Vector2(20, 15), new Vector2(-10, 55),
                new Color(0.25f, 0.6f, 0.4f)).GetComponent<Button>();

            var manualPanel = UIUtils.NewPanel("ManualPanel", root.transform, new Color(0.09f, 0.12f, 0.2f, 0.96f));
            UIUtils.SetAnchors(manualPanel.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(820, 240), new Vector2(0, 30));
            comp.ManualAdjustPanel = manualPanel;

            UIUtils.NewText("ManualTitle", manualPanel.transform, "手动调整", 24,
                TextAnchor.UpperLeft, new Color(1f, 0.92f, 0.75f));
            UIUtils.SetAnchors(manualPanel.transform.Find("ManualTitle").GetComponent<RectTransform>(),
                new Vector2(0, 1f), new Vector2(1, 1f),
                new Vector2(300, 40), new Vector2(20, -15));

            UIUtils.NewText("LatLabel", manualPanel.transform, "输入延迟：", 18,
                TextAnchor.MiddleLeft, Color.white);
            UIUtils.SetAnchors(manualPanel.transform.Find("LatLabel").GetComponent<RectTransform>(),
                new Vector2(0, 1f), new Vector2(0, 1f),
                new Vector2(150, 30), new Vector2(20, -55));
            comp.ManualLatencyText = UIUtils.NewText("LatVal", manualPanel.transform, "0 ms", 22,
                TextAnchor.MiddleCenter, new Color(1f, 0.92f, 0.6f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.ManualLatencyText.rectTransform,
                new Vector2(1f, 1f), new Vector2(1f, 1f),
                new Vector2(90, 35), new Vector2(-30, -58));

            comp.LatencySlider = UIUtils.NewSlider("LatSlider", manualPanel.transform,
                new Vector2(0, 1f), new Vector2(1f, 1f),
                new Vector2(170, -75), new Vector2(-120, -55), -200, 200, 0).GetComponent<Slider>();
            comp.LatencyMinusBtn = UIUtils.NewButton("-", manualPanel.transform, "-",
                new Vector2(0, 1f), new Vector2(0, 1f),
                new Vector2(135, -75), new Vector2(165, -55)).GetComponent<Button>();
            comp.LatencyPlusBtn = UIUtils.NewButton("+", manualPanel.transform, "+",
                new Vector2(1f, 1f), new Vector2(1f, 1f),
                new Vector2(-115, -75), new Vector2(-85, -55)).GetComponent<Button>();

            UIUtils.NewText("PerfLabel", manualPanel.transform, "完美窗口：", 16,
                TextAnchor.MiddleLeft, new Color(0.85f, 1f, 0.85f));
            UIUtils.SetAnchors(manualPanel.transform.Find("PerfLabel").GetComponent<RectTransform>(),
                new Vector2(0, 0.55f), new Vector2(0, 0.55f),
                new Vector2(150, 25), new Vector2(20, 0));
            comp.PerfectWindowText = UIUtils.NewText("PerfVal", manualPanel.transform, "80 ms", 18,
                TextAnchor.MiddleRight, Color.white).GetComponent<Text>();
            UIUtils.SetAnchors(comp.PerfectWindowText.rectTransform,
                new Vector2(1f, 0.55f), new Vector2(1f, 0.55f),
                new Vector2(100, 30), new Vector2(-120, 0));
            comp.PerfectWindowSlider = UIUtils.NewSlider("PerfSlider", manualPanel.transform,
                new Vector2(0, 0.55f), new Vector2(1f, 0.55f),
                new Vector2(170, -12), new Vector2(-15, 12), 40, 150, 80).GetComponent<Slider>();

            UIUtils.NewText("GoodLabel", manualPanel.transform, "良好窗口：", 16,
                TextAnchor.MiddleLeft, new Color(0.75f, 0.9f, 1f));
            UIUtils.SetAnchors(manualPanel.transform.Find("GoodLabel").GetComponent<RectTransform>(),
                new Vector2(0, 0.28f), new Vector2(0, 0.28f),
                new Vector2(150, 25), new Vector2(20, 0));
            comp.GoodWindowText = UIUtils.NewText("GoodVal", manualPanel.transform, "160 ms", 18,
                TextAnchor.MiddleRight, Color.white).GetComponent<Text>();
            UIUtils.SetAnchors(comp.GoodWindowText.rectTransform,
                new Vector2(1f, 0.28f), new Vector2(1f, 0.28f),
                new Vector2(100, 30), new Vector2(-120, 0));
            comp.GoodWindowSlider = UIUtils.NewSlider("GoodSlider", manualPanel.transform,
                new Vector2(0, 0.28f), new Vector2(1f, 0.28f),
                new Vector2(170, -12), new Vector2(-15, 12), 90, 320, 160).GetComponent<Slider>();

            comp.StartCalibrationBtn = UIUtils.NewButton("StartCalBtn", root.transform, "开始校准（空格判定）",
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(-200, 55), new Vector2(0, 295),
                new Color(0.25f, 0.55f, 0.75f)).GetComponent<Button>();
            comp.SaveAndExitBtn = UIUtils.NewButton("SaveBtn", root.transform, "保存并返回",
                new Vector2(1f, 0), new Vector2(1f, 0),
                new Vector2(-220, 55), new Vector2(-30, 295),
                new Color(0.2f, 0.55f, 0.35f)).GetComponent<Button>();
            comp.CancelBtn = UIUtils.NewButton("CancelBtn", root.transform, "取消",
                new Vector2(0, 0), new Vector2(0, 0),
                new Vector2(30, 55), new Vector2(220, 295),
                new Color(0.45f, 0.3f, 0.3f)).GetComponent<Button>();
            comp.ResetDefaultBtn = UIUtils.NewButton("ResetBtn", manualPanel.transform, "恢复默认",
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(-100, 15), new Vector2(100, 45),
                new Color(0.35f, 0.3f, 0.45f)).GetComponent<Button>();

            comp.HintText = UIUtils.NewText("Hint", root.transform, "", 22,
                TextAnchor.LowerCenter, new Color(1f, 0.92f, 0.5f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.HintText.rectTransform,
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(800, 50), new Vector2(0, 370));

            comp.InputHintText = UIUtils.NewText("InputHint", root.transform, "", 18,
                TextAnchor.LowerRight, new Color(0.7f, 0.85f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.InputHintText.rectTransform,
                new Vector2(1f, 0), new Vector2(1f, 0),
                new Vector2(600, 40), new Vector2(-30, 30));

            comp.Init(root);
        }

        private static void BuildGameplayHUD(GameObject root)
        {
            var comp = root.AddComponent<GameplayHUD>();

            comp.ScoreText = UIUtils.NewText("Score", root.transform, "0", 42,
                TextAnchor.UpperLeft, Color.white).GetComponent<Text>();
            UIUtils.SetAnchors(comp.ScoreText.rectTransform,
                new Vector2(0, 1f), new Vector2(0, 1f),
                new Vector2(320, 60), new Vector2(30, -20));
            UIUtils.AddShadow(comp.ScoreText.gameObject);

            comp.ComboText = UIUtils.NewText("Combo", root.transform, "", 56,
                TextAnchor.UpperCenter, new Color(1f, 0.92f, 0.5f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.ComboText.rectTransform,
                new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(600, 80), new Vector2(0, -15));
            UIUtils.AddShadow(comp.ComboText.gameObject, new Color(1f, 0.6f, 0.2f, 0.6f), 4);

            comp.UmbrellaColorPreview = UIUtils.NewImage("UmbrellaPreview", root.transform,
                UmbrellaColor.BlueColor, new Vector2(0, 0.5f), new Vector2(0, 0.5f),
                new Vector2(80, 80), new Vector2(70, 0)).GetComponent<Image>();

            var colorSlots = UIUtils.NewEmpty("ColorSlots", root.transform);
            UIUtils.SetAnchors(colorSlots.GetComponent<RectTransform>(),
                new Vector2(0, 0.5f), new Vector2(0, 0.5f),
                new Vector2(60, 240), new Vector2(70, -140));
            comp.ColorSlotImages = new Image[4];
            for (int i = 0; i < 4; i++)
            {
                var slot = UIUtils.NewImage($"Slot{i}", colorSlots.transform,
                    Color.gray, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                    new Vector2(44, 44), new Vector2(0, -i * 58 - 10));
                comp.ColorSlotImages[i] = slot.GetComponent<Image>();
            }

            var dualContainer = UIUtils.NewEmpty("DualTrack", root.transform);
            UIUtils.SetAnchors(dualContainer.GetComponent<RectTransform>(),
                new Vector2(1f, 0.5f), new Vector2(1f, 0.5f),
                new Vector2(80, 180), new Vector2(-70, 0));
            comp.DualTrackContainer = dualContainer;
            comp.LeftTrackIndicator = UIUtils.NewImage("LeftInd", dualContainer.transform,
                new Color(1f, 0.9f, 0.4f),
                new Vector2(0.5f, 0.75f), new Vector2(0.5f, 0.75f),
                new Vector2(50, 50), Vector2.zero).GetComponent<Image>();
            comp.RightTrackIndicator = UIUtils.NewImage("RightInd", dualContainer.transform,
                new Color(0.3f, 0.3f, 0.3f),
                new Vector2(0.5f, 0.25f), new Vector2(0.5f, 0.25f),
                new Vector2(50, 50), Vector2.zero).GetComponent<Image>();

            var judgeRoot = UIUtils.NewEmpty("JudgeRoot", root.transform);
            UIUtils.SetAnchors(judgeRoot.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0.35f), new Vector2(0.5f, 0.35f),
                new Vector2(600, 120), Vector2.zero);
            comp.JudgeText = UIUtils.NewText("JudgeText", judgeRoot.transform, "", 52,
                TextAnchor.MiddleCenter, Color.white).GetComponent<Text>();
            UIUtils.Stretch(comp.JudgeText.rectTransform);
            UIUtils.AddOutline(comp.JudgeText.gameObject, Color.black, 3);
            var cg = judgeRoot.AddComponent<CanvasGroup>();
            cg.alpha = 0;
            comp.JudgeCanvasGroup = cg;
            comp.JudgeRect = judgeRoot.GetComponent<RectTransform>();

            comp.ProgressSlider = UIUtils.NewSlider("Progress", root.transform,
                new Vector2(0, 0), new Vector2(1, 0),
                new Vector2(200, 0), new Vector2(-200, 14), 0, 1, 0).GetComponent<Slider>();
            comp.ProgressSlider.interactable = false;

            comp.BeatProgressText = UIUtils.NewText("BeatProgress", root.transform, "", 14,
                TextAnchor.LowerCenter, new Color(0.7f, 0.8f, 0.95f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.BeatProgressText.rectTransform,
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(300, 24), new Vector2(0, 30));

            var breakFlash = UIUtils.NewImage("ComboBreakFlash", root.transform,
                new Color(1f, 0.2f, 0.25f, 0.45f),
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            UIUtils.Stretch(breakFlash.rectTransform);
            breakFlash.gameObject.SetActive(false);
            comp.ComboBreakFlash = breakFlash.gameObject;

            var pauseOverlay = UIUtils.NewPanel("PauseOverlay", root.transform, new Color(0, 0, 0, 0.75f));
            comp.PauseOverlay = pauseOverlay;
            UIUtils.NewText("PauseText", pauseOverlay.transform, "已暂停", 60,
                TextAnchor.MiddleCenter, new Color(1f, 0.92f, 0.75f));
            comp.ResumeBtn = UIUtils.NewButton("ResumeBtn", pauseOverlay.transform, "继续",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(-240, -30), new Vector2(-40, 30),
                new Color(0.25f, 0.6f, 0.4f)).GetComponent<Button>();
            comp.RestartBtn = UIUtils.NewButton("RestartBtn", pauseOverlay.transform, "重开",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(-30, -30), new Vector2(170, 30),
                new Color(0.55f, 0.4f, 0.2f)).GetComponent<Button>();
            comp.ExitBtn = UIUtils.NewButton("ExitBtn", pauseOverlay.transform, "返回菜单",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(-90, -110), new Vector2(90, -50),
                new Color(0.45f, 0.3f, 0.3f)).GetComponent<Button>();
            comp.PauseOverlay.SetActive(false);

            comp.InputHintBottom = UIUtils.NewText("HintBottom", root.transform, "", 18,
                TextAnchor.LowerCenter, new Color(0.6f, 0.75f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.InputHintBottom.rectTransform,
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(600, 30), new Vector2(0, 60));
            comp.InputHintSide = UIUtils.NewText("HintSide", root.transform, "", 14,
                TextAnchor.MiddleLeft, new Color(0.6f, 0.75f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.InputHintSide.rectTransform,
                new Vector2(0, 0.12f), new Vector2(0, 0.12f),
                new Vector2(500, 70), new Vector2(25, 0));

            var shakeCam = new GameObject("HUDShake", typeof(RectTransform));
            shakeCam.transform.SetParent(root.transform, false);
            UIUtils.Stretch(shakeCam.GetComponent<RectTransform>());
            comp.CameraShakeRef = shakeCam.AddComponent<CameraShake>();

            comp.PerfectColor = new Color(1f, 0.92f, 0.35f);
            comp.EarlyColor = new Color(0.6f, 0.82f, 1f);
            comp.LateColor = new Color(1f, 0.75f, 0.5f);
            comp.MissColor = new Color(1f, 0.4f, 0.4f);
            comp.TrackActiveColor = new Color(1f, 0.92f, 0.45f);
            comp.TrackInactiveColor = new Color(0.3f, 0.32f, 0.4f);

            comp.Init(root);
        }

        private static void BuildResultsPage(GameObject root)
        {
            var comp = root.AddComponent<ResultsPageUI>();
            comp.ResultsRoot = root;

            UIUtils.NewText("Title", root.transform, "关卡结算", 44,
                TextAnchor.UpperCenter, new Color(1f, 0.92f, 0.75f));
            var t = root.transform.Find("Title").GetComponent<RectTransform>();
            UIUtils.SetAnchors(t, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(500, 80), new Vector2(0, -50));

            comp.LevelNameText = UIUtils.NewText("LevelName", root.transform, "", 26,
                TextAnchor.UpperCenter, new Color(0.75f, 0.85f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.LevelNameText.rectTransform,
                new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(500, 40), new Vector2(0, -110));
            comp.LevelNumberText = comp.LevelNameText;

            comp.ScoreText = UIUtils.NewText("Score", root.transform, "0", 72,
                TextAnchor.UpperCenter, new Color(1f, 0.95f, 0.5f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.ScoreText.rectTransform,
                new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(500, 100), new Vector2(0, -175));
            UIUtils.AddShadow(comp.ScoreText.gameObject);

            comp.GradeText = UIUtils.NewText("Grade", root.transform, "S", 110,
                TextAnchor.MiddleCenter, Color.white).GetComponent<Text>();
            UIUtils.SetAnchors(comp.GradeText.rectTransform,
                new Vector2(0.18f, 0.72f), new Vector2(0.18f, 0.72f),
                new Vector2(180, 180), Vector2.zero);
            UIUtils.AddShadow(comp.GradeText.gameObject, new Color(0, 0, 0, 0.6f), 6);

            comp.GradeBackground = UIUtils.NewImage("GradeBg", comp.GradeText.transform.parent,
                new Color(1f, 0.85f, 0.3f, 0.12f),
                new Vector2(0.18f, 0.72f), new Vector2(0.18f, 0.72f),
                new Vector2(220, 220), Vector2.zero).GetComponent<Image>();
            comp.GradeBackground.rectTransform.SetSiblingIndex(comp.GradeText.rectTransform.GetSiblingIndex());

            comp.AccuracyText = UIUtils.NewText("Accuracy", root.transform, "", 28,
                TextAnchor.MiddleCenter, Color.white).GetComponent<Text>();
            UIUtils.SetAnchors(comp.AccuracyText.rectTransform,
                new Vector2(0.18f, 0.58f), new Vector2(0.18f, 0.58f),
                new Vector2(300, 50), Vector2.zero);

            comp.RankText = UIUtils.NewText("Rank", root.transform, "", 20,
                TextAnchor.MiddleCenter, new Color(0.7f, 0.9f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.RankText.rectTransform,
                new Vector2(0.18f, 0.50f), new Vector2(0.18f, 0.50f),
                new Vector2(400, 35), Vector2.zero);

            var statsPanel = UIUtils.NewPanel("StatsPanel", root.transform, new Color(0.1f, 0.14f, 0.22f, 0.96f));
            UIUtils.SetAnchors(statsPanel.GetComponent<RectTransform>(),
                new Vector2(0.55f, 0.55f), new Vector2(0.95f, 0.92f),
                Vector2.zero, Vector2.zero);

            UIUtils.NewText("StatsTitle", statsPanel.transform, "判定分布", 26,
                TextAnchor.UpperLeft, new Color(1f, 0.92f, 0.75f));
            UIUtils.SetAnchors(statsPanel.transform.Find("StatsTitle").GetComponent<RectTransform>(),
                new Vector2(0, 1f), new Vector2(1f, 1f),
                new Vector2(200, 40), new Vector2(20, -15));

            string[] labels = { "PERFECT 完美拍", "EARLY 早拍", "LATE 晚拍", "MISS 失误" };
            Color[] colors = { new Color(1f, 0.92f, 0.35f), new Color(0.6f, 0.82f, 1f),
                               new Color(1f, 0.75f, 0.5f), new Color(1f, 0.4f, 0.4f) };
            Text[] countTexts = new Text[4];
            Image[] bars = new Image[4];

            for (int i = 0; i < 4; i++)
            {
                float y = 0.80f - i * 0.16f;
                UIUtils.NewText($"Label{i}", statsPanel.transform, labels[i], 20,
                    TextAnchor.MiddleLeft, colors[i]);
                UIUtils.SetAnchors(statsPanel.transform.Find($"Label{i}").GetComponent<RectTransform>(),
                    new Vector2(0, y), new Vector2(0, y),
                    new Vector2(240, 30), new Vector2(20, 0));

                countTexts[i] = UIUtils.NewText($"Count{i}", statsPanel.transform, "0", 26,
                    TextAnchor.MiddleRight, Color.white).GetComponent<Text>();
                UIUtils.SetAnchors(countTexts[i].rectTransform,
                    new Vector2(0.55f, y), new Vector2(0.55f, y),
                    new Vector2(100, 35), new Vector2(-5, 0));

                var barBg = UIUtils.NewImage($"BarBg{i}", statsPanel.transform,
                    new Color(0.2f, 0.22f, 0.3f),
                    new Vector2(0.6f, y), new Vector2(1f, y),
                    Vector2.zero, new Vector2(-20, 16), new Vector2(0, 0.5f));
                barBg.rectTransform.offsetMax = new Vector2(-20, 16);
                barBg.rectTransform.offsetMin = new Vector2(0, -16);

                var bar = UIUtils.NewImage($"BarFill{i}", barBg.transform,
                    colors[i], Vector2.zero, new Vector2(0.3f, 1f),
                    Vector2.zero, Vector2.zero, new Vector2(0, 0.5f));
                bar.rectTransform.anchorMin = Vector2.zero;
                bar.rectTransform.anchorMax = new Vector2(0.3f, 1f);
                bar.rectTransform.offsetMin = Vector2.zero;
                bar.rectTransform.offsetMax = new Vector2(0, 0);
                bars[i] = bar;
            }

            comp.PerfectCountText = countTexts[0];
            comp.EarlyCountText = countTexts[1];
            comp.LateCountText = countTexts[2];
            comp.MissCountText = countTexts[3];
            comp.PerfectBar = bars[0];
            comp.EarlyBar = bars[1];
            comp.LateBar = bars[2];
            comp.MissBar = bars[3];

            UIUtils.NewText("ComboLabel", statsPanel.transform, "最大连击", 18,
                TextAnchor.MiddleLeft, new Color(0.75f, 0.9f, 1f));
            UIUtils.SetAnchors(statsPanel.transform.Find("ComboLabel").GetComponent<RectTransform>(),
                new Vector2(0, 0.08f), new Vector2(0, 0.08f),
                new Vector2(150, 25), new Vector2(20, 0));
            comp.MaxComboText = UIUtils.NewText("MaxCombo", statsPanel.transform, "0", 28,
                TextAnchor.MiddleRight, new Color(1f, 0.92f, 0.5f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.MaxComboText.rectTransform,
                new Vector2(0.55f, 0.08f), new Vector2(0.55f, 0.08f),
                new Vector2(120, 40), new Vector2(-10, 0));

            var analysisPanel = UIUtils.NewPanel("AnalysisPanel", root.transform, new Color(0.08f, 0.12f, 0.2f, 0.96f));
            UIUtils.SetAnchors(analysisPanel.GetComponent<RectTransform>(),
                new Vector2(0.05f, 0.08f), new Vector2(0.45f, 0.45f),
                Vector2.zero, Vector2.zero);

            UIUtils.NewText("AnaTitle", analysisPanel.transform, "问题分析", 24,
                TextAnchor.UpperLeft, new Color(1f, 0.92f, 0.75f));
            UIUtils.SetAnchors(analysisPanel.transform.Find("AnaTitle").GetComponent<RectTransform>(),
                new Vector2(0, 1f), new Vector2(1f, 1f),
                new Vector2(200, 40), new Vector2(20, -15));

            comp.ProblemAnalysisText = UIUtils.NewText("Analysis", analysisPanel.transform, "", 17,
                TextAnchor.UpperLeft, new Color(1f, 0.75f, 0.75f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.ProblemAnalysisText.rectTransform,
                new Vector2(0, 0.62f), new Vector2(1f, 1f),
                Vector2.zero, new Vector2(20, -60), new Vector2(0, 1f));
            comp.ProblemAnalysisText.rectTransform.offsetMax = new Vector2(-20, -60);
            comp.ProblemAnalysisText.rectTransform.offsetMin = new Vector2(20, 0);
            comp.ProblemAnalysisText.alignment = TextAnchor.UpperLeft;
            comp.ProblemAnalysisText.horizontalOverflow = HorizontalWrapMode.Wrap;
            comp.ProblemAnalysisText.verticalOverflow = VerticalWrapMode.Truncate;

            comp.SuggestionText = UIUtils.NewText("Suggestion", analysisPanel.transform, "", 16,
                TextAnchor.UpperLeft, new Color(0.7f, 0.95f, 0.85f)).GetComponent<Text>();
            UIUtils.SetAnchors(comp.SuggestionText.rectTransform,
                new Vector2(0, 0f), new Vector2(1f, 0.6f),
                Vector2.zero, new Vector2(20, 15), new Vector2(0, 1f));
            comp.SuggestionText.rectTransform.offsetMax = new Vector2(-20, -10);
            comp.SuggestionText.rectTransform.offsetMin = new Vector2(20, 15);
            comp.SuggestionText.alignment = TextAnchor.UpperLeft;
            comp.SuggestionText.horizontalOverflow = HorizontalWrapMode.Wrap;
            comp.SuggestionText.verticalOverflow = VerticalWrapMode.Truncate;

            var lbPanel = UIUtils.NewPanel("LeaderboardPanel", root.transform, new Color(0.08f, 0.12f, 0.2f, 0.96f));
            UIUtils.SetAnchors(lbPanel.GetComponent<RectTransform>(),
                new Vector2(0.55f, 0.08f), new Vector2(0.95f, 0.48f),
                Vector2.zero, Vector2.zero);

            UIUtils.NewText("LBTitle", lbPanel.transform, "本地排行榜", 22,
                TextAnchor.UpperLeft, new Color(1f, 0.92f, 0.75f));
            UIUtils.SetAnchors(lbPanel.transform.Find("LBTitle").GetComponent<RectTransform>(),
                new Vector2(0, 1f), new Vector2(1f, 1f),
                new Vector2(200, 35), new Vector2(20, -10));
            comp.LeaderboardContainer = lbPanel.GetComponent<RectTransform>();

            var btnPanel = UIUtils.NewEmpty("BtnPanel", root.transform);
            UIUtils.SetAnchors(btnPanel.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0), new Vector2(0.5f, 0),
                new Vector2(900, 70), new Vector2(0, 50));

            comp.RetryBtn = UIUtils.NewButton("RetryBtn", btnPanel.transform, "↻ 再来一次",
                new Vector2(0, 0), new Vector2(0.33f, 1f),
                new Vector2(10, 5), new Vector2(-10, -5),
                new Color(0.3f, 0.45f, 0.65f)).GetComponent<Button>();
            comp.NextLevelBtn = UIUtils.NewButton("NextBtn", btnPanel.transform, "下一关 →",
                new Vector2(0.33f, 0), new Vector2(0.66f, 1f),
                new Vector2(10, 5), new Vector2(-10, -5),
                new Color(0.25f, 0.55f, 0.35f)).GetComponent<Button>();
            comp.ToMenuBtn = UIUtils.NewButton("MenuBtn", btnPanel.transform, "返回主菜单",
                new Vector2(0.66f, 0), new Vector2(1f, 1f),
                new Vector2(10, 5), new Vector2(-10, -5),
                new Color(0.45f, 0.35f, 0.35f)).GetComponent<Button>();

            comp.GradeSColor = new Color(1f, 0.85f, 0.3f);
            comp.GradeAColor = new Color(0.4f, 0.9f, 1f);
            comp.GradeBColor = new Color(0.5f, 1f, 0.5f);
            comp.GradeCColor = new Color(1f, 0.7f, 0.3f);
            comp.GradeDColor = new Color(1f, 0.5f, 0.5f);
            comp.GradeFColor = new Color(0.55f, 0.55f, 0.55f);

            comp.Init();
        }

        private static Sprite CreateCircleSprite()
        {
            int size = 128;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            var pix = new Color[size * size];
            Vector2 c = new Vector2(size / 2f, size / 2f);
            float r = size * 0.48f;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float d = (new Vector2(x, y) - c).magnitude;
                    float a = d < r ? (d > r - 4f ? (r - d) / 4f : 1f) : 0f;
                    pix[y * size + x] = new Color(1, 1, 1, a);
                }
            tex.SetPixels(pix);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
        }
    }
}
