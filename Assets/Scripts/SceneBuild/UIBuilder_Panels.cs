using BeatRunner.Audio;
using BeatRunner.Resources;
using BeatRunner.UI;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.SceneBuild
{
    public static partial class UIBuilder
    {
        public static TutorialController BuildTutorial(Transform canvasT)
        {
            var root = UIFactory.MakePanel("TutorialRoot", canvasT,
                new Color(0.02f, 0.03f, 0.06f, 0.82f), Vector2.zero, Vector2.one);
            var script = root.AddComponent<TutorialController>();

            var overlay = UIFactory.MakeImage("TopOverlay", root.transform,
                new Vector2(0, 0.65f), new Vector2(1, 1),
                new Color(0f, 0f, 0f, 0.4f));

            var message = UIFactory.MakeText("MessageText", root.transform,
                "欢迎来到节拍跑酷！", 34, Color.white, TextAnchor.MiddleCenter);
            PositionChild(message.transform, 0.1f, 0.78f, 0.9f, 0.92f);

            var keyHint = UIFactory.MakeText("KeyHintText", root.transform,
                "", 40, AccentYellow, TextAnchor.MiddleCenter);
            PositionChild(keyHint.transform, 0.1f, 0.68f, 0.9f, 0.78f);

            var keyboardHints = UIFactory.MakeImage("KeyboardHints", root.transform,
                new Vector2(0.05f, 0.05f), new Vector2(0.95f, 0.18f),
                new Color(0.1f, 0.15f, 0.25f, 0.85f));
            var khText = UIFactory.MakeText("KHText", keyboardHints.transform,
                "键盘：空格跳跃 / S滑行 / A D切轨", 24, UIFactory.AccentCyan, TextAnchor.MiddleCenter);
            PositionChild(khText.transform, 0, 0, 1, 1);

            var touchHints = UIFactory.MakeImage("TouchHints", root.transform,
                new Vector2(0.05f, 0.05f), new Vector2(0.95f, 0.18f),
                new Color(0.1f, 0.25f, 0.15f, 0.85f));
            var thText = UIFactory.MakeText("THText", touchHints.transform,
                "触屏：上滑跳跃 / 下滑滑行 / 左右滑切轨", 24, new Color(0.4f, 1f, 0.5f), TextAnchor.MiddleCenter);
            PositionChild(thText.transform, 0, 0, 1, 1);
            touchHints.SetActive(false);

            var gamepadHints = UIFactory.MakeImage("GamepadHints", root.transform,
                new Vector2(0.05f, 0.05f), new Vector2(0.95f, 0.18f),
                new Color(0.25f, 0.1f, 0.25f, 0.85f));
            var ghText = UIFactory.MakeText("GHText", gamepadHints.transform,
                "手柄：A跳跃 / B滑行 / 十字键切轨", 24, new Color(1f, 0.5f, 1f), TextAnchor.MiddleCenter);
            PositionChild(ghText.transform, 0, 0, 1, 1);
            gamepadHints.SetActive(false);

            Text skipLbl;
            var skipBtn = UIFactory.MakeButton("SkipBtn", root.transform,
                new Vector2(0.82f, 0.88f), new Vector2(0.97f, 0.96f), "跳过", 20,
                out skipLbl, new Color(0.35f, 0.35f, 0.4f));

            var progressBg = UIFactory.MakeImage("ProgressBg", root.transform,
                new Vector2(0.1f, 0.60f), new Vector2(0.9f, 0.63f),
                new Color(0.2f, 0.2f, 0.3f, 0.9f));
            var fillGo = new GameObject("ProgressFill", typeof(RectTransform), typeof(Image));
            fillGo.transform.SetParent(progressBg.transform, false);
            var fillRt = (RectTransform)fillGo.transform;
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = new Vector2(0, 1);
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = new Vector2(0, 0);
            var fillImg = fillGo.GetComponent<Image>();
            fillImg.sprite = RuntimeContentLoader.GetWhiteSprite();
            fillImg.color = UIFactory.AccentBlue;
            fillImg.type = Image.Type.Filled;
            fillImg.fillMethod = Image.FillMethod.Horizontal;

            SetField(script, "_tutorialRoot", root);
            SetField(script, "_messageText", message);
            SetField(script, "_keyHintText", keyHint);
            SetField(script, "_keyboardHints", keyboardHints);
            SetField(script, "_touchHints", touchHints);
            SetField(script, "_gamepadHints", gamepadHints);
            SetField(script, "_skipButton", skipBtn);
            SetField(script, "_progressFill", fillImg);

            root.SetActive(false);
            return script;
        }

        public static HudController BuildHUD(Transform canvasT)
        {
            var root = UIFactory.MakePanel("HUDRoot", canvasT,
                new Color(0, 0, 0, 0), Vector2.zero, Vector2.one);
            var script = root.AddComponent<HudController>();

            var topBar = UIFactory.MakeImage("TopBar", root.transform,
                new Vector2(0, 0.90f), new Vector2(1, 1),
                new Color(0, 0, 0, 0.35f));

            var score = UIFactory.MakeText("ScoreText", root.transform,
                "0", 56, Color.white, TextAnchor.UpperLeft);
            PositionChild(score.transform, 0.03f, 0.90f, 0.30f, 1f);

            var comboLabel = UIFactory.MakeText("ComboLabel", root.transform,
                "COMBO", 18, AccentYellow, TextAnchor.UpperCenter);
            PositionChild(comboLabel.transform, 0.45f, 0.93f, 0.55f, 0.96f);

            var combo = UIFactory.MakeText("ComboText", root.transform,
                "0", 44, AccentYellow, TextAnchor.UpperCenter);
            PositionChild(combo.transform, 0.40f, 0.83f, 0.60f, 0.93f);

            var trackName = UIFactory.MakeText("TrackName", root.transform,
                "", 22, Color.white, TextAnchor.UpperRight);
            PositionChild(trackName.transform, 0.60f, 0.92f, 0.92f, 0.97f);

            var artist = UIFactory.MakeText("ArtistText", root.transform,
                "", 16, UIFactory.TextMuted, TextAnchor.UpperRight);
            PositionChild(artist.transform, 0.60f, 0.89f, 0.92f, 0.92f);

            var cover = UIFactory.MakeImage("TrackCover", root.transform,
                new Vector2(0.93f, 0.89f), new Vector2(0.99f, 0.99f), Color.white);

            var fragIcon = UIFactory.MakeImage("FragmentIcon", root.transform,
                new Vector2(0.03f, 0.82f), new Vector2(0.06f, 0.86f),
                new Color(0.3f, 0.9f, 1f));
            var fragText = UIFactory.MakeText("FragmentText", root.transform,
                "0", 22, UIFactory.AccentCyan, TextAnchor.MiddleLeft);
            PositionChild(fragText.transform, 0.07f, 0.81f, 0.15f, 0.87f);

            var progressBg = UIFactory.MakeImage("ProgressBg", root.transform,
                new Vector2(0.20f, 0.83f), new Vector2(0.75f, 0.86f),
                new Color(0.2f, 0.2f, 0.3f, 0.8f));
            GameObject sliderGo;
            Slider progressBar = UIFactory.InternalMakeSlider(progressBg.transform,
                out sliderGo, out Image fill, out Image handle);
            fill.color = UIFactory.AccentBlue;
            if (handle != null) handle.color = new Color(0, 0, 0, 0);

            var progressText = UIFactory.MakeText("ProgressText", root.transform,
                "0 / 0", 18, Color.white, TextAnchor.MiddleRight);
            PositionChild(progressText.transform, 0.76f, 0.81f, 0.90f, 0.88f);

            Text pauseLbl;
            var pauseBtn = UIFactory.MakeButton("PauseBtn", root.transform,
                new Vector2(0.01f, 0.01f), new Vector2(0.06f, 0.07f), "❚❚", 26,
                out pauseLbl, new Color(0.25f, 0.3f, 0.4f));

            var judgment = UIFactory.MakeText("JudgmentText", root.transform,
                "", 56, Color.white, TextAnchor.MiddleCenter);
            PositionChild(judgment.transform, 0.35f, 0.55f, 0.65f, 0.70f);

            var comboAnimatorGo = new GameObject("ComboAnimator", typeof(RectTransform), typeof(Animator));
            comboAnimatorGo.transform.SetParent(root.transform, false);
            var cRt = (RectTransform)comboAnimatorGo.transform;
            cRt.anchorMin = new Vector2(0.45f, 0.93f);
            cRt.anchorMax = new Vector2(0.55f, 0.96f);
            cRt.offsetMin = Vector2.zero;
            cRt.offsetMax = Vector2.zero;
            var comboAnimator = comboAnimatorGo.GetComponent<Animator>();

            var judgmentAnimatorGo = new GameObject("JudgmentAnimator", typeof(RectTransform), typeof(Animator));
            judgmentAnimatorGo.transform.SetParent(root.transform, false);
            var jRt = (RectTransform)judgmentAnimatorGo.transform;
            jRt.anchorMin = new Vector2(0.35f, 0.55f);
            jRt.anchorMax = new Vector2(0.65f, 0.70f);
            jRt.offsetMin = Vector2.zero;
            jRt.offsetMax = Vector2.zero;
            var judgmentAnimator = judgmentAnimatorGo.GetComponent<Animator>();

            var hintPanel = UIFactory.MakeImage("HintPanel", root.transform,
                new Vector2(0.25f, 0.20f), new Vector2(0.75f, 0.32f),
                new Color(0.05f, 0.08f, 0.15f, 0.9f));
            var hintText = UIFactory.MakeText("HintText", hintPanel.transform,
                "", 24, Color.white, TextAnchor.MiddleCenter);
            PositionChild(hintText.transform, 0, 0.4f, 1, 1);
            var hintKeyText = UIFactory.MakeText("KeyHintText", hintPanel.transform,
                "", 28, AccentYellow, TextAnchor.MiddleCenter);
            PositionChild(hintKeyText.transform, 0, 0, 1, 0.45f);
            hintPanel.SetActive(false);

            SetField(script, "_hudRoot", root);
            SetField(script, "_scoreText", score);
            SetField(script, "_comboText", combo);
            SetField(script, "_comboLabel", comboLabel);
            SetField(script, "_comboAnimator", comboAnimator);
            SetField(script, "_trackNameText", trackName);
            SetField(script, "_artistText", artist);
            SetField(script, "_trackCover", cover);
            SetField(script, "_progressBar", progressBar);
            SetField(script, "_progressText", progressText);
            SetField(script, "_fragmentText", fragText);
            SetField(script, "_fragmentIcon", fragIcon);
            SetField(script, "_judgmentText", judgment);
            SetField(script, "_judgmentAnimator", judgmentAnimator);
            SetField(script, "_hintPanel", hintPanel);
            SetField(script, "_hintText", hintText);
            SetField(script, "_keyHintText", hintKeyText);
            SetField(script, "_pauseButton", pauseBtn);

            root.SetActive(false);
            return script;
        }

        public static PauseMenu BuildPause(Transform canvasT)
        {
            var root = UIFactory.MakePanel("PauseRoot", canvasT,
                new Color(0.02f, 0.03f, 0.06f, 0.88f), Vector2.zero, Vector2.one);
            var script = root.AddComponent<PauseMenu>();

            var panel = UIFactory.MakeImage("PausePanel", root.transform,
                new Vector2(0.30f, 0.20f), new Vector2(0.70f, 0.80f),
                new Color(0.08f, 0.10f, 0.18f, 0.98f));

            var title = UIFactory.MakeText("Title", panel.transform,
                "游戏暂停", 52, Color.white, TextAnchor.UpperCenter);
            PositionChild(title.transform, 0, 0.80f, 1, 0.95f);

            var trackName = UIFactory.MakeText("TrackName", panel.transform,
                "", 24, UIFactory.AccentCyan, TextAnchor.MiddleCenter);
            PositionChild(trackName.transform, 0.1f, 0.68f, 0.9f, 0.75f);

            var scoreText = UIFactory.MakeText("ScoreText", panel.transform,
                "0", 48, AccentYellow, TextAnchor.MiddleCenter);
            PositionChild(scoreText.transform, 0.1f, 0.55f, 0.9f, 0.66f);

            Text resumeLbl, retryLbl, settingsLbl, quitLbl;
            var resumeBtn = UIFactory.MakeButton("ResumeBtn", panel.transform,
                new Vector2(0.15f, 0.42f), new Vector2(0.85f, 0.52f), "继续游戏", 28,
                out resumeLbl, UIFactory.AccentBlue);
            var retryBtn = UIFactory.MakeButton("RetryBtn", panel.transform,
                new Vector2(0.15f, 0.30f), new Vector2(0.85f, 0.40f), "重新开始", 26,
                out retryLbl, new Color(0.3f, 0.55f, 0.35f));
            var settingsBtn = UIFactory.MakeButton("SettingsBtn", panel.transform,
                new Vector2(0.15f, 0.18f), new Vector2(0.85f, 0.28f), "设置", 26,
                out settingsLbl, new Color(0.4f, 0.4f, 0.55f));
            var quitBtn = UIFactory.MakeButton("QuitBtn", panel.transform,
                new Vector2(0.15f, 0.06f), new Vector2(0.85f, 0.16f), "返回主菜单", 26,
                out quitLbl, new Color(0.6f, 0.25f, 0.30f));

            SetField(script, "_pauseRoot", root);
            SetField(script, "_resumeBtn", resumeBtn);
            SetField(script, "_retryBtn", retryBtn);
            SetField(script, "_settingsBtn", settingsBtn);
            SetField(script, "_quitBtn", quitBtn);
            SetField(script, "_trackNameText", trackName);
            SetField(script, "_scoreText", scoreText);

            root.SetActive(false);
            return script;
        }

        public static SettingsMenu BuildSettings(Transform canvasT)
        {
            var root = UIFactory.MakePanel("SettingsRoot", canvasT,
                new Color(0.02f, 0.03f, 0.06f, 0.92f), Vector2.zero, Vector2.one);
            var script = root.AddComponent<SettingsMenu>();

            var title = UIFactory.MakeText("Title", root.transform,
                "设 置", 48, Color.white, TextAnchor.UpperCenter);
            PositionChild(title.transform, 0, 0.90f, 1, 0.98f);

            Text closeLbl;
            var closeBtn = UIFactory.MakeButton("CloseBtn", root.transform,
                new Vector2(0.90f, 0.90f), new Vector2(0.98f, 0.97f), "✕", 32,
                out closeLbl, new Color(0.5f, 0.2f, 0.25f));

            var tabBar = UIFactory.MakeImage("TabBar", root.transform,
                new Vector2(0.15f, 0.80f), new Vector2(0.85f, 0.88f),
                new Color(0.08f, 0.10f, 0.18f, 0.95f));
            Text gLbl, aLbl, iLbl, grLbl;
            var generalTabBtn = UIFactory.MakeButton("GeneralTabBtn", tabBar.transform,
                new Vector2(0.00f, 0), new Vector2(0.25f, 1), "通用", 20,
                out gLbl, new Color(0.3f, 0.6f, 1f));
            var audioTabBtn = UIFactory.MakeButton("AudioTabBtn", tabBar.transform,
                new Vector2(0.25f, 0), new Vector2(0.50f, 1), "音频", 20,
                out aLbl, new Color(0.4f, 0.4f, 0.55f));
            var inputTabBtn = UIFactory.MakeButton("InputTabBtn", tabBar.transform,
                new Vector2(0.50f, 0), new Vector2(0.75f, 1), "输入", 20,
                out iLbl, new Color(0.4f, 0.4f, 0.55f));
            var graphicsTabBtn = UIFactory.MakeButton("GraphicsTabBtn", tabBar.transform,
                new Vector2(0.75f, 0), new Vector2(1.00f, 1), "画质", 20,
                out grLbl, new Color(0.4f, 0.4f, 0.55f));

            var generalTab = UIFactory.MakeImage("GeneralTab", root.transform,
                new Vector2(0.10f, 0.10f), new Vector2(0.90f, 0.78f),
                new Color(0.06f, 0.08f, 0.14f, 0.98f));
            BuildGeneralContent(generalTab.transform, script,
                out Toggle showTutorialToggle,
                out Slider masterVolumeSlider, out Text masterVolumeText);

            var audioTab = UIFactory.MakeImage("AudioTab", root.transform,
                new Vector2(0.10f, 0.10f), new Vector2(0.90f, 0.78f),
                new Color(0.06f, 0.08f, 0.14f, 0.98f));
            BuildAudioContent(audioTab.transform, script,
                out Slider musicVolumeSlider, out Text musicVolumeText,
                out Slider sfxVolumeSlider, out Text sfxVolumeText,
                out Slider latencySlider, out Text latencyText,
                out Button calibrateBtn, out Button testLatencyBtn);

            var inputTab = UIFactory.MakeImage("InputTab", root.transform,
                new Vector2(0.10f, 0.10f), new Vector2(0.90f, 0.78f),
                new Color(0.06f, 0.08f, 0.14f, 0.98f));
            BuildInputContent(inputTab.transform, script,
                out InputTypeDisplay inputTypeDisplay,
                out Button remapJumpBtn, out Button remapSlideBtn,
                out Button remapLeftBtn, out Button remapRightBtn,
                out Text remapJumpText, out Text remapSlideText,
                out Text remapLeftText, out Text remapRightText);

            var graphicsTab = UIFactory.MakeImage("GraphicsTab", root.transform,
                new Vector2(0.10f, 0.10f), new Vector2(0.90f, 0.78f),
                new Color(0.06f, 0.08f, 0.14f, 0.98f));
            BuildGraphicsContent(graphicsTab.transform, script,
                out Dropdown qualityDropdown,
                out Slider targetFpsSlider, out Text targetFpsText,
                out Toggle vsyncToggle, out Toggle showPerfStatsToggle);

            SetField(script, "_settingsRoot", root);
            SetField(script, "_generalTab", generalTab);
            SetField(script, "_audioTab", audioTab);
            SetField(script, "_inputTab", inputTab);
            SetField(script, "_graphicsTab", graphicsTab);
            SetField(script, "_generalTabBtn", generalTabBtn);
            SetField(script, "_audioTabBtn", audioTabBtn);
            SetField(script, "_inputTabBtn", inputTabBtn);
            SetField(script, "_graphicsTabBtn", graphicsTabBtn);
            SetField(script, "_closeBtn", closeBtn);

            SetField(script, "_showTutorialToggle", showTutorialToggle);
            SetField(script, "_masterVolumeSlider", masterVolumeSlider);
            SetField(script, "_masterVolumeText", masterVolumeText);

            SetField(script, "_musicVolumeSlider", musicVolumeSlider);
            SetField(script, "_musicVolumeText", musicVolumeText);
            SetField(script, "_sfxVolumeSlider", sfxVolumeSlider);
            SetField(script, "_sfxVolumeText", sfxVolumeText);
            SetField(script, "_latencySlider", latencySlider);
            SetField(script, "_latencyText", latencyText);
            SetField(script, "_calibrateBtn", calibrateBtn);
            SetField(script, "_testLatencyBtn", testLatencyBtn);

            SetField(script, "_inputTypeDisplay", inputTypeDisplay);
            SetField(script, "_remapJumpBtn", remapJumpBtn);
            SetField(script, "_remapSlideBtn", remapSlideBtn);
            SetField(script, "_remapLeftBtn", remapLeftBtn);
            SetField(script, "_remapRightBtn", remapRightBtn);
            SetField(script, "_remapJumpText", remapJumpText);
            SetField(script, "_remapSlideText", remapSlideText);
            SetField(script, "_remapLeftText", remapLeftText);
            SetField(script, "_remapRightText", remapRightText);

            SetField(script, "_qualityDropdown", qualityDropdown);
            SetField(script, "_targetFpsSlider", targetFpsSlider);
            SetField(script, "_targetFpsText", targetFpsText);
            SetField(script, "_vsyncToggle", vsyncToggle);
            SetField(script, "_showPerfStatsToggle", showPerfStatsToggle);

            generalTab.SetActive(true);
            audioTab.SetActive(false);
            inputTab.SetActive(false);
            graphicsTab.SetActive(false);
            root.SetActive(false);
            return script;
        }

        private static void BuildGeneralContent(Transform parent, SettingsMenu script,
            out Toggle showTutorialToggle,
            out Slider masterVolumeSlider, out Text masterVolumeText)
        {
            var title = UIFactory.MakeText("Title", parent,
                "通用设置", 32, UIFactory.AccentBlue, TextAnchor.UpperLeft);
            PositionChild(title.transform, 0.05f, 0.90f, 0.95f, 0.98f);

            UIFactory.MakeRow(parent, 0.78f, out var rowT, out _);
            var tutLbl = UIFactory.MakeText("TutLbl", rowT,
                "显示教程（已完成后跳过）", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(tutLbl.transform, 0.05f, 0, 0.65f, 1);
            showTutorialToggle = UIFactory.MakeToggle("ShowTutorial", rowT,
                new Vector2(0.80f, 0.15f), new Vector2(0.95f, 0.85f), true);

            UIFactory.MakeRow(parent, 0.68f, out rowT, out _);
            var mvLbl = UIFactory.MakeText("MVLbl", rowT,
                "主音量", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(mvLbl.transform, 0.05f, 0, 0.25f, 1);
            masterVolumeSlider = UIFactory.MakeSlider("MasterVol", rowT,
                new Vector2(0.28f, 0.2f), new Vector2(0.80f, 0.8f), 0f, 1f, 1f,
                out masterVolumeText);
            masterVolumeText.text = "100%";
        }

        private static void BuildAudioContent(Transform parent, SettingsMenu script,
            out Slider musicVolumeSlider, out Text musicVolumeText,
            out Slider sfxVolumeSlider, out Text sfxVolumeText,
            out Slider latencySlider, out Text latencyText,
            out Button calibrateBtn, out Button testLatencyBtn)
        {
            var title = UIFactory.MakeText("Title", parent,
                "音频设置 - 延迟校准非常重要！", 32, new Color(1f, 0.7f, 0.3f), TextAnchor.UpperLeft);
            PositionChild(title.transform, 0.05f, 0.90f, 0.95f, 0.98f);

            UIFactory.MakeRow(parent, 0.82f, out var rowT, out _);
            var mvl = UIFactory.MakeText("MVL", rowT,
                "音乐音量", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(mvl.transform, 0.05f, 0, 0.25f, 1);
            musicVolumeSlider = UIFactory.MakeSlider("MusicVol", rowT,
                new Vector2(0.28f, 0.2f), new Vector2(0.75f, 0.8f), 0f, 1f, 0.8f,
                out musicVolumeText);
            musicVolumeText.text = "80%";

            UIFactory.MakeRow(parent, 0.72f, out rowT, out _);
            var svl = UIFactory.MakeText("SVL", rowT,
                "音效音量", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(svl.transform, 0.05f, 0, 0.25f, 1);
            sfxVolumeSlider = UIFactory.MakeSlider("SfxVol", rowT,
                new Vector2(0.28f, 0.2f), new Vector2(0.75f, 0.8f), 0f, 1f, 0.9f,
                out sfxVolumeText);
            sfxVolumeText.text = "90%";

            UIFactory.MakeRow(parent, 0.58f, out rowT, out _);
            var lal = UIFactory.MakeText("LAL", rowT,
                "音频延迟 (ms)", 22, new Color(1f, 0.7f, 0.3f), TextAnchor.MiddleLeft);
            PositionChild(lal.transform, 0.05f, 0, 0.28f, 1);
            latencySlider = UIFactory.MakeSlider("Latency", rowT,
                new Vector2(0.30f, 0.2f), new Vector2(0.65f, 0.8f), -500f, 500f, 0f,
                out latencyText);
            latencySlider.minValue = -500f;
            latencySlider.maxValue = 500f;
            latencyText.text = "0 ms";

            UIFactory.MakeRow(parent, 0.42f, out rowT, out _);
            Text calLbl, testLbl;
            calibrateBtn = UIFactory.MakeButton("CalibrateBtn", rowT,
                new Vector2(0.05f, 0.1f), new Vector2(0.48f, 0.9f),
                "🎵 自动校准节拍", 22, out calLbl, new Color(0.2f, 0.5f, 0.8f));
            testLatencyBtn = UIFactory.MakeButton("TestBtn", rowT,
                new Vector2(0.52f, 0.1f), new Vector2(0.95f, 0.9f),
                "🔊 试听节拍", 22, out testLbl, new Color(0.4f, 0.4f, 0.55f));
        }

        private static void BuildInputContent(Transform parent, SettingsMenu script,
            out InputTypeDisplay inputTypeDisplay,
            out Button remapJumpBtn, out Button remapSlideBtn,
            out Button remapLeftBtn, out Button remapRightBtn,
            out Text remapJumpText, out Text remapSlideText,
            out Text remapLeftText, out Text remapRightText)
        {
            var title = UIFactory.MakeText("Title", parent,
                "输入设置 - 支持键盘/触屏/手柄自动切换", 32, UIFactory.AccentCyan, TextAnchor.UpperLeft);
            PositionChild(title.transform, 0.05f, 0.90f, 0.95f, 0.98f);

            var inputDispGo = new GameObject("InputTypeDisplay", typeof(RectTransform));
            inputDispGo.transform.SetParent(parent, false);
            var idRt = (RectTransform)inputDispGo.transform;
            idRt.anchorMin = new Vector2(0.05f, 0.75f);
            idRt.anchorMax = new Vector2(0.95f, 0.87f);
            idRt.offsetMin = Vector2.zero;
            idRt.offsetMax = Vector2.zero;
            inputTypeDisplay = inputDispGo.AddComponent<InputTypeDisplay>();

            var kp = UIFactory.MakeImage("KeyboardPanel", inputDispGo.transform,
                new Vector2(0, 0), new Vector2(0.33f, 1),
                new Color(0.15f, 0.2f, 0.35f, 0.95f));
            var kpt = UIFactory.MakeText("KText", kp.transform,
                "⌨ 键盘", 20, Color.white, TextAnchor.MiddleCenter);
            PositionChild(kpt.transform, 0, 0, 1, 1);

            var tp = UIFactory.MakeImage("TouchPanel", inputDispGo.transform,
                new Vector2(0.33f, 0), new Vector2(0.66f, 1),
                new Color(0.15f, 0.35f, 0.2f, 0.7f));
            var tpt = UIFactory.MakeText("TText", tp.transform,
                "✋ 触屏", 20, Color.white, TextAnchor.MiddleCenter);
            PositionChild(tpt.transform, 0, 0, 1, 1);

            var gp = UIFactory.MakeImage("GamepadPanel", inputDispGo.transform,
                new Vector2(0.66f, 0), new Vector2(1, 1),
                new Color(0.35f, 0.15f, 0.35f, 0.7f));
            var gpt = UIFactory.MakeText("GText", gp.transform,
                "🎮 手柄", 20, Color.white, TextAnchor.MiddleCenter);
            PositionChild(gpt.transform, 0, 0, 1, 1);

            var curInGo = new GameObject("CurInputWrap", typeof(RectTransform), typeof(Image));
            curInGo.transform.SetParent(inputDispGo.transform, false);
            var ciRt = (RectTransform)curInGo.transform;
            ciRt.anchorMin = new Vector2(0.40f, 0.3f);
            ciRt.anchorMax = new Vector2(0.60f, 0.7f);
            ciRt.offsetMin = Vector2.zero;
            ciRt.offsetMax = Vector2.zero;
            var ciImg = curInGo.GetComponent<Image>();
            ciImg.sprite = RuntimeContentLoader.GetWhiteSprite();
            ciImg.color = new Color(0.3f, 0.6f, 1f, 0.95f);

            var curInText = UIFactory.MakeText("CurInputText", curInGo.transform,
                "键盘", 20, Color.white, TextAnchor.MiddleCenter);
            PositionChild(curInText.transform, 0, 0, 1, 1);

            var iconGo = new GameObject("CurInputIcon", typeof(RectTransform), typeof(Image));
            iconGo.transform.SetParent(curInGo.transform, false);

            SetField(inputTypeDisplay, "_keyboardPanel", kp);
            SetField(inputTypeDisplay, "_touchPanel", tp);
            SetField(inputTypeDisplay, "_gamepadPanel", gp);
            SetField(inputTypeDisplay, "_currentInputText", curInText);
            SetField(inputTypeDisplay, "_currentInputIcon", iconGo.GetComponent<Image>());
            SetField(inputTypeDisplay, "_keyboardIcon", null);
            SetField(inputTypeDisplay, "_touchIcon", null);
            SetField(inputTypeDisplay, "_gamepadIcon", null);

            UIFactory.MakeRow(parent, 0.62f, out var rowT, out _);
            Text jLbl, sLbl, lLbl, rLbl;
            remapJumpBtn = UIFactory.MakeButton("RemapJump", rowT,
                new Vector2(0.05f, 0.1f), new Vector2(0.48f, 0.9f),
                "跳跃", 22, out jLbl, new Color(0.35f, 0.35f, 0.5f));
            remapJumpText = jLbl;
            jLbl.text = "跳跃: Space";

            UIFactory.MakeRow(parent, 0.48f, out rowT, out _);
            remapSlideBtn = UIFactory.MakeButton("RemapSlide", rowT,
                new Vector2(0.05f, 0.1f), new Vector2(0.48f, 0.9f),
                "滑行: S", 22, out sLbl, new Color(0.35f, 0.35f, 0.5f));
            remapSlideText = sLbl;

            UIFactory.MakeRow(parent, 0.34f, out rowT, out _);
            remapLeftBtn = UIFactory.MakeButton("RemapLeft", rowT,
                new Vector2(0.05f, 0.1f), new Vector2(0.48f, 0.9f),
                "左切轨: A", 22, out lLbl, new Color(0.35f, 0.35f, 0.5f));
            remapLeftText = lLbl;

            UIFactory.MakeRow(parent, 0.20f, out rowT, out _);
            remapRightBtn = UIFactory.MakeButton("RemapRight", rowT,
                new Vector2(0.05f, 0.1f), new Vector2(0.48f, 0.9f),
                "右切轨: D", 22, out rLbl, new Color(0.35f, 0.35f, 0.5f));
            remapRightText = rLbl;

            var hint = UIFactory.MakeText("RemapHint", parent,
                "点击按钮后按任意键重映射；按 ESC 取消。触屏和手柄会自动检测切换。",
                16, UIFactory.TextMuted, TextAnchor.MiddleLeft);
            PositionChild(hint.transform, 0.55f, 0.15f, 0.95f, 0.60f);
        }

        private static void BuildGraphicsContent(Transform parent, SettingsMenu script,
            out Dropdown qualityDropdown,
            out Slider targetFpsSlider, out Text targetFpsText,
            out Toggle vsyncToggle, out Toggle showPerfStatsToggle)
        {
            var title = UIFactory.MakeText("Title", parent,
                "画质设置 - 帧率自适应", 32, new Color(0.7f, 0.6f, 1f), TextAnchor.UpperLeft);
            PositionChild(title.transform, 0.05f, 0.90f, 0.95f, 0.98f);

            UIFactory.MakeRow(parent, 0.78f, out var rowT, out _);
            var qLbl = UIFactory.MakeText("QLbl", rowT,
                "画质级别", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(qLbl.transform, 0.05f, 0, 0.25f, 1);
            qualityDropdown = UIFactory.MakeDropdown("Quality", rowT,
                new Vector2(0.28f, 0.15f), new Vector2(0.70f, 0.85f),
                new System.Collections.Generic.List<string> { "最低", "低", "中", "高", "最高", "超级" });

            UIFactory.MakeRow(parent, 0.65f, out rowT, out _);
            var fLbl = UIFactory.MakeText("FLbl", rowT,
                "目标帧率", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(fLbl.transform, 0.05f, 0, 0.25f, 1);
            targetFpsSlider = UIFactory.MakeSlider("TargetFps", rowT,
                new Vector2(0.28f, 0.2f), new Vector2(0.70f, 0.8f), 30f, 144f, 60f,
                out targetFpsText);
            targetFpsText.text = "60 FPS";

            UIFactory.MakeRow(parent, 0.48f, out rowT, out _);
            var vLbl = UIFactory.MakeText("VLbl", rowT,
                "垂直同步 (Vsync)", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(vLbl.transform, 0.05f, 0, 0.45f, 1);
            vsyncToggle = UIFactory.MakeToggle("Vsync", rowT,
                new Vector2(0.80f, 0.15f), new Vector2(0.95f, 0.85f), false);

            UIFactory.MakeRow(parent, 0.32f, out rowT, out _);
            var pLbl = UIFactory.MakeText("PLbl", rowT,
                "显示性能统计 (FPS/内存)", 22, Color.white, TextAnchor.MiddleLeft);
            PositionChild(pLbl.transform, 0.05f, 0, 0.55f, 1);
            showPerfStatsToggle = UIFactory.MakeToggle("PerfStats", rowT,
                new Vector2(0.80f, 0.15f), new Vector2(0.95f, 0.85f), false);
        }

        public static ResultsScreen BuildResults(Transform canvasT)
        {
            var root = UIFactory.MakePanel("ResultsRoot", canvasT,
                new Color(0.02f, 0.03f, 0.06f, 0.92f), Vector2.zero, Vector2.one);
            var script = root.AddComponent<ResultsScreen>();

            var panel = UIFactory.MakeImage("ResultsPanel", root.transform,
                new Vector2(0.15f, 0.08f), new Vector2(0.85f, 0.92f),
                new Color(0.06f, 0.08f, 0.14f, 0.98f));

            var top = UIFactory.MakeImage("TopBar", panel.transform,
                new Vector2(0, 0.88f), new Vector2(1, 1),
                new Color(0.3f, 0.6f, 1f, 0.15f));
            var trackName = UIFactory.MakeText("TrackName", top.transform,
                "", 30, Color.white, TextAnchor.MiddleLeft);
            PositionChild(trackName.transform, 0.18f, 0.1f, 0.80f, 0.6f);
            var artist = UIFactory.MakeText("Artist", top.transform,
                "", 18, UIFactory.TextMuted, TextAnchor.MiddleLeft);
            PositionChild(artist.transform, 0.18f, 0, 0.80f, 0.35f);
            var cover = UIFactory.MakeImage("Cover", top.transform,
                new Vector2(0.04f, 0.15f), new Vector2(0.14f, 0.85f), Color.white);

            var banner = UIFactory.MakeImage("NewHighScore", panel.transform,
                new Vector2(0.65f, 0.80f), new Vector2(0.95f, 0.87f),
                AccentYellow);
            var bannerText = UIFactory.MakeText("BannerText", banner.transform,
                "★ 新纪录 ★", 26, Color.black, TextAnchor.MiddleCenter);
            PositionChild(bannerText.transform, 0, 0, 1, 1);

            var rankIcon = UIFactory.MakeImage("RankIcon", panel.transform,
                new Vector2(0.10f, 0.68f), new Vector2(0.28f, 0.86f), AccentYellow);
            var rankText = UIFactory.MakeText("RankText", panel.transform,
                "S", 96, Color.black, TextAnchor.MiddleCenter);
            PositionChild(rankText.transform, 0.10f, 0.68f, 0.28f, 0.86f);

            var score = UIFactory.MakeText("ScoreText", panel.transform,
                "0", 72, Color.white, TextAnchor.MiddleRight);
            PositionChild(score.transform, 0.40f, 0.70f, 0.92f, 0.86f);
            var acc = UIFactory.MakeText("AccuracyText", panel.transform,
                "100.00%", 28, UIFactory.AccentCyan, TextAnchor.MiddleRight);
            PositionChild(acc.transform, 0.55f, 0.63f, 0.92f, 0.70f);

            var breakdown = UIFactory.MakeImage("BreakdownPanel", panel.transform,
                new Vector2(0.08f, 0.34f), new Vector2(0.92f, 0.60f),
                new Color(0.10f, 0.13f, 0.22f, 0.95f));

            AddBreakdownRow(breakdown, 0.80f, "PERFECT", out var perfectText,
                new Color(1f, 0.85f, 0.2f));
            AddBreakdownRow(breakdown, 0.62f, "GREAT", out var greatText,
                new Color(0.3f, 1f, 0.5f));
            AddBreakdownRow(breakdown, 0.44f, "GOOD", out var goodText,
                new Color(0.4f, 0.7f, 1f));
            AddBreakdownRow(breakdown, 0.26f, "MISS", out var missText,
                new Color(1f, 0.4f, 0.4f));
            AddBreakdownRow(breakdown, 0.08f, "最大连击", out var maxComboText,
                new Color(1f, 0.6f, 0.3f));

            var fragRow = UIFactory.MakeImage("FragRow", panel.transform,
                new Vector2(0.08f, 0.22f), new Vector2(0.92f, 0.30f),
                new Color(0.10f, 0.18f, 0.22f, 0.95f));
            var fragLabel = UIFactory.MakeText("FragLbl", fragRow.transform,
                "收集碎片", 22, UIFactory.AccentCyan, TextAnchor.MiddleLeft);
            PositionChild(fragLabel.transform, 0.05f, 0, 0.40f, 1);
            var fragmentsText = UIFactory.MakeText("FragmentsText", fragRow.transform,
                "+0", 28, UIFactory.AccentCyan, TextAnchor.MiddleRight);
            PositionChild(fragmentsText.transform, 0.60f, 0, 0.95f, 1);

            var hsRow = UIFactory.MakeImage("HighScoreRow", panel.transform,
                new Vector2(0.08f, 0.14f), new Vector2(0.92f, 0.21f),
                new Color(0.15f, 0.12f, 0.22f, 0.95f));
            var hsLabel = UIFactory.MakeText("HSLbl", hsRow.transform,
                "最高分", 20, UIFactory.TextMuted, TextAnchor.MiddleLeft);
            PositionChild(hsLabel.transform, 0.05f, 0, 0.30f, 1);
            var highScoreText = UIFactory.MakeText("HighScoreText", hsRow.transform,
                "0", 26, Color.white, TextAnchor.MiddleRight);
            PositionChild(highScoreText.transform, 0.60f, 0, 0.95f, 1);

            Text retryLbl, nextLbl, menuLbl, contLbl;
            var retryBtn = UIFactory.MakeButton("RetryBtn", panel.transform,
                new Vector2(0.08f, 0.02f), new Vector2(0.29f, 0.11f),
                "重 玩", 24, out retryLbl, new Color(0.3f, 0.55f, 0.35f));
            var nextBtn = UIFactory.MakeButton("NextBtn", panel.transform,
                new Vector2(0.31f, 0.02f), new Vector2(0.52f, 0.11f),
                "下一首", 24, out nextLbl, UIFactory.AccentBlue);
            var continueBtn = UIFactory.MakeButton("ContinueBtn", panel.transform,
                new Vector2(0.54f, 0.02f), new Vector2(0.75f, 0.11f),
                "继续", 24, out contLbl, new Color(0.45f, 0.45f, 0.6f));
            var backBtn = UIFactory.MakeButton("BackBtn", panel.transform,
                new Vector2(0.77f, 0.02f), new Vector2(0.92f, 0.11f),
                "主菜单", 22, out menuLbl, new Color(0.55f, 0.25f, 0.30f));

            SetField(script, "_resultsRoot", root);
            SetField(script, "_trackNameText", trackName);
            SetField(script, "_artistText", artist);
            SetField(script, "_trackCover", cover);
            SetField(script, "_rankText", rankText);
            SetField(script, "_rankIcon", rankIcon);
            SetField(script, "_scoreText", score);
            SetField(script, "_accuracyText", acc);
            SetField(script, "_perfectText", perfectText);
            SetField(script, "_greatText", greatText);
            SetField(script, "_goodText", goodText);
            SetField(script, "_missText", missText);
            SetField(script, "_maxComboText", maxComboText);
            SetField(script, "_fragmentsText", fragmentsText);
            SetField(script, "_newHighScoreBanner", banner);
            SetField(script, "_highScoreText", highScoreText);
            SetField(script, "_retryBtn", retryBtn);
            SetField(script, "_nextBtn", nextBtn);
            SetField(script, "_backToMenuBtn", backBtn);
            SetField(script, "_continueBtn", continueBtn);

            banner.SetActive(false);
            root.SetActive(false);
            return script;
        }

        private static void AddBreakdownRow(Transform parent, float yMin, string label,
            out Text countText, Color accent)
        {
            float span = 0.16f;
            var row = UIFactory.MakeImage("Row_" + label, parent,
                new Vector2(0.04f, yMin), new Vector2(0.96f, yMin + span),
                new Color(0, 0, 0, 0));
            var lbl = UIFactory.MakeText("Label", row.transform,
                label, 22, accent, TextAnchor.MiddleLeft);
            PositionChild(lbl.transform, 0.02f, 0, 0.50f, 1);
            countText = UIFactory.MakeText("Count", row.transform,
                "0", 28, Color.white, TextAnchor.MiddleRight);
            PositionChild(countText.transform, 0.60f, 0, 0.98f, 1);
        }

        public static GameOverScreen BuildGameOver(Transform canvasT)
        {
            var root = UIFactory.MakePanel("GameOverRoot", canvasT,
                new Color(0.05f, 0.01f, 0.01f, 0.92f), Vector2.zero, Vector2.one);
            var script = root.AddComponent<GameOverScreen>();

            var panel = UIFactory.MakeImage("OverPanel", root.transform,
                new Vector2(0.28f, 0.18f), new Vector2(0.72f, 0.82f),
                new Color(0.12f, 0.05f, 0.07f, 0.98f));

            var title = UIFactory.MakeText("Title", panel.transform,
                "挑 战 失 败", 56, new Color(1f, 0.35f, 0.35f), TextAnchor.UpperCenter);
            PositionChild(title.transform, 0, 0.80f, 1, 0.95f);

            var reason = UIFactory.MakeText("Reason", panel.transform,
                "撞上了障碍物", 24, UIFactory.TextMuted, TextAnchor.MiddleCenter);
            PositionChild(reason.transform, 0.1f, 0.70f, 0.9f, 0.78f);

            var statsPanel = UIFactory.MakeImage("Stats", panel.transform,
                new Vector2(0.10f, 0.42f), new Vector2(0.90f, 0.66f),
                new Color(0.15f, 0.08f, 0.10f, 0.95f));
            var sLbl = UIFactory.MakeText("ScoreLbl", statsPanel.transform,
                "本次分数", 18, UIFactory.TextMuted, TextAnchor.UpperCenter);
            PositionChild(sLbl.transform, 0.05f, 0.60f, 0.55f, 0.95f);
            var scoreText = UIFactory.MakeText("Score", statsPanel.transform,
                "0", 52, Color.white, TextAnchor.MiddleCenter);
            PositionChild(scoreText.transform, 0.05f, 0, 0.55f, 0.70f);

            var fragText = UIFactory.MakeText("FragText", statsPanel.transform,
                "+0", 28, UIFactory.AccentCyan, TextAnchor.MiddleCenter);
            PositionChild(fragText.transform, 0.60f, 0.05f, 0.95f, 0.50f);
            var comboText = UIFactory.MakeText("ComboText", statsPanel.transform,
                "连击: 0", 22, AccentYellow, TextAnchor.MiddleCenter);
            PositionChild(comboText.transform, 0.60f, 0.55f, 0.95f, 0.95f);

            var hint = UIFactory.MakeImage("TutorialHint", panel.transform,
                new Vector2(0.10f, 0.33f), new Vector2(0.90f, 0.39f),
                new Color(0.25f, 0.18f, 0.05f, 0.95f));
            var hintText = UIFactory.MakeText("HintText", hint.transform,
                "💡 建议先完成教程熟悉操作", 20, new Color(1f, 0.85f, 0.3f), TextAnchor.MiddleCenter);
            PositionChild(hintText.transform, 0, 0, 1, 1);

            Text retryLbl, tutLbl, menuLbl;
            var retryBtn = UIFactory.MakeButton("RetryBtn", panel.transform,
                new Vector2(0.10f, 0.18f), new Vector2(0.90f, 0.29f),
                "再 试 一 次", 28, out retryLbl, new Color(0.3f, 0.55f, 0.35f));
            var tutorialBtn = UIFactory.MakeButton("RestartTutorialBtn", panel.transform,
                new Vector2(0.10f, 0.07f), new Vector2(0.54f, 0.16f),
                "重看教程", 22, out tutLbl, new Color(0.25f, 0.4f, 0.6f));
            var menuBtn = UIFactory.MakeButton("BackBtn", panel.transform,
                new Vector2(0.56f, 0.07f), new Vector2(0.90f, 0.16f),
                "返回主菜单", 22, out menuLbl, new Color(0.55f, 0.25f, 0.30f));

            SetField(script, "_gameOverRoot", root);
            SetField(script, "_titleText", title);
            SetField(script, "_scoreText", scoreText);
            SetField(script, "_fragmentText", fragText);
            SetField(script, "_comboText", comboText);
            SetField(script, "_reasonText", reason);
            SetField(script, "_retryBtn", retryBtn);
            SetField(script, "_restartTutorialBtn", tutorialBtn);
            SetField(script, "_backToMenuBtn", menuBtn);
            SetField(script, "_tutorialHint", hint);

            hint.SetActive(false);
            tutorialBtn.gameObject.SetActive(false);
            root.SetActive(false);
            return script;
        }

        public static AudioCalibration BuildAudioCalibration(Transform canvasT)
        {
            var root = UIFactory.MakePanel("CalibrationRoot", canvasT,
                new Color(0.02f, 0.03f, 0.06f, 0.96f), Vector2.zero, Vector2.one);
            var script = root.AddComponent<AudioCalibration>();

            var panel = UIFactory.MakeImage("Panel", root.transform,
                new Vector2(0.22f, 0.12f), new Vector2(0.78f, 0.88f),
                new Color(0.07f, 0.09f, 0.16f, 0.98f));

            var title = UIFactory.MakeText("Title", panel.transform,
                "🎵 音频延迟校准", 40, new Color(1f, 0.7f, 0.3f), TextAnchor.UpperCenter);
            PositionChild(title.transform, 0, 0.88f, 1, 0.97f);

            var status = UIFactory.MakeText("Status", panel.transform,
                "点击「开始校准」后跟随节拍点击按钮", 22, Color.white, TextAnchor.MiddleCenter);
            PositionChild(status.transform, 0.1f, 0.78f, 0.9f, 0.85f);

            var tapCount = UIFactory.MakeText("TapCount", panel.transform,
                "0 / 8", 32, UIFactory.AccentCyan, TextAnchor.MiddleCenter);
            PositionChild(tapCount.transform, 0.1f, 0.68f, 0.9f, 0.76f);

            Text tapLbl;
            var tapBtn = UIFactory.MakeButton("TapBtn", panel.transform,
                new Vector2(0.25f, 0.50f), new Vector2(0.75f, 0.66f),
                "按 这 里", 40, out tapLbl, new Color(0.3f, 0.55f, 0.8f));

            var valPanel = UIFactory.MakeImage("ValPanel", panel.transform,
                new Vector2(0.12f, 0.36f), new Vector2(0.88f, 0.46f),
                new Color(0.1f, 0.13f, 0.22f, 0.95f));
            var valLbl = UIFactory.MakeText("ValLbl", valPanel.transform,
                "延迟值", 20, UIFactory.TextMuted, TextAnchor.MiddleLeft);
            PositionChild(valLbl.transform, 0.03f, 0, 0.25f, 1);
            var latencyValueText = UIFactory.MakeText("LatencyValue", valPanel.transform,
                "0 ms", 30, AccentYellow, TextAnchor.MiddleCenter);
            PositionChild(latencyValueText.transform, 0.30f, 0, 0.70f, 1);

            var sliderRow = UIFactory.MakeImage("SliderRow", panel.transform,
                new Vector2(0.12f, 0.26f), new Vector2(0.88f, 0.34f),
                new Color(0, 0, 0, 0));
            GameObject sliderGo;
            var manualSlider = UIFactory.InternalMakeSlider(sliderRow, out sliderGo,
                out Image fill, out Image handle);
            manualSlider.minValue = -500f;
            manualSlider.maxValue = 500f;
            manualSlider.value = 0f;
            fill.color = new Color(1f, 0.7f, 0.3f);
            var sRt = sliderGo.GetComponent<RectTransform>();
            sRt.anchorMin = new Vector2(0, 0.3f);
            sRt.anchorMax = new Vector2(1, 0.7f);
            sRt.offsetMin = Vector2.zero;
            sRt.offsetMax = Vector2.zero;
            sliderGo.transform.SetParent(sliderRow, false);

            Text startLbl, applyLbl, cancelLbl;
            var startBtn = UIFactory.MakeButton("StartBtn", panel.transform,
                new Vector2(0.12f, 0.12f), new Vector2(0.38f, 0.22f),
                "开始校准", 22, out startLbl, new Color(0.25f, 0.5f, 0.3f));
            var applyBtn = UIFactory.MakeButton("ApplyBtn", panel.transform,
                new Vector2(0.40f, 0.12f), new Vector2(0.66f, 0.22f),
                "应用设置", 22, out applyLbl, UIFactory.AccentBlue);
            var cancelBtn = UIFactory.MakeButton("CancelBtn", panel.transform,
                new Vector2(0.68f, 0.12f), new Vector2(0.88f, 0.22f),
                "取消", 22, out cancelLbl, new Color(0.5f, 0.2f, 0.25f));

            AudioClip metronome = RuntimeContentLoader.CreateClickClip();
            SetField(script, "_calibrationRoot", root);
            SetField(script, "_startBtn", startBtn);
            SetField(script, "_tapBtn", tapBtn);
            SetField(script, "_applyBtn", applyBtn);
            SetField(script, "_cancelBtn", cancelBtn);
            SetField(script, "_manualSlider", manualSlider);
            SetField(script, "_latencyValueText", latencyValueText);
            SetField(script, "_statusText", status);
            SetField(script, "_tapCountText", tapCount);
            SetField(script, "_metronomeClip", metronome);

            root.SetActive(false);
            return script;
        }
    }
}
