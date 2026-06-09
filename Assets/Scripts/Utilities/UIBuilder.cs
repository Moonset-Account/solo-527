using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;
using DecorMatch3.Gameplay.Match3;
using DecorMatch3.Gameplay.Decoration;
using DecorMatch3.Gameplay.Customer;
using DecorMatch3.UI;

namespace DecorMatch3
{
    internal static class UIBuilder
    {
        // ======================== MainMenu ========================
        public static void BuildMainMenu(GameObject root, MainMenuView view)
        {
            Transform p = root.transform;

            UIPrim.MakePanel(p, "Bg", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.12f, 0.1f, 0.22f));

            RectTransform logoRT = UIPrim.MakePanel(p, "Logo",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(-300, 220), new Vector2(600, 180),
                new Color(0.25f, 0.2f, 0.5f, 0f));
            UIPrim.MakeText(logoRT, "LogoText", "装修配色三消", 68, TextAnchor.MiddleCenter,
                Vector2.zero, new Vector2(600, 180), new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "logoTransform", logoRT);

            Button startBtn = UIPrim.MakeButton(p, "StartBtn", "开始游戏",
                new Vector2(0, 80), new Vector2(360, 90),
                new Color(0.9f, 0.55f, 0.3f), Color.white, 32);
            UIPrim.SetField(view, "startGameButton", startBtn);

            Button levelBtn = UIPrim.MakeButton(p, "LevelSelectBtn", "关卡选择",
                new Vector2(0, -40), new Vector2(360, 70),
                new Color(0.35f, 0.55f, 0.85f), Color.white, 26);
            UIPrim.SetField(view, "levelSelectButton", levelBtn);

            Button tutBtn = UIPrim.MakeButton(p, "TutorialBtn", "新手教程",
                new Vector2(0, -140), new Vector2(360, 70),
                new Color(0.45f, 0.75f, 0.55f), Color.white, 26);
            UIPrim.SetField(view, "tutorialButton", tutBtn);

            Button setBtn = UIPrim.MakeButton(p, "SettingsBtn", "游戏设置",
                new Vector2(0, -240), new Vector2(360, 70),
                new Color(0.55f, 0.45f, 0.75f), Color.white, 26);
            UIPrim.SetField(view, "settingsButton", setBtn);

            RectTransform infoPanel = UIPrim.MakePanel(p, "InfoPanel",
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(40, -160), new Vector2(-40, -40),
                new Color(0.15f, 0.12f, 0.28f, 0.7f));
            Text pn = UIPrim.MakeText(infoPanel, "PlayerName", "设计师", 28,
                TextAnchor.MiddleLeft, new Vector2(-420, 0), new Vector2(280, 80),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "playerNameText", UIPrim.ToTMP(pn));
            Text lv = UIPrim.MakeText(infoPanel, "Level", "Lv.1", 26,
                TextAnchor.MiddleLeft, new Vector2(-120, 0), new Vector2(180, 80),
                Color.white);
            UIPrim.SetField(view, "levelText", UIPrim.ToTMP(lv));
            Text cn = UIPrim.MakeText(infoPanel, "Coins", "0", 26,
                TextAnchor.MiddleRight, new Vector2(220, 0), new Vector2(180, 80),
                new Color(1f, 0.85f, 0.3f));
            UIPrim.SetField(view, "coinsText", UIPrim.ToTMP(cn));
            Text xp = UIPrim.MakeText(infoPanel, "XP", "XP: 0/1000", 22,
                TextAnchor.MiddleRight, new Vector2(480, 0), new Vector2(220, 80),
                new Color(0.8f, 0.8f, 1f));
            UIPrim.SetField(view, "xpText", UIPrim.ToTMP(xp));
        }

        // ======================== Tutorial ========================
        public static void BuildTutorial(GameObject root, TutorialView view, SceneBuildType sceneType)
        {
            Transform p = root.transform;

            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.75f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(1000, 720),
                new Color(0.15f, 0.12f, 0.25f));

            Text title = UIPrim.MakeText(panel, "Title", "教程", 48,
                TextAnchor.MiddleCenter, new Vector2(0, 280), new Vector2(800, 100),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "titleText", UIPrim.ToTMP(title));

            Text desc = UIPrim.MakeTextStretch(panel, "Desc", "描述内容", 28,
                TextAnchor.UpperLeft,
                new Vector2(0.1f, 0.35f), new Vector2(0.9f, 0.7f),
                new Vector2(40, 20), new Vector2(-40, -20),
                Color.white);
            UIPrim.SetField(view, "descriptionText", UIPrim.ToTMP(desc));

            Image hi = UIPrim.MakePanel(panel, "Highlight",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(400, 400),
                new Color(1, 1, 1, 0)).GetComponent<Image>();
            UIPrim.SetField(view, "highlightImage", hi);
            hi.gameObject.SetActive(false);

            RectTransform progressArea = UIPrim.MakePanel(panel, "ProgressArea",
                new Vector2(0, 0), new Vector2(1, 0),
                new Vector2(40, 90), new Vector2(-40, 170),
                new Color(0.1f, 0.08f, 0.18f, 0.5f));

            Image pbarBg = UIPrim.MakePanel(progressArea, "PBarBg",
                Vector2.zero, Vector2.one,
                new Vector2(20, 25), new Vector2(-20, -25),
                new Color(0.25f, 0.25f, 0.4f)).GetComponent<Image>();
            Image pbarFill = UIPrim.MakePanel(pbarBg.transform, "Fill",
                new Vector2(0, 0), new Vector2(0, 1),
                Vector2.zero, new Vector2(0, 0),
                new Color(0.3f, 0.85f, 0.5f)).GetComponent<Image>();
            pbarFill.type = Image.Type.Filled;
            pbarFill.fillMethod = Image.FillMethod.Horizontal;
            pbarFill.fillAmount = 0;
            UIPrim.SetField(view, "progressBarFill", pbarFill);

            Text counter = UIPrim.MakeText(progressArea, "Counter", "1 / 6", 24,
                TextAnchor.MiddleCenter, new Vector2(0, -15), new Vector2(300, 40),
                Color.white);
            UIPrim.SetField(view, "stepCounterText", UIPrim.ToTMP(counter));

            Button nextB = UIPrim.MakeButton(panel, "NextBtn", "下一页",
                new Vector2(250, -280), new Vector2(220, 70),
                new Color(0.35f, 0.6f, 0.9f), Color.white, 26);
            UIPrim.SetField(view, "nextBtn", nextB);
            UIPrim.SetField(view, "nextButton", nextB.gameObject);

            Button prevB = UIPrim.MakeButton(panel, "PrevBtn", "上一页",
                new Vector2(0, -280), new Vector2(220, 70),
                new Color(0.5f, 0.55f, 0.7f), Color.white, 26);
            UIPrim.SetField(view, "prevBtn", prevB);
            UIPrim.SetField(view, "prevButton", prevB.gameObject);

            Button skipB = UIPrim.MakeButton(panel, "SkipBtn", "跳过",
                new Vector2(-380, -280), new Vector2(180, 60),
                new Color(0.5f, 0.45f, 0.55f), Color.white, 22);
            UIPrim.SetField(view, "skipBtn", skipB);
            UIPrim.SetField(view, "skipButton", skipB.gameObject);

            Button closeB = UIPrim.MakeButton(panel, "CloseBtn", "完成",
                new Vector2(380, -280), new Vector2(200, 70),
                new Color(0.4f, 0.8f, 0.5f), Color.white, 26);
            UIPrim.SetField(view, "closeBtn", closeB);
            UIPrim.SetField(view, "closeButton", closeB.gameObject);
            closeB.gameObject.SetActive(false);
        }

        // ======================== Settings ========================
        public static void BuildSettings(GameObject root, SettingsView view, SceneBuildType sceneType)
        {
            Transform p = root.transform;

            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.7f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(1100, 900),
                new Color(0.13f, 0.1f, 0.22f));

            Text title = UIPrim.MakeText(panel, "Title", "游戏设置", 44,
                TextAnchor.MiddleCenter, new Vector2(0, 400), new Vector2(600, 80),
                new Color(1f, 0.92f, 0.6f));

            // Audio section
            float y = 320;
            Text secAudio = UIPrim.MakeText(panel, "SecAudio", "音频设置", 28,
                TextAnchor.MiddleLeft, new Vector2(-450, y), new Vector2(300, 50),
                new Color(0.75f, 0.85f, 1f));
            y -= 80;

            Text mvLbl = UIPrim.MakeText(panel, "MvLbl", "主音量", 22,
                TextAnchor.MiddleLeft, new Vector2(-420, y), new Vector2(180, 40),
                Color.white);
            Slider mv = UIPrim.MakeSlider(panel, "MasterVol", new Vector2(0, y), new Vector2(400, 40),
                0f, 1f, 0.8f, new Color(0.25f, 0.25f, 0.4f), new Color(0.45f, 0.7f, 1f));
            Text mvTxt = UIPrim.MakeText(panel, "MvTxt", "80%", 22,
                TextAnchor.MiddleRight, new Vector2(370, y), new Vector2(120, 40),
                Color.white);
            UIPrim.SetField(view, "masterVolumeSlider", mv);
            UIPrim.SetField(view, "masterVolumeText", UIPrim.ToTMP(mvTxt));
            y -= 70;

            Text msLbl = UIPrim.MakeText(panel, "MsLbl", "音乐音量", 22,
                TextAnchor.MiddleLeft, new Vector2(-420, y), new Vector2(180, 40),
                Color.white);
            Slider ms = UIPrim.MakeSlider(panel, "MusicVol", new Vector2(0, y), new Vector2(400, 40),
                0f, 1f, 0.7f, new Color(0.25f, 0.25f, 0.4f), new Color(0.85f, 0.65f, 1f));
            Text msTxt = UIPrim.MakeText(panel, "MsTxt", "70%", 22,
                TextAnchor.MiddleRight, new Vector2(370, y), new Vector2(120, 40),
                Color.white);
            Toggle msMute = UIPrim.MakeToggle(panel, "MsMute", new Vector2(470, y), new Vector2(40, 40), false);
            UIPrim.SetField(view, "musicVolumeSlider", ms);
            UIPrim.SetField(view, "musicVolumeText", UIPrim.ToTMP(msTxt));
            UIPrim.SetField(view, "musicMuteToggle", msMute);
            y -= 70;

            Text sxLbl = UIPrim.MakeText(panel, "SxLbl", "音效音量", 22,
                TextAnchor.MiddleLeft, new Vector2(-420, y), new Vector2(180, 40),
                Color.white);
            Slider sx = UIPrim.MakeSlider(panel, "SFXVol", new Vector2(0, y), new Vector2(400, 40),
                0f, 1f, 0.8f, new Color(0.25f, 0.25f, 0.4f), new Color(0.9f, 0.8f, 0.45f));
            Text sxTxt = UIPrim.MakeText(panel, "SxTxt", "80%", 22,
                TextAnchor.MiddleRight, new Vector2(370, y), new Vector2(120, 40),
                Color.white);
            Toggle sxMute = UIPrim.MakeToggle(panel, "SxMute", new Vector2(470, y), new Vector2(40, 40), false);
            UIPrim.SetField(view, "sfxVolumeSlider", sx);
            UIPrim.SetField(view, "sfxVolumeText", UIPrim.ToTMP(sxTxt));
            UIPrim.SetField(view, "sfxMuteToggle", sxMute);
            y -= 100;

            // Display
            Text secDisp = UIPrim.MakeText(panel, "SecDisp", "显示设置", 28,
                TextAnchor.MiddleLeft, new Vector2(-450, y), new Vector2(300, 50),
                new Color(0.75f, 0.85f, 1f));
            y -= 70;

            Text fsLbl = UIPrim.MakeText(panel, "FsLbl", "全屏模式", 22,
                TextAnchor.MiddleLeft, new Vector2(-420, y), new Vector2(220, 40),
                Color.white);
            Toggle fs = UIPrim.MakeToggle(panel, "Fullscreen", new Vector2(-100, y), new Vector2(40, 40), true);
            UIPrim.SetField(view, "fullscreenToggle", fs);

            Text qlLbl = UIPrim.MakeText(panel, "QlLbl", "画质等级", 22,
                TextAnchor.MiddleLeft, new Vector2(100, y), new Vector2(180, 40),
                Color.white);
            GameObject ddGO = new GameObject("QualityDD"); ddGO.transform.SetParent(panel, false);
            RectTransform ddRT = ddGO.AddComponent<RectTransform>();
            ddRT.anchorMin = ddRT.anchorMax = new Vector2(0.5f, 0.5f);
            ddRT.anchoredPosition = new Vector2(380, y); ddRT.sizeDelta = new Vector2(220, 40);
            Image ddBg = ddGO.AddComponent<Image>();
            ddBg.color = new Color(0.25f, 0.25f, 0.4f); ddBg.sprite = UIPrim.MakeSprite(new Color(0.25f, 0.25f, 0.4f));
            TMP_Dropdown qlDD = ddGO.AddComponent<TMP_Dropdown>();
            UIPrim.SetField(view, "qualityDropdown", qlDD);
            y -= 100;

            // Gameplay
            Text secGame = UIPrim.MakeText(panel, "SecGame", "游戏设置", 28,
                TextAnchor.MiddleLeft, new Vector2(-450, y), new Vector2(300, 50),
                new Color(0.75f, 0.85f, 1f));
            y -= 70;

            Text tutLbl = UIPrim.MakeText(panel, "TutLbl", "显示教程", 22,
                TextAnchor.MiddleLeft, new Vector2(-420, y), new Vector2(220, 40),
                Color.white);
            Toggle tut = UIPrim.MakeToggle(panel, "TutorialTg", new Vector2(-100, y), new Vector2(40, 40), true);
            UIPrim.SetField(view, "tutorialToggle", tut);

            Text vibLbl = UIPrim.MakeText(panel, "VibLbl", "震动反馈", 22,
                TextAnchor.MiddleLeft, new Vector2(100, y), new Vector2(180, 40),
                Color.white);
            Toggle vib = UIPrim.MakeToggle(panel, "VibrationTg", new Vector2(420, y), new Vector2(40, 40), true);
            UIPrim.SetField(view, "vibrationToggle", vib);
            y -= 60;

            Text asLbl = UIPrim.MakeText(panel, "AsLbl", "自动存档", 22,
                TextAnchor.MiddleLeft, new Vector2(-420, y), new Vector2(220, 40),
                Color.white);
            Toggle ast = UIPrim.MakeToggle(panel, "AutoSaveTg", new Vector2(-100, y), new Vector2(40, 40), true);
            UIPrim.SetField(view, "autoSaveToggle", ast);
            y -= 110;

            // Bottom buttons
            Button backBtn = UIPrim.MakeButton(panel, "BackBtn", "返回",
                new Vector2(-380, y), new Vector2(200, 70),
                new Color(0.5f, 0.5f, 0.65f), Color.white, 26);
            UIPrim.SetField(view, "backButton", backBtn);

            Button applyBtn = UIPrim.MakeButton(panel, "ApplyBtn", "应用",
                new Vector2(-120, y), new Vector2(200, 70),
                new Color(0.35f, 0.65f, 0.9f), Color.white, 26);
            UIPrim.SetField(view, "applyButton", applyBtn);

            Button rstBtn = UIPrim.MakeButton(panel, "RstBtn", "重置设置",
                new Vector2(140, y), new Vector2(200, 70),
                new Color(0.85f, 0.65f, 0.35f), Color.white, 26);
            UIPrim.SetField(view, "resetSettingsButton", rstBtn);

            Button clrBtn = UIPrim.MakeButton(panel, "ClrBtn", "清除进度",
                new Vector2(400, y), new Vector2(200, 70),
                new Color(0.85f, 0.4f, 0.4f), Color.white, 26);
            UIPrim.SetField(view, "resetProgressButton", clrBtn);
            y -= 90;

            RectTransform confirmPanel = UIPrim.MakePanel(panel, "ResetConfirm",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(520, 260),
                new Color(0.2f, 0.12f, 0.18f));
            UIPrim.SetField(view, "resetConfirmPanel", confirmPanel.gameObject);
            UIPrim.MakeText(confirmPanel, "ConfirmText", "确定要清除所有存档进度吗？\n此操作不可撤销！", 26,
                TextAnchor.MiddleCenter, new Vector2(0, 40), new Vector2(460, 120),
                Color.white);
            Button cfm = UIPrim.MakeButton(confirmPanel, "ConfirmBtn", "确定清除",
                new Vector2(-110, -80), new Vector2(180, 60), new Color(0.85f, 0.35f, 0.35f), Color.white, 22);
            UIPrim.SetField(view, "confirmResetButton", cfm);
            Button ccl = UIPrim.MakeButton(confirmPanel, "CancelBtn", "取消",
                new Vector2(110, -80), new Vector2(180, 60), new Color(0.5f, 0.5f, 0.6f), Color.white, 22);
            UIPrim.SetField(view, "cancelResetButton", ccl);
            confirmPanel.gameObject.SetActive(false);
        }

        // ======================== PauseMenu ========================
        public static void BuildPause(GameObject root, PauseMenuView view, SceneBuildType sceneType)
        {
            Transform p = root.transform;

            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.7f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(720, 820),
                new Color(0.14f, 0.1f, 0.24f));

            Text title = UIPrim.MakeText(panel, "Title", "游戏暂停", 52,
                TextAnchor.MiddleCenter, new Vector2(0, 330), new Vector2(600, 100),
                new Color(1f, 0.92f, 0.6f));

            Text lvName = UIPrim.MakeText(panel, "LevelName", "关卡 1", 26,
                TextAnchor.MiddleCenter, new Vector2(0, 230), new Vector2(500, 50),
                Color.white);
            UIPrim.SetField(view, "levelNameText", UIPrim.ToTMP(lvName));

            Text scTxt = UIPrim.MakeText(panel, "Score", "得分: 0", 26,
                TextAnchor.MiddleCenter, new Vector2(0, 175), new Vector2(500, 50),
                new Color(1f, 0.85f, 0.4f));
            UIPrim.SetField(view, "currentScoreText", UIPrim.ToTMP(scTxt));

            Text mvTxt = UIPrim.MakeText(panel, "Moves", "剩余步数: 30", 26,
                TextAnchor.MiddleCenter, new Vector2(0, 120), new Vector2(500, 50),
                new Color(0.75f, 0.9f, 1f));
            UIPrim.SetField(view, "movesLeftText", UIPrim.ToTMP(mvTxt));

            Button resume = UIPrim.MakeButton(panel, "ResumeBtn", "继续游戏",
                new Vector2(0, 0), new Vector2(380, 80),
                new Color(0.4f, 0.75f, 0.5f), Color.white, 30);
            UIPrim.SetField(view, "resumeButton", resume);

            Button restart = UIPrim.MakeButton(panel, "RestartBtn", "重新开始",
                new Vector2(0, -110), new Vector2(380, 80),
                new Color(0.85f, 0.7f, 0.35f), Color.white, 30);
            UIPrim.SetField(view, "restartButton", restart);

            Button setts = UIPrim.MakeButton(panel, "SettingsBtn", "游戏设置",
                new Vector2(0, -220), new Vector2(380, 80),
                new Color(0.45f, 0.65f, 0.95f), Color.white, 30);
            UIPrim.SetField(view, "settingsButton", setts);

            Button mm = UIPrim.MakeButton(panel, "MainMenuBtn", "返回主菜单",
                new Vector2(0, -330), new Vector2(380, 80),
                new Color(0.65f, 0.5f, 0.85f), Color.white, 30);
            UIPrim.SetField(view, "mainMenuButton", mm);
        }

        // ======================== Match3HUD ========================
        public static void BuildMatch3HUD(GameObject root, Match3HUDView view)
        {
            Transform p = root.transform;

            RectTransform topBar = UIPrim.MakePanel(p, "TopBar",
                new Vector2(0, 1), new Vector2(1, 1),
                Vector2.zero, new Vector2(0, 130),
                new Color(0.08f, 0.06f, 0.16f, 0.85f));

            Text lvName = UIPrim.MakeText(topBar, "LevelName", "关卡 1", 28,
                TextAnchor.MiddleLeft, new Vector2(-820, 0), new Vector2(300, 60),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "levelNameText", UIPrim.ToTMP(lvName));

            Text sc = UIPrim.MakeText(topBar, "Score", "0", 44,
                TextAnchor.MiddleCenter, new Vector2(-280, 0), new Vector2(220, 80),
                new Color(1f, 0.85f, 0.3f));
            UIPrim.SetField(view, "scoreText", UIPrim.ToTMP(sc));

            Text ts = UIPrim.MakeText(topBar, "TargetScore", "/ 1000", 24,
                TextAnchor.MiddleCenter, new Vector2(-80, 10), new Vector2(200, 50),
                Color.gray);
            UIPrim.SetField(view, "targetScoreText", UIPrim.ToTMP(ts));

            Text mv = UIPrim.MakeText(topBar, "Moves", "30", 56,
                TextAnchor.MiddleCenter, new Vector2(200, 0), new Vector2(180, 100),
                new Color(0.7f, 0.95f, 0.8f));
            UIPrim.SetField(view, "movesText", UIPrim.ToTMP(mv));

            Button pause = UIPrim.MakeButton(topBar, "PauseBtn", "❚❚",
                new Vector2(820, 0), new Vector2(100, 80),
                new Color(0.35f, 0.35f, 0.55f), Color.white, 36);
            UIPrim.SetField(view, "pauseButton", pause);

            RectTransform objPanel = UIPrim.MakePanel(p, "Objectives",
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(60, -160), new Vector2(-60, -40),
                new Color(0.1f, 0.08f, 0.2f, 0.6f));
            UIPrim.SetField(view, "objectivesContainer", objPanel);

            RectTransform combo = UIPrim.MakePanel(p, "Combo",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, 150), new Vector2(500, 150),
                new Color(0, 0, 0, 0));
            CanvasGroup cg = combo.gameObject.AddComponent<CanvasGroup>();
            cg.alpha = 0; cg.blocksRaycasts = false; cg.interactable = false;
            Text comboT = UIPrim.MakeText(combo, "ComboText", "连击!", 52,
                TextAnchor.MiddleCenter, Vector2.zero, new Vector2(500, 150),
                new Color(1f, 0.6f, 0.3f));
            UIPrim.SetField(view, "comboDisplay", combo.gameObject);
            UIPrim.SetField(view, "comboText", UIPrim.ToTMP(comboT));
            UIPrim.SetField(view, "comboCanvasGroup", cg);
            combo.gameObject.SetActive(false);

            RectTransform scorePop = UIPrim.MakePanel(p, "ScorePopups",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(1920, 1080),
                new Color(0, 0, 0, 0));
            UIPrim.SetField(view, "scorePopupContainer", scorePop);
        }

        // ======================== LevelComplete ========================
        public static void BuildLevelComplete(GameObject root, LevelCompleteView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.75f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(900, 880),
                new Color(0.12f, 0.2f, 0.14f));

            Text lvTitle = UIPrim.MakeText(panel, "LevelTitle", "关卡完成！", 52,
                TextAnchor.MiddleCenter, new Vector2(0, 370), new Vector2(700, 100),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "levelTitleText", UIPrim.ToTMP(lvTitle));

            RectTransform starsArea = UIPrim.MakePanel(panel, "StarsArea",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, 200), new Vector2(600, 160),
                new Color(0, 0, 0, 0));
            List<Image> stars = new List<Image>();
            for (int i = 0; i < 3; i++)
            {
                Image si = UIPrim.MakePanel(starsArea, "Star" + i,
                    new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                    new Vector2((i - 1) * 180, 0), new Vector2(120, 120),
                    new Color(1f, 0.85f, 0.3f)).GetComponent<Image>();
                stars.Add(si);
            }
            UIPrim.SetField(view, "starImages", stars.ToArray());

            Text sc = UIPrim.MakeText(panel, "Score", "0", 80,
                TextAnchor.MiddleCenter, new Vector2(0, 20), new Vector2(500, 120),
                Color.white);
            UIPrim.SetField(view, "scoreText", UIPrim.ToTMP(sc));

            Text ts = UIPrim.MakeText(panel, "TargetScore", "目标: 1000", 24,
                TextAnchor.MiddleCenter, new Vector2(0, -70), new Vector2(500, 50),
                Color.gray);
            UIPrim.SetField(view, "targetScoreText", UIPrim.ToTMP(ts));

            Text cnR = UIPrim.MakeText(panel, "CoinsReward", "+100", 34,
                TextAnchor.MiddleCenter, new Vector2(-180, -160), new Vector2(260, 60),
                new Color(1f, 0.85f, 0.3f));
            UIPrim.SetField(view, "coinsRewardText", UIPrim.ToTMP(cnR));

            Text xpR = UIPrim.MakeText(panel, "XPReward", "+500 XP", 34,
                TextAnchor.MiddleCenter, new Vector2(180, -160), new Vector2(260, 60),
                new Color(0.6f, 0.85f, 1f));
            UIPrim.SetField(view, "xpRewardText", UIPrim.ToTMP(xpR));

            RectTransform mats = UIPrim.MakePanel(panel, "Materials",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, -260), new Vector2(700, 90),
                new Color(0.08f, 0.12f, 0.1f, 0.6f));
            UIPrim.SetField(view, "materialsContainer", mats);

            Button cont = UIPrim.MakeButton(panel, "ContinueBtn", "继续装修",
                new Vector2(-240, -380), new Vector2(280, 80),
                new Color(0.35f, 0.75f, 0.5f), Color.white, 28);
            UIPrim.SetField(view, "continueButton", cont);

            Button retry = UIPrim.MakeButton(panel, "RetryBtn", "重新挑战",
                new Vector2(0, -380), new Vector2(280, 80),
                new Color(0.85f, 0.65f, 0.35f), Color.white, 28);
            UIPrim.SetField(view, "retryButton", retry);

            Button mm = UIPrim.MakeButton(panel, "MMBtn", "返回主菜单",
                new Vector2(240, -380), new Vector2(280, 80),
                new Color(0.55f, 0.55f, 0.8f), Color.white, 28);
            UIPrim.SetField(view, "mainMenuButton", mm);
        }

        // ======================== LevelFailed ========================
        public static void BuildLevelFailed(GameObject root, LevelFailedView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.8f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(860, 800),
                new Color(0.22f, 0.1f, 0.14f));
            CanvasGroup shakeCG = panel.gameObject.AddComponent<CanvasGroup>();
            UIPrim.SetField(view, "shakeCanvasGroup", shakeCG);

            RectTransform failIcon = UIPrim.MakePanel(panel, "FailIcon",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, 280), new Vector2(180, 180),
                new Color(0.9f, 0.35f, 0.35f));
            UIPrim.MakeText(failIcon, "X", "✗", 96,
                TextAnchor.MiddleCenter, Vector2.zero, new Vector2(180, 180),
                Color.white);
            UIPrim.SetField(view, "failIconTransform", failIcon);

            Text reason = UIPrim.MakeText(panel, "Reason", "步数用尽，挑战失败", 34,
                TextAnchor.MiddleCenter, new Vector2(0, 120), new Vector2(700, 80),
                new Color(1f, 0.6f, 0.6f));
            UIPrim.SetField(view, "reasonText", UIPrim.ToTMP(reason));

            Text sc = UIPrim.MakeText(panel, "Score", "0", 68,
                TextAnchor.MiddleCenter, new Vector2(0, 0), new Vector2(500, 100),
                Color.white);
            UIPrim.SetField(view, "scoreText", UIPrim.ToTMP(sc));

            Text ts = UIPrim.MakeText(panel, "TargetScore", "目标: 1000", 24,
                TextAnchor.MiddleCenter, new Vector2(0, -80), new Vector2(500, 50),
                Color.gray);
            UIPrim.SetField(view, "targetScoreText", UIPrim.ToTMP(ts));

            Text objF = UIPrim.MakeText(panel, "ObjFailed", "目标情况", 26,
                TextAnchor.MiddleCenter, new Vector2(0, -150), new Vector2(600, 50),
                new Color(0.95f, 0.7f, 0.7f));
            UIPrim.SetField(view, "objectivesFailedText", UIPrim.ToTMP(objF));

            Button retry = UIPrim.MakeButton(panel, "RetryBtn", "重新挑战",
                new Vector2(-240, -280), new Vector2(280, 80),
                new Color(0.85f, 0.65f, 0.35f), Color.white, 28);
            UIPrim.SetField(view, "retryButton", retry);

            Button boost = UIPrim.MakeButton(panel, "BoostBtn", "+10步",
                new Vector2(0, -280), new Vector2(280, 80),
                new Color(0.5f, 0.75f, 1f), Color.white, 28);
            UIPrim.SetField(view, "useBoostButton", boost);

            Button mm = UIPrim.MakeButton(panel, "MMBtn", "返回主菜单",
                new Vector2(240, -280), new Vector2(280, 80),
                new Color(0.55f, 0.55f, 0.8f), Color.white, 28);
            UIPrim.SetField(view, "mainMenuButton", mm);
        }

        // ======================== LoadingScreen ========================
        public static void BuildLoadingScreen(GameObject root, LoadingScreenView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Bg", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.08f, 0.06f, 0.16f));

            Text title = UIPrim.MakeText(p, "Title", "装修配色三消", 72,
                TextAnchor.MiddleCenter, new Vector2(0, 200), new Vector2(800, 140),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "titleText", UIPrim.ToTMP(title));

            Image logo = UIPrim.MakePanel(p, "Logo",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, 0), new Vector2(260, 260),
                new Color(0.9f, 0.65f, 0.35f)).GetComponent<Image>();
            UIPrim.SetField(view, "logoImage", logo);

            RectTransform barBG = UIPrim.MakePanel(p, "BarBG",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, -180), new Vector2(700, 40),
                new Color(0.2f, 0.18f, 0.3f));
            Image fill = UIPrim.MakePanel(barBG, "Fill",
                new Vector2(0, 0), new Vector2(0, 1),
                Vector2.zero, new Vector2(0, 0),
                new Color(0.45f, 0.75f, 1f)).GetComponent<Image>();
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Horizontal;
            fill.fillAmount = 0;
            UIPrim.SetField(view, "loadingBarFill", fill);

            Text prog = UIPrim.MakeText(p, "Progress", "0%", 26,
                TextAnchor.MiddleCenter, new Vector2(0, -250), new Vector2(300, 50),
                Color.white);
            UIPrim.SetField(view, "progressText", UIPrim.ToTMP(prog));

            Text tip = UIPrim.MakeText(p, "Tip", "提示：加载中...", 22,
                TextAnchor.MiddleCenter, new Vector2(0, -330), new Vector2(900, 50),
                new Color(0.8f, 0.8f, 0.95f));
            UIPrim.SetField(view, "loadingTipText", UIPrim.ToTMP(tip));
        }

        // ======================== LevelSelect ========================
        public static void BuildLevelSelect(GameObject root, LevelSelectView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Bg", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0.1f, 0.08f, 0.2f));

            Text title = UIPrim.MakeText(p, "Title", "关卡选择", 44,
                TextAnchor.MiddleCenter, new Vector2(0, 460), new Vector2(600, 80),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "titleText", UIPrim.ToTMP(title));

            RectTransform info = UIPrim.MakePanel(p, "Info",
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(40, -100), new Vector2(-40, -20),
                new Color(0.15f, 0.12f, 0.28f, 0.6f));
            Text lv = UIPrim.MakeText(info, "Level", "Lv.1", 26,
                TextAnchor.MiddleLeft, new Vector2(-800, 0), new Vector2(200, 60),
                Color.white);
            UIPrim.SetField(view, "playerLevelText", UIPrim.ToTMP(lv));
            Text cn = UIPrim.MakeText(info, "Coins", "0", 26,
                TextAnchor.MiddleCenter, new Vector2(0, 0), new Vector2(200, 60),
                new Color(1f, 0.85f, 0.3f));
            UIPrim.SetField(view, "coinsText", UIPrim.ToTMP(cn));
            Text cl = UIPrim.MakeText(info, "Completed", "已完成: 0", 26,
                TextAnchor.MiddleRight, new Vector2(800, 0), new Vector2(300, 60),
                new Color(0.7f, 0.95f, 0.7f));
            UIPrim.SetField(view, "completedLevelsText", UIPrim.ToTMP(cl));

            GameObject viewport = new GameObject("Viewport");
            viewport.transform.SetParent(p, false);
            RectTransform vpRT = viewport.AddComponent<RectTransform>();
            vpRT.anchorMin = new Vector2(0.5f, 0); vpRT.anchorMax = new Vector2(0.5f, 1);
            vpRT.offsetMin = new Vector2(-800, 130); vpRT.offsetMax = new Vector2(800, -180);
            Image vpMask = viewport.AddComponent<Image>();
            vpMask.color = new Color(0.12f, 0.1f, 0.22f, 0.4f);
            Mask m = viewport.AddComponent<Mask>(); m.showMaskGraphic = false;

            RectTransform levels = UIPrim.MakePanel(viewport.transform, "Content",
                new Vector2(0, 1), new Vector2(1, 1),
                Vector2.zero, new Vector2(0, 2400),
                new Color(0, 0, 0, 0));
            UIPrim.SetField(view, "levelsContainer", levels);

            GameObject srGO = new GameObject("Scroll");
            srGO.transform.SetParent(p, false);
            RectTransform srRT = srGO.AddComponent<RectTransform>();
            srRT.anchorMin = Vector2.zero; srRT.anchorMax = Vector2.one;
            srRT.offsetMin = Vector2.zero; srRT.offsetMax = Vector2.zero;
            ScrollRect sr = srGO.AddComponent<ScrollRect>();
            sr.viewport = vpRT; sr.content = levels;
            sr.horizontal = false; sr.vertical = true; sr.movementType = ScrollRect.MovementType.Clamped;
            UIPrim.SetField(view, "levelsScrollRect", sr);

            Button back = UIPrim.MakeButton(p, "BackBtn", "← 返回",
                new Vector2(-820, 460), new Vector2(200, 70),
                new Color(0.45f, 0.45f, 0.65f), Color.white, 26);
            UIPrim.SetField(view, "backButton", back);
        }

        // ======================== MaterialInventory ========================
        public static void BuildMaterialInventory(GameObject root, MaterialInventoryView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.75f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(900, 760),
                new Color(0.1f, 0.08f, 0.2f));

            Text title = UIPrim.MakeText(panel, "Title", "材料仓库", 44,
                TextAnchor.MiddleCenter, new Vector2(0, 330), new Vector2(500, 80),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "titleText", UIPrim.ToTMP(title));

            Text cn = UIPrim.MakeText(panel, "Coins", "0", 32,
                TextAnchor.MiddleRight, new Vector2(360, 330), new Vector2(200, 60),
                new Color(1f, 0.85f, 0.3f));
            UIPrim.SetField(view, "coinsText", UIPrim.ToTMP(cn));

            RectTransform inv = UIPrim.MakePanel(panel, "Inventory",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, 20), new Vector2(760, 500),
                new Color(0.15f, 0.12f, 0.28f, 0.5f));
            UIPrim.SetField(view, "inventoryContainer", inv);

            Button close = UIPrim.MakeButton(panel, "CloseBtn", "关闭",
                new Vector2(0, -310), new Vector2(280, 70),
                new Color(0.5f, 0.5f, 0.7f), Color.white, 28);
            UIPrim.SetField(view, "closeButton", close);
        }

        // ======================== DecorationHUD ========================
        public static void BuildDecorationHUD(GameObject root, DecorationHUDView view)
        {
            Transform p = root.transform;

            RectTransform leftPanel = UIPrim.MakePanel(p, "LeftPanel",
                new Vector2(0, 0), new Vector2(0, 1),
                Vector2.zero, new Vector2(420, 0),
                new Color(0.08f, 0.06f, 0.12f, 0.9f));

            Text cnName = UIPrim.MakeText(leftPanel, "CustName", "客户", 28,
                TextAnchor.MiddleLeft, new Vector2(-130, 450), new Vector2(320, 50),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "customerNameText", UIPrim.ToTMP(cnName));

            Text cDesc = UIPrim.MakeTextStretch(leftPanel, "CustDesc", "描述", 18,
                TextAnchor.UpperLeft,
                new Vector2(0.05f, 0.78f), new Vector2(0.95f, 0.88f),
                Vector2.zero, Vector2.zero, Color.gray);
            UIPrim.SetField(view, "customerDescriptionText", UIPrim.ToTMP(cDesc));

            Image av = UIPrim.MakePanel(leftPanel, "Avatar",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(-120, 380), new Vector2(100, 100),
                new Color(0.85f, 0.7f, 0.55f)).GetComponent<Image>();
            UIPrim.SetField(view, "customerAvatar", av);

            Text rt = UIPrim.MakeText(leftPanel, "RoomType", "客厅", 24,
                TextAnchor.MiddleLeft, new Vector2(40, 380), new Vector2(240, 50),
                Color.white);
            UIPrim.SetField(view, "roomTypeText", UIPrim.ToTMP(rt));

            Text ps = UIPrim.MakeText(leftPanel, "PrefStyle", "偏好: 暖色调", 20,
                TextAnchor.MiddleLeft, new Vector2(-140, 290), new Vector2(340, 40),
                new Color(0.75f, 0.95f, 0.85f));
            UIPrim.SetField(view, "preferredStyleText", UIPrim.ToTMP(ps));

            RectTransform pf = UIPrim.MakePanel(leftPanel, "PrefFurn",
                new Vector2(0.05f, 0.55f), new Vector2(0.95f, 0.64f),
                Vector2.zero, Vector2.zero,
                new Color(0.1f, 0.08f, 0.2f, 0.5f));
            UIPrim.SetField(view, "preferredFurnitureContainer", pf);

            Text bg = UIPrim.MakeText(leftPanel, "Budget", "预算: 5000-8000", 20,
                TextAnchor.MiddleLeft, new Vector2(-140, 470), new Vector2(340, 40),
                new Color(0.95f, 0.85f, 0.65f));
            UIPrim.SetField(view, "budgetText", UIPrim.ToTMP(bg));
            // move budget to lower area
            bg.rectTransform.anchoredPosition = new Vector2(-140, 210);

            Text cost = UIPrim.MakeText(leftPanel, "Cost", "0", 36,
                TextAnchor.MiddleRight, new Vector2(-30, 120), new Vector2(300, 60),
                Color.white);
            UIPrim.SetField(view, "totalCostText", UIPrim.ToTMP(cost));

            Text coinsH = UIPrim.MakeText(leftPanel, "CoinsH", "0", 24,
                TextAnchor.MiddleRight, new Vector2(-30, 60), new Vector2(300, 50),
                new Color(1f, 0.85f, 0.3f));
            UIPrim.SetField(view, "coinsText", UIPrim.ToTMP(coinsH));

            Image csI = UIPrim.MakePanel(leftPanel, "CostStatus",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(320, 120), new Vector2(40, 40),
                new Color(0.4f, 0.85f, 0.45f)).GetComponent<Image>();
            UIPrim.SetField(view, "costStatusImage", csI);

            RectTransform mats = UIPrim.MakePanel(leftPanel, "Mats",
                new Vector2(0.05f, 0.05f), new Vector2(0.95f, 0.18f),
                Vector2.zero, Vector2.zero,
                new Color(0.1f, 0.08f, 0.2f, 0.6f));
            UIPrim.SetField(view, "materialsContainer", mats);

            RectTransform topBar = UIPrim.MakePanel(p, "TopBar",
                new Vector2(0, 1), new Vector2(1, 1),
                new Vector2(420, -90), new Vector2(0, 0),
                new Color(0.08f, 0.06f, 0.12f, 0.85f));

            Button wallC = UIPrim.MakeButton(topBar, "WallColorBtn", "墙面颜色",
                new Vector2(-600, 0), new Vector2(220, 60),
                new Color(0.85f, 0.65f, 0.4f), Color.white, 22);
            UIPrim.SetField(view, "wallColorButton", wallC);

            Button floorC = UIPrim.MakeButton(topBar, "FloorColorBtn", "地板颜色",
                new Vector2(-340, 0), new Vector2(220, 60),
                new Color(0.7f, 0.55f, 0.4f), Color.white, 22);
            UIPrim.SetField(view, "floorColorButton", floorC);

            Button furn = UIPrim.MakeButton(topBar, "FurnBtn", "选择家具",
                new Vector2(-80, 0), new Vector2(220, 60),
                new Color(0.45f, 0.6f, 0.85f), Color.white, 22);
            UIPrim.SetField(view, "furnitureButton", furn);

            Button colr = UIPrim.MakeButton(topBar, "ColorBtn", "家具颜色",
                new Vector2(180, 0), new Vector2(220, 60),
                new Color(0.75f, 0.5f, 0.85f), Color.white, 22);
            UIPrim.SetField(view, "colorsButton", colr);

            Button inv = UIPrim.MakeButton(topBar, "InvBtn", "材料",
                new Vector2(440, 0), new Vector2(160, 60),
                new Color(0.5f, 0.7f, 0.55f), Color.white, 22);
            UIPrim.SetField(view, "inventoryButton", inv);

            RectTransform bottomBar = UIPrim.MakePanel(p, "BottomBar",
                new Vector2(0, 0), new Vector2(1, 0),
                new Vector2(420, 0), new Vector2(0, 110),
                new Color(0.08f, 0.06f, 0.12f, 0.85f));

            RectTransform actSlot = UIPrim.MakePanel(bottomBar, "ActiveSlot",
                new Vector2(0, 0.5f), new Vector2(0, 0.5f),
                new Vector2(250, 0), new Vector2(460, 70),
                new Color(0.2f, 0.15f, 0.3f, 0.7f));
            Text aST = UIPrim.MakeText(actSlot, "AST", "当前: 未选择", 22,
                TextAnchor.MiddleCenter, Vector2.zero, new Vector2(460, 70),
                new Color(0.85f, 0.85f, 1f));
            UIPrim.SetField(view, "activeSlotText", UIPrim.ToTMP(aST));
            UIPrim.SetField(view, "activeSlotPanel", actSlot.gameObject);

            Button reset = UIPrim.MakeButton(bottomBar, "ResetBtn", "重置",
                new Vector2(320, 0), new Vector2(180, 70),
                new Color(0.75f, 0.5f, 0.5f), Color.white, 24);
            UIPrim.SetField(view, "resetButton", reset);

            Button submit = UIPrim.MakeButton(bottomBar, "SubmitBtn", "提交评价",
                new Vector2(560, 0), new Vector2(260, 80),
                new Color(0.4f, 0.8f, 0.5f), Color.white, 28);
            UIPrim.SetField(view, "submitButton", submit);

            Button backH = UIPrim.MakeButton(topBar, "BackBtn", "↩ 主菜单",
                new Vector2(680, 0), new Vector2(180, 60),
                new Color(0.45f, 0.45f, 0.65f), Color.white, 22);
            UIPrim.SetField(view, "backButton", backH);
        }

        // ======================== FurniturePanel ========================
        public static void BuildFurniturePanel(GameObject root, FurniturePanelView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.7f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(1100, 860),
                new Color(0.1f, 0.08f, 0.2f));

            Text title = UIPrim.MakeText(panel, "Title", "选择家具", 40,
                TextAnchor.MiddleCenter, new Vector2(0, 390), new Vector2(500, 80),
                new Color(1f, 0.92f, 0.6f));

            RectTransform cats = UIPrim.MakePanel(panel, "Cats",
                new Vector2(0.5f, 1), new Vector2(0.5f, 1),
                new Vector2(0, -90), new Vector2(1000, 80),
                new Color(0.15f, 0.12f, 0.28f, 0.7f));
            UIPrim.SetField(view, "categoriesContainer", cats);

            RectTransform itemsArea = UIPrim.MakePanel(panel, "Items",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(-150, 0), new Vector2(640, 580),
                new Color(0.12f, 0.08f, 0.18f, 0.6f));
            UIPrim.SetField(view, "itemsContainer", itemsArea);

            RectTransform info = UIPrim.MakePanel(panel, "Info",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(380, 0), new Vector2(300, 580),
                new Color(0.15f, 0.12f, 0.28f, 0.9f));

            Text sN = UIPrim.MakeText(info, "SelName", "请选择家具", 24,
                TextAnchor.MiddleCenter, new Vector2(0, 230), new Vector2(260, 60),
                Color.white);
            UIPrim.SetField(view, "selectedNameText", UIPrim.ToTMP(sN));

            Image prev = UIPrim.MakePanel(info, "Preview",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, 120), new Vector2(200, 200),
                new Color(0.95f, 0.9f, 0.85f)).GetComponent<Image>();
            UIPrim.SetField(view, "selectedPreviewImage", prev);

            Text sD = UIPrim.MakeTextStretch(info, "SelDesc", "", 16,
                TextAnchor.UpperLeft,
                new Vector2(0.1f, 0.45f), new Vector2(0.9f, 0.62f),
                Vector2.zero, Vector2.zero, Color.gray);
            UIPrim.SetField(view, "selectedDescText", UIPrim.ToTMP(sD));

            Text sC = UIPrim.MakeText(info, "SelCost", "-", 28,
                TextAnchor.MiddleCenter, new Vector2(0, -30), new Vector2(260, 50),
                new Color(1f, 0.85f, 0.35f));
            UIPrim.SetField(view, "selectedCostText", UIPrim.ToTMP(sC));

            Text sQ = UIPrim.MakeText(info, "SelQual", "-", 20,
                TextAnchor.MiddleCenter, new Vector2(-80, -90), new Vector2(220, 40),
                Color.white);
            UIPrim.SetField(view, "selectedQualityText", UIPrim.ToTMP(sQ));

            Text sS = UIPrim.MakeText(info, "SelStyle", "-", 20,
                TextAnchor.MiddleCenter, new Vector2(80, -90), new Vector2(180, 40),
                new Color(0.8f, 0.9f, 1f));
            UIPrim.SetField(view, "selectedStyleText", UIPrim.ToTMP(sS));

            Button place = UIPrim.MakeButton(info, "PlaceBtn", "放置家具",
                new Vector2(0, -210), new Vector2(240, 70),
                new Color(0.4f, 0.8f, 0.5f), Color.white, 26);
            place.interactable = false;
            UIPrim.SetField(view, "placeButton", place);

            Button closeFP = UIPrim.MakeButton(panel, "CloseFPBtn", "关闭",
                new Vector2(-420, -390), new Vector2(200, 60),
                new Color(0.5f, 0.5f, 0.7f), Color.white, 24);
            UIPrim.SetField(view, "closeButton", closeFP);
        }

        // ======================== ColorPanel ========================
        public static void BuildColorPanel(GameObject root, ColorPanelView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.7f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(1050, 820),
                new Color(0.1f, 0.08f, 0.2f));

            Text title = UIPrim.MakeText(panel, "Title", "选择颜色", 40,
                TextAnchor.MiddleCenter, new Vector2(0, 370), new Vector2(500, 80),
                new Color(1f, 0.92f, 0.6f));

            RectTransform matsTabs = UIPrim.MakePanel(panel, "MatTabs",
                new Vector2(0.5f, 1), new Vector2(0.5f, 1),
                new Vector2(0, -90), new Vector2(980, 70),
                new Color(0.15f, 0.12f, 0.28f, 0.7f));
            UIPrim.SetField(view, "materialTabsContainer", matsTabs);

            RectTransform colorsArea = UIPrim.MakePanel(panel, "Colors",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(-160, -20), new Vector2(600, 540),
                new Color(0.12f, 0.08f, 0.18f, 0.6f));
            UIPrim.SetField(view, "colorsContainer", colorsArea);

            RectTransform info = UIPrim.MakePanel(panel, "Info",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(360, -20), new Vector2(300, 540),
                new Color(0.15f, 0.12f, 0.28f, 0.9f));

            Text sNc = UIPrim.MakeText(info, "SelName", "请选择颜色", 22,
                TextAnchor.MiddleCenter, new Vector2(0, 220), new Vector2(260, 50),
                Color.white);
            UIPrim.SetField(view, "selectedNameText", UIPrim.ToTMP(sNc));

            Image prevC = UIPrim.MakePanel(info, "Preview",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0, 110), new Vector2(180, 180),
                Color.gray).GetComponent<Image>();
            UIPrim.SetField(view, "selectedPreviewImage", prevC);

            Text sSc = UIPrim.MakeText(info, "SelStyle", "-", 18,
                TextAnchor.MiddleCenter, new Vector2(0, -10), new Vector2(260, 40),
                new Color(0.8f, 0.9f, 1f));
            UIPrim.SetField(view, "selectedStyleText", UIPrim.ToTMP(sSc));

            Text sCc = UIPrim.MakeText(info, "SelCost", "-", 26,
                TextAnchor.MiddleCenter, new Vector2(0, -60), new Vector2(260, 50),
                new Color(1f, 0.85f, 0.35f));
            UIPrim.SetField(view, "selectedCostText", UIPrim.ToTMP(sCc));

            Text sMc = UIPrim.MakeText(info, "SelMat", "-", 18,
                TextAnchor.MiddleCenter, new Vector2(-80, -110), new Vector2(220, 40),
                Color.white);
            UIPrim.SetField(view, "selectedMaterialText", UIPrim.ToTMP(sMc));

            Text sQc = UIPrim.MakeText(info, "SelQual", "-", 18,
                TextAnchor.MiddleCenter, new Vector2(80, -110), new Vector2(140, 40),
                Color.white);
            UIPrim.SetField(view, "selectedQualityText", UIPrim.ToTMP(sQc));

            Text rMc = UIPrim.MakeText(info, "ReqMat", "-", 18,
                TextAnchor.MiddleCenter, new Vector2(0, -170), new Vector2(260, 50),
                new Color(0.7f, 1f, 0.75f));
            UIPrim.SetField(view, "requiredMaterialsText", UIPrim.ToTMP(rMc));

            Button applyC = UIPrim.MakeButton(info, "ApplyBtn", "应用颜色",
                new Vector2(0, -240), new Vector2(240, 60),
                new Color(0.4f, 0.8f, 0.5f), Color.white, 24);
            applyC.interactable = false;
            UIPrim.SetField(view, "applyButton", applyC);

            Button closeCP = UIPrim.MakeButton(panel, "CloseCPBtn", "关闭",
                new Vector2(-420, -370), new Vector2(200, 60),
                new Color(0.5f, 0.5f, 0.7f), Color.white, 24);
            UIPrim.SetField(view, "closeButton", closeCP);
        }

        // ======================== CustomerReview ========================
        public static void BuildCustomerReview(GameObject root, CustomerReviewView view)
        {
            Transform p = root.transform;
            UIPrim.MakePanel(p, "Dim", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero,
                new Color(0, 0, 0, 0.75f));

            RectTransform panel = UIPrim.MakePanel(p, "Panel",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(1050, 920),
                new Color(0.08f, 0.12f, 0.16f));

            Text cName = UIPrim.MakeText(panel, "CustName", "客户评价", 26,
                TextAnchor.MiddleLeft, new Vector2(-450, 410), new Vector2(360, 50),
                new Color(1f, 0.92f, 0.6f));
            UIPrim.SetField(view, "customerNameText", UIPrim.ToTMP(cName));

            Image cAv = UIPrim.MakePanel(panel, "CustAvatar",
                new Vector2(0, 1), new Vector2(0, 1),
                new Vector2(90, -70), new Vector2(80, 80),
                new Color(0.85f, 0.7f, 0.55f)).GetComponent<Image>();
            UIPrim.SetField(view, "customerAvatar", cAv);

            Image mood = UIPrim.MakePanel(panel, "Mood",
                new Vector2(0, 1), new Vector2(0, 1),
                new Vector2(160, -70), new Vector2(36, 36),
                new Color(0.4f, 0.85f, 0.45f)).GetComponent<Image>();
            UIPrim.SetField(view, "customerMoodImage", mood);

            RectTransform starsAreaCR = UIPrim.MakePanel(panel, "StarsArea",
                new Vector2(0.5f, 1), new Vector2(0.5f, 1),
                new Vector2(0, -180), new Vector2(700, 140),
                new Color(0, 0, 0, 0));
            List<Image> crStars = new List<Image>();
            for (int i = 0; i < 5; i++)
            {
                Image si = UIPrim.MakePanel(starsAreaCR, "Star" + i,
                    new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                    new Vector2((i - 2) * 120, 0), new Vector2(90, 90),
                    new Color(1f, 0.85f, 0.3f)).GetComponent<Image>();
                crStars.Add(si);
            }
            UIPrim.SetField(view, "starImages", crStars.ToArray());

            Text ts = UIPrim.MakeText(panel, "TotalScore", "0 / 100", 52,
                TextAnchor.MiddleCenter, new Vector2(-250, -150), new Vector2(400, 90),
                Color.white);
            UIPrim.SetField(view, "totalScoreText", UIPrim.ToTMP(ts));

            Text pc = UIPrim.MakeText(panel, "Percentage", "0%", 36,
                TextAnchor.MiddleCenter, new Vector2(250, -150), new Vector2(280, 70),
                new Color(0.6f, 0.9f, 1f));
            UIPrim.SetField(view, "percentageText", UIPrim.ToTMP(pc));

            Text fb = UIPrim.MakeTextStretch(panel, "Feedback", "", 20,
                TextAnchor.UpperLeft,
                new Vector2(0.05f, 0.58f), new Vector2(0.95f, 0.67f),
                Vector2.zero, Vector2.zero, new Color(0.9f, 0.9f, 0.95f));
            UIPrim.SetField(view, "feedbackText", UIPrim.ToTMP(fb));

            RectTransform bd = UIPrim.MakePanel(panel, "Breakdown",
                new Vector2(0.05f, 0.28f), new Vector2(0.48f, 0.56f),
                Vector2.zero, Vector2.zero,
                new Color(0.1f, 0.12f, 0.18f, 0.7f));
            UIPrim.SetField(view, "breakdownContainer", bd);

            RectTransform pp = UIPrim.MakePanel(panel, "PosPoints",
                new Vector2(0.52f, 0.42f), new Vector2(0.95f, 0.56f),
                Vector2.zero, Vector2.zero,
                new Color(0.08f, 0.18f, 0.12f, 0.7f));
            UIPrim.SetField(view, "positivePointsContainer", pp);

            RectTransform np = UIPrim.MakePanel(panel, "NegPoints",
                new Vector2(0.52f, 0.28f), new Vector2(0.95f, 0.40f),
                Vector2.zero, Vector2.zero,
                new Color(0.18f, 0.08f, 0.12f, 0.7f));
            UIPrim.SetField(view, "negativePointsContainer", np);

            Text cRwd = UIPrim.MakeText(panel, "CoinsRwd", "+0", 28,
                TextAnchor.MiddleCenter, new Vector2(-320, -380), new Vector2(220, 50),
                new Color(1f, 0.85f, 0.3f));
            UIPrim.SetField(view, "coinsRewardText", UIPrim.ToTMP(cRwd));

            Text xRwd = UIPrim.MakeText(panel, "XPRwd", "+0 XP", 28,
                TextAnchor.MiddleCenter, new Vector2(-60, -380), new Vector2(220, 50),
                new Color(0.6f, 0.85f, 1f));
            UIPrim.SetField(view, "xpRewardText", UIPrim.ToTMP(xRwd));

            RectTransform bm = UIPrim.MakePanel(panel, "BonusMats",
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(250, -380), new Vector2(240, 60),
                new Color(0.1f, 0.08f, 0.2f, 0.5f));
            UIPrim.SetField(view, "bonusMaterialsContainer", bm);

            Button nextO = UIPrim.MakeButton(panel, "NextOrderBtn", "下一单",
                new Vector2(-320, -420), new Vector2(220, 60),
                new Color(0.35f, 0.75f, 0.5f), Color.white, 24);
            UIPrim.SetField(view, "nextOrderButton", nextO);

            Button retryCR = UIPrim.MakeButton(panel, "RetryBtnCR", "重新装修",
                new Vector2(-60, -420), new Vector2(220, 60),
                new Color(0.85f, 0.65f, 0.35f), Color.white, 24);
            UIPrim.SetField(view, "retryButton", retryCR);

            Button mmCR = UIPrim.MakeButton(panel, "MMBtnCR", "返回主菜单",
                new Vector2(200, -420), new Vector2(220, 60),
                new Color(0.55f, 0.55f, 0.8f), Color.white, 24);
            UIPrim.SetField(view, "mainMenuButton", mmCR);

            Button share = UIPrim.MakeButton(panel, "ShareBtn", "分享",
                new Vector2(420, -420), new Vector2(140, 60),
                new Color(0.45f, 0.6f, 0.8f), Color.white, 22);
            UIPrim.SetField(view, "shareButton", share);
        }
    }
}