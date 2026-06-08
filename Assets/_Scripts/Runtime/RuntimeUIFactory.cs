using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.Runtime
{
    public static class RuntimeUIFactory
    {
        private static Font _runtimeFont;
        public static Font RuntimeFont
        {
            get
            {
                if (_runtimeFont == null) _runtimeFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                if (_runtimeFont == null) _runtimeFont = Resources.GetBuiltinResource<Font>("Arial.ttf");
                return _runtimeFont;
            }
        }

        private static bool _initialized;

        public static void EnsureAllUI()
        {
            if (_initialized) return;
            _initialized = true;
            EnsureEventSystem();
            EnsureMainMenuCanvas();
            EnsureHUDCanvas();
            EnsurePauseCanvas();
            EnsureSettingsCanvas();
            EnsureTutorialCanvas();
            EnsureGameOverCanvas();
            EnsureVictoryCanvas();
            EnsureFadeOverlay();

            if (LightShadowPlatformer.UI.UIManager.Instance != null)
                LinkRefsToUIManager();

            LightShadowPlatformer.Core.EventManager.Instance.TriggerTutorialTriggered("__internal_init__", "");
            LightShadowPlatformer.Core.EventManager.Instance.TriggerTutorialTriggered("__clear__", "");
        }

        private static void EnsureEventSystem()
        {
            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() != null) return;
            GameObject es = new GameObject("EventSystem");
            es.AddComponent<UnityEngine.EventSystems.EventSystem>();
            es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }

        private static Canvas CreateCanvas(string name, int order, RenderMode mode = RenderMode.ScreenSpaceOverlay)
        {
            GameObject go = new GameObject(name);
            Canvas c = go.AddComponent<Canvas>();
            c.renderMode = mode; c.sortingOrder = order;
            CanvasScaler scaler = go.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            go.AddComponent<GraphicRaycaster>();
            return c;
        }

        private static TMP_Text CreateText(string text, Transform parent, Vector2 anchor, Vector2 size,
            int fontSize = 36, TextAlignmentOptions align = TextAlignmentOptions.Center)
        {
            GameObject go = new GameObject("Text_" + text.Substring(0, Mathf.Min(6, text.Length)));
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = anchor; rt.anchorMax = anchor;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size; rt.anchoredPosition = Vector2.zero;
            TextMeshProUGUI t = go.AddComponent<TextMeshProUGUI>();
            t.text = text; t.fontSize = fontSize; t.alignment = align;
            t.color = Color.white; t.font = Resources.GetBuiltinResource<TMP_FontAsset>("LiberationSans SDF");
            if (t.font == null) t.font = TMP_Settings.defaultFontAsset;
            return t;
        }

        private static Button CreateButton(string label, Transform parent, Vector2 anchor, Vector2 size,
            Vector2 offset, UnityEngine.Events.UnityAction onClick)
        {
            GameObject go = new GameObject("Button_" + label);
            go.transform.SetParent(parent, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = anchor; rt.anchorMax = anchor; rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = size; rt.anchoredPosition = offset;
            Image img = go.AddComponent<Image>();
            img.color = new Color(0.2f, 0.35f, 0.6f, 0.95f);
            img.sprite = RuntimeFactory.MakeBoxSprite(new Color(0.25f, 0.45f, 0.75f), new Color(0.12f, 0.22f, 0.45f), 48, 4);
            img.type = Image.Type.Sliced;
            Button b = go.AddComponent<Button>();
            b.onClick.AddListener(() =>
            {
                LightShadowPlatformer.UI.UIManager.Instance?.PlayButtonClick();
                onClick?.Invoke();
            });
            ColorBlock cb = b.colors;
            cb.highlightedColor = new Color(0.4f, 0.6f, 0.85f);
            cb.pressedColor = new Color(0.18f, 0.28f, 0.5f);
            b.colors = cb;

            GameObject lblGO = new GameObject("Label");
            lblGO.transform.SetParent(go.transform, false);
            RectTransform lrt = lblGO.AddComponent<RectTransform>();
            lrt.anchorMin = Vector2.zero; lrt.anchorMax = Vector2.one;
            lrt.offsetMin = Vector2.zero; lrt.offsetMax = Vector2.zero;
            TextMeshProUGUI t = lblGO.AddComponent<TextMeshProUGUI>();
            t.text = label; t.fontSize = 32; t.alignment = TextAlignmentOptions.Center;
            t.color = Color.white; t.font = Resources.GetBuiltinResource<TMP_FontAsset>("LiberationSans SDF");
            return b;
        }

        // ======= MAIN MENU =======
        public static Canvas EnsureMainMenuCanvas()
        {
            Canvas existing = GameObject.Find("Canvas_MainMenu")?.GetComponent<Canvas>();
            if (existing != null) return existing;

            Canvas c = CreateCanvas("Canvas_MainMenu", 10);

            GameObject bgGO = new GameObject("Panel");
            bgGO.transform.SetParent(c.transform, false);
            RectTransform brt = bgGO.AddComponent<RectTransform>();
            brt.anchorMin = Vector2.zero; brt.anchorMax = Vector2.one; brt.offsetMin = Vector2.zero; brt.offsetMax = Vector2.zero;
            Image bi = bgGO.AddComponent<Image>();
            bi.color = new Color(0.08f, 0.1f, 0.18f, 0.85f);

            CreateText("光与影的迷途", c.transform, new Vector2(0.5f, 0.8f), new Vector2(900, 100), 96);
            CreateText("Light & Shadow Platformer", c.transform, new Vector2(0.5f, 0.72f), new Vector2(600, 60), 36, TextAlignmentOptions.Center);
            CreateText("版本 0.1.0   |   A/D 移动 · Space 跳 · E 切光 · F 互动 · Esc 暂停",
                c.transform, new Vector2(0.5f, 0.06f), new Vector2(1400, 50), 24, TextAlignmentOptions.Center);

            GameObject btns = new GameObject("Buttons");
            btns.transform.SetParent(c.transform, false);

            CreateButton("▶ 新游戏", btns.transform, new Vector2(0.5f, 0.55f), new Vector2(380, 72), new Vector2(0, 0), () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.StartNewGame();
            });
            CreateButton("⏵ 继续游戏", btns.transform, new Vector2(0.5f, 0.45f), new Vector2(380, 72), new Vector2(0, 0), () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.ContinueGame();
            });
            CreateButton("⚙ 设置", btns.transform, new Vector2(0.5f, 0.35f), new Vector2(380, 72), new Vector2(0, 0), () =>
            {
                LightShadowPlatformer.UI.UIManager.Instance?.ShowSettingsMenu();
            });
            CreateButton("✕ 退出", btns.transform, new Vector2(0.5f, 0.25f), new Vector2(380, 72), new Vector2(0, 0), () =>
            {
#if UNITY_EDITOR
                UnityEditor.EditorApplication.isPlaying = false;
#else
                Application.Quit();
#endif
            });

            c.gameObject.SetActive(false);
            return c;
        }

        // ======= HUD =======
        public static Canvas EnsureHUDCanvas()
        {
            Canvas existing = GameObject.Find("Canvas_HUD")?.GetComponent<Canvas>();
            if (existing != null) return existing;

            Canvas c = CreateCanvas("Canvas_HUD", 20);

            // 左上角：关卡名
            CreateText("关卡 1 / 3", c.transform, new Vector2(0.05f, 0.93f), new Vector2(400, 50), 36, TextAlignmentOptions.Left);

            // 右上角：收集品
            CreateText("💎 0 / 3", c.transform, new Vector2(0.95f, 0.93f), new Vector2(250, 50), 32, TextAlignmentOptions.Right);

            // 顶部中间：光源方向指示
            CreateText("← 左光", c.transform, new Vector2(0.5f, 0.93f), new Vector2(300, 50), 36, TextAlignmentOptions.Center);

            // 左上：血量
            CreateText("❤❤❤", c.transform, new Vector2(0.05f, 0.86f), new Vector2(400, 50), 32, TextAlignmentOptions.Left);

            // 存档点激活提示
            CreateText("✓ 存档点已激活", c.transform, new Vector2(0.5f, 0.78f), new Vector2(500, 50), 32, TextAlignmentOptions.Center);

            // 底部：操作提示
            CreateText("A/D ← → 移动  |  Space 跳跃  |  E 切换光源  |  F 互动  |  Esc 暂停",
                c.transform, new Vector2(0.5f, 0.05f), new Vector2(1500, 50), 22, TextAlignmentOptions.Center);

            // 红色 death vignette
            GameObject dv = new GameObject("DeathVignette");
            dv.transform.SetParent(c.transform, false);
            RectTransform dvrt = dv.AddComponent<RectTransform>();
            dvrt.anchorMin = Vector2.zero; dvrt.anchorMax = Vector2.one;
            dvrt.offsetMin = Vector2.zero; dvrt.offsetMax = Vector2.zero;
            CanvasGroup dvcg = dv.AddComponent<CanvasGroup>();
            dvcg.alpha = 0;
            Image dvi = dv.AddComponent<Image>();
            dvi.color = new Color(1, 0, 0, 0.5f);
            dvi.raycastTarget = false;

            c.gameObject.SetActive(false);
            return c;
        }

        // ======= PAUSE =======
        public static Canvas EnsurePauseCanvas()
        {
            Canvas existing = GameObject.Find("Canvas_Pause")?.GetComponent<Canvas>();
            if (existing != null) return existing;

            Canvas c = CreateCanvas("Canvas_Pause", 30);

            GameObject dim = new GameObject("Dim");
            dim.transform.SetParent(c.transform, false);
            RectTransform drt = dim.AddComponent<RectTransform>();
            drt.anchorMin = Vector2.zero; drt.anchorMax = Vector2.one;
            drt.offsetMin = Vector2.zero; drt.offsetMax = Vector2.zero;
            Image dimg = dim.AddComponent<Image>(); dimg.color = new Color(0, 0, 0, 0.65f);

            CreateText("⏸ 暂停", c.transform, new Vector2(0.5f, 0.82f), new Vector2(600, 90), 80);

            GameObject panel = new GameObject("Panel");
            panel.transform.SetParent(c.transform, false);
            RectTransform prt = panel.AddComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.5f, 0.5f); prt.anchorMax = new Vector2(0.5f, 0.5f);
            prt.pivot = new Vector2(0.5f, 0.5f);
            prt.sizeDelta = new Vector2(500, 450);
            Image pi = panel.AddComponent<Image>();
            pi.color = new Color(0.12f, 0.15f, 0.25f, 0.95f);
            pi.sprite = RuntimeFactory.MakeBoxSprite(new Color(0.15f, 0.2f, 0.35f), new Color(0.3f, 0.45f, 0.7f), 48, 4);
            pi.type = Image.Type.Sliced;

            GameObject buttons = new GameObject("Buttons");
            buttons.transform.SetParent(panel.transform, false);

            CreateButton("继续游戏", buttons.transform, new Vector2(0.5f, 0.72f), new Vector2(340, 64), Vector2.zero, () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.TogglePause();
            });
            CreateButton("重开本关", buttons.transform, new Vector2(0.5f, 0.54f), new Vector2(340, 64), Vector2.zero, () =>
            {
                LightShadowPlatformer.UI.UIManager.Instance?.HidePauseMenu();
                LightShadowPlatformer.Core.GameManager.Instance?.RestartLevel();
            });
            CreateButton("设置", buttons.transform, new Vector2(0.5f, 0.36f), new Vector2(340, 64), Vector2.zero, () =>
            {
                LightShadowPlatformer.UI.UIManager.Instance?.ShowSettingsMenu();
            });
            CreateButton("返回主菜单", buttons.transform, new Vector2(0.5f, 0.18f), new Vector2(340, 64), Vector2.zero, () =>
            {
                LightShadowPlatformer.UI.UIManager.Instance?.HidePauseMenu();
                LightShadowPlatformer.Core.GameManager.Instance?.ReturnToMainMenu();
            });

            c.gameObject.SetActive(false);
            return c;
        }

        // ======= SETTINGS =======
        public static Canvas EnsureSettingsCanvas()
        {
            Canvas existing = GameObject.Find("Canvas_Settings")?.GetComponent<Canvas>();
            if (existing != null) return existing;

            Canvas c = CreateCanvas("Canvas_Settings", 40);

            GameObject dim = new GameObject("Dim");
            dim.transform.SetParent(c.transform, false);
            RectTransform drt = dim.AddComponent<RectTransform>();
            drt.anchorMin = Vector2.zero; drt.anchorMax = Vector2.one;
            drt.offsetMin = Vector2.zero; drt.offsetMax = Vector2.zero;
            Image dimg = dim.AddComponent<Image>(); dimg.color = new Color(0, 0, 0, 0.75f);

            GameObject panel = new GameObject("Panel");
            panel.transform.SetParent(c.transform, false);
            RectTransform prt = panel.AddComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.5f, 0.5f); prt.anchorMax = new Vector2(0.5f, 0.5f);
            prt.pivot = new Vector2(0.5f, 0.5f);
            prt.sizeDelta = new Vector2(900, 750);
            Image pi = panel.AddComponent<Image>();
            pi.color = new Color(0.1f, 0.12f, 0.22f, 0.98f);
            pi.sprite = RuntimeFactory.MakeBoxSprite(new Color(0.12f, 0.16f, 0.3f), new Color(0.3f, 0.45f, 0.7f), 48, 5);
            pi.type = Image.Type.Sliced;

            CreateText("⚙ 设置", panel.transform, new Vector2(0.5f, 0.93f), new Vector2(400, 60), 52);

            CreateText("音量", panel.transform, new Vector2(0.1f, 0.83f), new Vector2(300, 40), 32, TextAlignmentOptions.Left);
            CreateText("画质", panel.transform, new Vector2(0.1f, 0.58f), new Vector2(300, 40), 32, TextAlignmentOptions.Left);
            CreateText("游戏", panel.transform, new Vector2(0.1f, 0.43f), new Vector2(300, 40), 32, TextAlignmentOptions.Left);
            CreateText("操作", panel.transform, new Vector2(0.1f, 0.3f), new Vector2(300, 40), 32, TextAlignmentOptions.Left);

            CreateText("移动:A/D · 跳:Space · 切光:E · 互动:F · 暂停:Esc",
                panel.transform, new Vector2(0.5f, 0.22f), new Vector2(800, 40), 22, TextAlignmentOptions.Center);

            CreateButton("返回", panel.transform, new Vector2(0.5f, 0.08f), new Vector2(280, 56), Vector2.zero, () =>
            {
                LightShadowPlatformer.Core.SettingsManager.Instance?.SaveSettings();
                LightShadowPlatformer.UI.UIManager.Instance?.HideSettingsMenu();
            });
            CreateButton("恢复默认", panel.transform, new Vector2(0.5f, 0.08f), new Vector2(280, 56), new Vector2(-300, 0), () =>
            {
                LightShadowPlatformer.Core.SettingsManager.Instance?.ResetToDefaults();
            });
            CreateButton("保存应用", panel.transform, new Vector2(0.5f, 0.08f), new Vector2(280, 56), new Vector2(300, 0), () =>
            {
                LightShadowPlatformer.Core.SettingsManager.Instance?.SaveSettings();
            });

            c.gameObject.SetActive(false);
            return c;
        }

        // ======= TUTORIAL =======
        public static Canvas EnsureTutorialCanvas()
        {
            Canvas existing = GameObject.Find("Canvas_Tutorial")?.GetComponent<Canvas>();
            if (existing != null) return existing;

            Canvas c = CreateCanvas("Canvas_Tutorial", 35);

            GameObject panel = new GameObject("Bubble");
            panel.transform.SetParent(c.transform, false);
            RectTransform prt = panel.AddComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.5f, 0.25f); prt.anchorMax = new Vector2(0.5f, 0.25f);
            prt.pivot = new Vector2(0.5f, 0.5f);
            prt.sizeDelta = new Vector2(900, 220);
            Image pi = panel.AddComponent<Image>();
            pi.color = new Color(0.95f, 0.9f, 0.55f, 0.95f);
            pi.sprite = RuntimeFactory.MakeBoxSprite(new Color(1f, 0.95f, 0.65f), new Color(0.65f, 0.5f, 0.15f), 48, 6);
            pi.type = Image.Type.Sliced;

            CreateText("提示文字", panel.transform, new Vector2(0.5f, 0.55f), new Vector2(800, 120), 28, TextAlignmentOptions.Center);

            CreateText("按任意键继续 →", panel.transform, new Vector2(0.5f, 0.12f), new Vector2(600, 40), 20, TextAlignmentOptions.Center);

            c.gameObject.SetActive(false);
            return c;
        }

        // ======= GAME OVER =======
        public static Canvas EnsureGameOverCanvas()
        {
            Canvas existing = GameObject.Find("Canvas_GameOver")?.GetComponent<Canvas>();
            if (existing != null) return existing;

            Canvas c = CreateCanvas("Canvas_GameOver", 50);

            GameObject dim = new GameObject("Dim");
            dim.transform.SetParent(c.transform, false);
            RectTransform drt = dim.AddComponent<RectTransform>();
            drt.anchorMin = Vector2.zero; drt.anchorMax = Vector2.one;
            drt.offsetMin = Vector2.zero; drt.offsetMax = Vector2.zero;
            Image dimg = dim.AddComponent<Image>(); dimg.color = new Color(0.5f, 0, 0, 0.55f);

            CreateText("☠ 失败", c.transform, new Vector2(0.5f, 0.75f), new Vector2(600, 110), 84);
            CreateText("被黑暗吞噬了...", c.transform, new Vector2(0.5f, 0.65f), new Vector2(800, 50), 32, TextAlignmentOptions.Center);

            CreateButton("⟲ 从存档点复活", c.transform, new Vector2(0.5f, 0.45f), new Vector2(360, 72), Vector2.zero, () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.ChangeState(
                    LightShadowPlatformer.Core.GameManager.GameState.Playing);
                LightShadowPlatformer.Core.EventManager.Instance.TriggerPlayerSpawn();
            });
            CreateButton("⟲ 重开本关", c.transform, new Vector2(0.5f, 0.34f), new Vector2(360, 72), Vector2.zero, () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.RestartLevel();
            });
            CreateButton("返回主菜单", c.transform, new Vector2(0.5f, 0.23f), new Vector2(360, 72), Vector2.zero, () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.ReturnToMainMenu();
            });

            c.gameObject.SetActive(false);
            return c;
        }

        // ======= VICTORY =======
        public static Canvas EnsureVictoryCanvas()
        {
            Canvas existing = GameObject.Find("Canvas_Victory")?.GetComponent<Canvas>();
            if (existing != null) return existing;

            Canvas c = CreateCanvas("Canvas_Victory", 50);

            GameObject dim = new GameObject("Dim");
            dim.transform.SetParent(c.transform, false);
            RectTransform drt = dim.AddComponent<RectTransform>();
            drt.anchorMin = Vector2.zero; drt.anchorMax = Vector2.one;
            drt.offsetMin = Vector2.zero; drt.offsetMax = Vector2.zero;
            Image dimg = dim.AddComponent<Image>(); dimg.color = new Color(0, 0.25f, 0.5f, 0.6f);

            CreateText("🎉 通关完成", c.transform, new Vector2(0.5f, 0.8f), new Vector2(800, 120), 84);
            CreateText("光明与影的交织中，你找到了道路", c.transform, new Vector2(0.5f, 0.7f), new Vector2(1000, 50), 30, TextAlignmentOptions.Center);
            CreateText("收集品: 0 / 0", c.transform, new Vector2(0.5f, 0.55f), new Vector2(600, 50), 32);

            CreateButton("下一关 →", c.transform, new Vector2(0.5f, 0.42f), new Vector2(360, 72), Vector2.zero, () =>
            {
                var gm = LightShadowPlatformer.Core.GameManager.Instance;
                if (gm != null) { if (gm.currentLevelIndex >= gm.totalLevels - 1) gm.ReturnToMainMenu(); else gm.CompleteLevel(); }
            });
            CreateButton("⟲ 重玩本关", c.transform, new Vector2(0.5f, 0.31f), new Vector2(360, 72), Vector2.zero, () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.RestartLevel();
            });
            CreateButton("返回主菜单", c.transform, new Vector2(0.5f, 0.2f), new Vector2(360, 72), Vector2.zero, () =>
            {
                LightShadowPlatformer.Core.GameManager.Instance?.ReturnToMainMenu();
            });

            c.gameObject.SetActive(false);
            return c;
        }

        // ======= FADE OVERLAY =======
        public static Image EnsureFadeOverlay()
        {
            Image existing = GameObject.Find("FadeOverlay")?.GetComponent<Image>();
            if (existing != null) return existing;
            GameObject go = new GameObject("FadeOverlay");
            Canvas c = go.AddComponent<Canvas>();
            c.sortingOrder = 100; c.renderMode = RenderMode.ScreenSpaceOverlay;
            go.AddComponent<CanvasScaler>();
            go.AddComponent<GraphicRaycaster>();
            RectTransform rt = go.GetComponent<RectTransform>();
            GameObject f = new GameObject("FadeImage");
            f.transform.SetParent(go.transform, false);
            RectTransform frt = f.AddComponent<RectTransform>();
            frt.anchorMin = Vector2.zero; frt.anchorMax = Vector2.one;
            frt.offsetMin = Vector2.zero; frt.offsetMax = Vector2.zero;
            Image img = f.AddComponent<Image>();
            img.color = new Color(0, 0, 0, 0);
            f.SetActive(false);
            return img;
        }

        // ======= LINK REFS =======
        private static void LinkRefsToUIManager()
        {
            var mgr = LightShadowPlatformer.UI.UIManager.Instance;
            if (mgr == null) return;
            mgr.mainMenuCanvas = SafeFindCanvas("Canvas_MainMenu");
            mgr.hudCanvas = SafeFindCanvas("Canvas_HUD");
            mgr.pauseCanvas = SafeFindCanvas("Canvas_Pause");
            mgr.settingsCanvas = SafeFindCanvas("Canvas_Settings");
            mgr.gameOverCanvas = SafeFindCanvas("Canvas_GameOver");
            mgr.victoryCanvas = SafeFindCanvas("Canvas_Victory");
            mgr.tutorialCanvas = SafeFindCanvas("Canvas_Tutorial");
            mgr.fadeOverlay = EnsureFadeOverlay();

            mgr.hudController = Object.FindObjectOfType<LightShadowPlatformer.UI.HUDController>();
            if (mgr.hudController == null && mgr.hudCanvas != null)
            {
                mgr.hudController = mgr.hudCanvas.gameObject.AddComponent<LightShadowPlatformer.UI.HUDController>();
            }
            mgr.mainMenuController = Object.FindObjectOfType<LightShadowPlatformer.UI.MainMenuController>();
            mgr.pauseMenuController = Object.FindObjectOfType<LightShadowPlatformer.UI.PauseMenuController>();
            mgr.settingsMenuController = Object.FindObjectOfType<LightShadowPlatformer.UI.SettingsMenuController>();
            mgr.gameOverController = Object.FindObjectOfType<LightShadowPlatformer.UI.GameOverController>();
            mgr.victoryController = Object.FindObjectOfType<LightShadowPlatformer.UI.VictoryController>();
            mgr.tutorialPanelController = Object.FindObjectOfType<LightShadowPlatformer.UI.TutorialPanelController>();

            if (mgr.mainMenuCanvas != null)
            {
                LightShadowPlatformer.UI.MainMenuController mm = mgr.mainMenuCanvas.GetComponent<LightShadowPlatformer.UI.MainMenuController>();
                if (mm == null) mm = mgr.mainMenuCanvas.gameObject.AddComponent<LightShadowPlatformer.UI.MainMenuController>();
                mgr.mainMenuController = mm;
            }
            if (mgr.pauseCanvas != null)
            {
                var pm = mgr.pauseCanvas.GetComponent<LightShadowPlatformer.UI.PauseMenuController>();
                if (pm == null) pm = mgr.pauseCanvas.gameObject.AddComponent<LightShadowPlatformer.UI.PauseMenuController>();
                mgr.pauseMenuController = pm;
            }
            if (mgr.settingsCanvas != null)
            {
                var sm = mgr.settingsCanvas.GetComponent<LightShadowPlatformer.UI.SettingsMenuController>();
                if (sm == null) sm = mgr.settingsCanvas.gameObject.AddComponent<LightShadowPlatformer.UI.SettingsMenuController>();
                mgr.settingsMenuController = sm;
            }
            if (mgr.gameOverCanvas != null)
            {
                var gom = mgr.gameOverCanvas.GetComponent<LightShadowPlatformer.UI.GameOverController>();
                if (gom == null) gom = mgr.gameOverCanvas.gameObject.AddComponent<LightShadowPlatformer.UI.GameOverController>();
                mgr.gameOverController = gom;
            }
            if (mgr.victoryCanvas != null)
            {
                var vm = mgr.victoryCanvas.GetComponent<LightShadowPlatformer.UI.VictoryController>();
                if (vm == null) vm = mgr.victoryCanvas.gameObject.AddComponent<LightShadowPlatformer.UI.VictoryController>();
                mgr.victoryController = vm;
            }
            if (mgr.tutorialCanvas != null)
            {
                var tm = mgr.tutorialCanvas.GetComponent<LightShadowPlatformer.UI.TutorialPanelController>();
                if (tm == null) tm = mgr.tutorialCanvas.gameObject.AddComponent<LightShadowPlatformer.UI.TutorialPanelController>();
                mgr.tutorialPanelController = tm;
            }
        }

        private static Canvas SafeFindCanvas(string name)
        {
            var go = GameObject.Find(name);
            return go?.GetComponent<Canvas>();
        }
    }
}
