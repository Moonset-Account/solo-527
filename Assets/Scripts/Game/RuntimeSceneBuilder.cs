using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Audio;
using TMPro;
using ShadowPlatformer.Core;
using ShadowPlatformer.Player;
using ShadowPlatformer.Light;
using ShadowPlatformer.Level;
using ShadowPlatformer.Save;
using ShadowPlatformer.Audio;
using ShadowPlatformer.Mechanics;
using ShadowPlatformer.UI;
using ShadowPlatformer.Analytics;

namespace ShadowPlatformer.Game
{
    public class RuntimeSceneBuilder : MonoBehaviour
    {
        public enum SceneType
        {
            MainMenu,
            Level
        }

        public SceneType sceneType;
        public string levelId = "tut_01";

        private void Start()
        {
            switch (sceneType)
            {
                case SceneType.MainMenu:
                    CreateMainMenuUI();
                    break;
                case SceneType.Level:
                    CreateLevelScene();
                    break;
            }
        }

        private void CreateMainMenuUI()
        {
            GameManager.Instance.SetGameMode(GameMode.Menu);

            var canvas = CreateCanvas("MenuCanvas", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var panel = CreateUIObject("MainPanel", canvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var titleText = CreateText("Title", panel.transform, "光影平台跳跃", 72, new Vector2(0, 200));
            var continueBtn = CreateButton("ContinueBtn", panel.transform, "继续", new Vector2(0, 50));
            var newGameBtn = CreateButton("NewGameBtn", panel.transform, "新游戏", new Vector2(0, -20));
            var levelSelectBtn = CreateButton("LevelSelectBtn", panel.transform, "关卡选择", new Vector2(0, -55));
            var settingsBtn = CreateButton("SettingsBtn", panel.transform, "设置", new Vector2(0, -90));
            var quitBtn = CreateButton("QuitBtn", panel.transform, "退出", new Vector2(0, -160));

            var mainMenu = canvas.AddComponent<MainMenu>();
            mainMenu.continueButton = continueBtn;
            mainMenu.newGameButton = newGameBtn;
            mainMenu.levelSelectButton = levelSelectBtn;
            mainMenu.settingsButton = settingsBtn;
            mainMenu.quitButton = quitBtn;
            mainMenu.mainPanel = panel;

            var levelSelectPanel = CreateUIObject("LevelSelectPanel", canvas.transform);
            var lsRect = levelSelectPanel.AddComponent<RectTransform>();
            lsRect.anchorMin = Vector2.zero;
            lsRect.anchorMax = Vector2.one;
            lsRect.offsetMin = Vector2.zero;
            lsRect.offsetMax = Vector2.zero;
            levelSelectPanel.SetActive(false);
            mainMenu.levelSelectPanel = levelSelectPanel;

            var lsBackBtn = CreateButton("LevelSelectBackBtn", levelSelectPanel.transform, "返回", new Vector2(0, -400));
            mainMenu.levelSelectBackButton = lsBackBtn;

            var lsContainer = CreateUIObject("LevelButtonContainer", levelSelectPanel.transform);
            var lsContRect = lsContainer.AddComponent<RectTransform>();
            lsContRect.anchorMin = new Vector2(0.5f, 1f);
            lsContRect.anchorMax = new Vector2(0.5f, 1f);
            lsContRect.pivot = new Vector2(0.5f, 1f);
            lsContRect.sizeDelta = new Vector2(600, 800);
            lsContRect.anchoredPosition = new Vector2(0, -50);
            var lsLayout = lsContainer.AddComponent<VerticalLayoutGroup>();
            lsLayout.childControlWidth = true;
            lsLayout.childControlHeight = false;
            lsLayout.childForceExpandWidth = true;
            lsLayout.spacing = 10;
            mainMenu.levelButtonContainer = lsContainer.transform;

            var settingsPanelObj = CreateSettingsPanel(canvas);
            mainMenu.settingsPanel = settingsPanelObj.GetComponent<SettingsPanel>();

            var eventSystemGo = new GameObject("EventSystem");
            eventSystemGo.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGo.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

            AudioManager.Instance?.PlayMenuMusic();
        }

        private void CreateLevelScene()
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);

            var camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            var cam = camObj.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.backgroundColor = new Color(0.08f, 0.08f, 0.12f, 1f);
            camObj.AddComponent<AudioListener>();
            var camCtrl = camObj.AddComponent<CameraController>();
            camObj.transform.position = new Vector3(0f, 1f, -10f);

            var lightObj = new GameObject("DirectionalLight");
            var dLight = lightObj.AddComponent<Light>();
            dLight.type = LightType.Directional;
            dLight.intensity = 0.8f;
            dLight.color = new Color(1f, 0.95f, 0.8f);
            lightObj.transform.rotation = Quaternion.Euler(0f, 0f, 0f);
            if (LightManager.Instance != null)
                LightManager.Instance.directionalLightObject = lightObj;

            CreatePlayer(camCtrl);

            var levelRoot = new GameObject("LevelRoot");

            CreateGround(levelRoot);
            CreateLevelPlatforms(levelRoot);
            CreateLevelMechanisms(levelRoot);
            CreateHazardZones(levelRoot);
            CreateLevelExit(levelRoot);
            CreateCheckpoints(levelRoot);

            CreateHUD();
            CreateDeathScreen();
            CreateLevelCompleteScreen();
            CreatePauseMenu();

            if (!FindObjectOfType<UnityEngine.EventSystems.EventSystem>())
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            if (LevelManager.Instance != null)
                LevelManager.Instance.StartLevel(levelId);

            AudioManager.Instance?.PlayLevelMusic(0);
        }

        private void CreatePlayer(CameraController camCtrl)
        {
            var playerObj = new GameObject("Player");
            playerObj.tag = "Player";
            playerObj.transform.position = new Vector2(-5f, 1f);
            playerObj.layer = LayerMask.NameToLayer("Player");

            var rb = playerObj.AddComponent<Rigidbody2D>();
            rb.constraints = RigidbodyConstraints2D.FreezeRotation;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.gravityScale = 3f;

            var col = playerObj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(0.6f, 1f);

            var sr = playerObj.AddComponent<SpriteRenderer>();
            sr.color = Color.white;
            sr.sprite = CreatePixelSprite();

            var input = playerObj.AddComponent<PlayerInput>();
            var ctrl = playerObj.AddComponent<PlayerController>();

            var gcp = new GameObject("GroundCheck");
            gcp.transform.SetParent(playerObj.transform);
            gcp.transform.localPosition = new Vector3(0f, -0.5f, 0f);
            ctrl.groundCheckPoint = gcp.transform;
            ctrl.groundLayer = LayerMask.GetMask("Default", "Ground");

            camCtrl.target = playerObj.transform;
        }

        private void CreateGround(GameObject parent)
        {
            var ground = new GameObject("Ground");
            ground.transform.SetParent(parent.transform);
            ground.transform.position = new Vector3(0f, -3f, 0f);
            ground.layer = LayerMask.NameToLayer("Ground");

            var sr = ground.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.3f, 0.3f, 0.35f);
            sr.size = new Vector2(40f, 1f);
            sr.sprite = CreatePixelSprite();

            var col = ground.AddComponent<BoxCollider2D>();
            col.size = new Vector2(40f, 1f);
        }

        private void CreateLevelPlatforms(GameObject parent)
        {
            CreateStaticPlatform("Platform_1", new Vector2(-3f, -1f), new Vector2(4f, 0.5f), parent);
            CreateStaticPlatform("Platform_2", new Vector2(5f, 0f), new Vector2(3f, 0.5f), parent);
            CreateStaticPlatform("Platform_3", new Vector2(10f, 1f), new Vector2(3f, 0.5f), parent);
            CreateStaticPlatform("Platform_4", new Vector2(16f, 0f), new Vector2(4f, 0.5f), parent);
            CreateStaticPlatform("Platform_5", new Vector2(20f, -1f), new Vector2(5f, 0.5f), parent);

            CreateShadowPlatform("SP_Right", new Vector2(3f, 0f), new Vector2(3f, 0.5f), LightDirection.Right, parent);
            CreateShadowPlatform("SP_Left", new Vector2(7f, 2f), new Vector2(3f, 0.5f), LightDirection.Left, parent);
            CreateShadowPlatform("SP_Up", new Vector2(11f, 4f), new Vector2(3f, 0.5f), LightDirection.Up, parent);
            CreateShadowPlatform("SP_Down", new Vector2(15f, 3f), new Vector2(2f, 0.5f), LightDirection.Down, parent);
        }

        private void CreateStaticPlatform(string name, Vector2 pos, Vector2 size, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;
            obj.layer = LayerMask.NameToLayer("Ground");

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.35f, 0.35f, 0.4f);
            sr.size = size;
            sr.sprite = CreatePixelSprite();

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = size;
        }

        private void CreateShadowPlatform(string name, Vector2 pos, Vector2 size, LightDirection dir, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.4f, 0.4f, 0.7f, 0.8f);
            sr.size = size;
            sr.sprite = CreatePixelSprite();

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = size;

            var sp = obj.AddComponent<ShadowPlatform>();
            sp.shadowDirection = dir;
            sp.visibilityRule = ShadowVisibility.WhenLightMatches;
        }

        private void CreateLevelMechanisms(GameObject parent)
        {
            var triggerObj = new GameObject("PressurePlate_1");
            triggerObj.transform.SetParent(parent.transform);
            triggerObj.transform.position = new Vector2(5f, -2.5f);

            var tCol = triggerObj.AddComponent<BoxCollider2D>();
            tCol.size = new Vector2(1.5f, 0.2f);
            tCol.isTrigger = true;

            var tSr = triggerObj.AddComponent<SpriteRenderer>();
            tSr.color = new Color(0.8f, 0.6f, 0.2f);
            tSr.size = new Vector2(1.5f, 0.2f);
            tSr.sprite = CreatePixelSprite();

            var mt = triggerObj.AddComponent<MechanismTrigger>();
            mt.triggerType = TriggerType.PressurePlate;
            mt.triggerId = "pressure_1";

            var leverObj = new GameObject("Lever_1");
            leverObj.transform.SetParent(parent.transform);
            leverObj.transform.position = new Vector2(10f, -2.5f);

            var lCol = leverObj.AddComponent<BoxCollider2D>();
            lCol.size = new Vector2(0.8f, 1.2f);
            lCol.isTrigger = true;

            var lSr = leverObj.AddComponent<SpriteRenderer>();
            lSr.color = new Color(0.9f, 0.5f, 0.1f);
            lSr.size = new Vector2(0.5f, 1.2f);
            lSr.sprite = CreatePixelSprite();

            var leverMt = leverObj.AddComponent<MechanismTrigger>();
            leverMt.triggerType = TriggerType.Lever;
            leverMt.triggerId = "lever_1";

            var lever = leverObj.AddComponent<InteractableLever>();
            lever.linkedTrigger = leverMt;
            lever.interactionRadius = 1.5f;

            var doorObj = new GameObject("Door_1");
            doorObj.transform.SetParent(parent.transform);
            doorObj.transform.position = new Vector2(13f, -2f);

            var dCol = doorObj.AddComponent<BoxCollider2D>();
            dCol.size = new Vector2(1f, 2f);

            var dSr = doorObj.AddComponent<SpriteRenderer>();
            dSr.color = new Color(0.7f, 0.2f, 0.2f);
            dSr.size = new Vector2(1f, 2f);
            dSr.sprite = CreatePixelSprite();

            var door = doorObj.AddComponent<MechanismReceiver>();
            door.receiverId = "door_1";
            door.requiredTriggerIds = new string[] { "pressure_1", "lever_1" };
            door.requireAllTriggers = false;

            var linker = parent.AddComponent<MechanismLinker>();
            linker.triggers = new MechanismTrigger[] { mt, leverMt };
            linker.receivers = new MechanismReceiver[] { door };
        }

        private void CreateHazardZones(GameObject parent)
        {
            var hazard = new GameObject("Hazard_Spikes");
            hazard.transform.SetParent(parent.transform);
            hazard.transform.position = new Vector2(1f, -2.6f);

            var hCol = hazard.AddComponent<BoxCollider2D>();
            hCol.size = new Vector2(2f, 0.3f);
            hCol.isTrigger = true;

            var hSr = hazard.AddComponent<SpriteRenderer>();
            hSr.color = new Color(1f, 0.2f, 0.2f, 0.6f);
            hSr.size = new Vector2(2f, 0.3f);
            hSr.sprite = CreatePixelSprite();

            var hz = hazard.AddComponent<HazardZone>();
            hz.instantKill = true;
        }

        private void CreateLevelExit(GameObject parent)
        {
            var exitObj = new GameObject("LevelExit");
            exitObj.transform.SetParent(parent.transform);
            exitObj.transform.position = new Vector2(14f, 3f);

            var col = exitObj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(1f, 2f);
            col.isTrigger = true;

            var sr = exitObj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0f, 1f, 0.5f, 0.5f);
            sr.size = new Vector2(1f, 2f);
            sr.sprite = CreatePixelSprite();

            var exit = exitObj.AddComponent<LevelExit>();
            exit.nextLevelId = "tut_02";
        }

        private void CreateCheckpoints(GameObject parent)
        {
            CreateCheckpoint("CP_Start", new Vector2(-4f, -2.5f), parent);
            CreateCheckpoint("CP_Mid", new Vector2(5f, -2.5f), parent);
            CreateCheckpoint("CP_Late", new Vector2(12f, -2.5f), parent);
        }

        private void CreateCheckpoint(string name, Vector2 pos, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(1f, 1.5f);
            col.isTrigger = true;

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = Color.cyan;
            sr.size = new Vector2(0.5f, 1.5f);
            sr.sprite = CreatePixelSprite();

            var cp = obj.AddComponent<Checkpoint>();
            cp.checkpointId = name;
        }

        private Canvas CreateHUD()
        {
            var canvas = CreateCanvas("HUD", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var hud = canvas.AddComponent<HUD>();
            hud.timerText = CreateText("Timer", canvas.transform, "00:00", 36, new Vector2(-600, 450)).GetComponent<TMP_Text>();
            hud.deathCountText = CreateText("Deaths", canvas.transform, "0", 36, new Vector2(600, 450)).GetComponent<TMP_Text>();

            var tutorialPanel = CreateUIObject("TutorialPanel", canvas.transform);
            var tutRect = tutorialPanel.AddComponent<RectTransform>();
            tutRect.anchorMin = new Vector2(0.5f, 0.3f);
            tutRect.anchorMax = new Vector2(0.5f, 0.3f);
            tutRect.sizeDelta = new Vector2(800, 80);
            var tutText = CreateText("TutorialText", tutorialPanel.transform, "", 28, Vector2.zero);
            hud.tutorialPanel = tutorialPanel;
            hud.tutorialText = tutText.GetComponent<TMP_Text>();

            var lightDirText = CreateText("LightDir", canvas.transform, "→", 48, new Vector2(0, 450));
            hud.lightDirectionIndicator = null;

            return canvas;
        }

        private void CreateDeathScreen()
        {
            var canvas = CreateCanvas("DeathScreen", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var ds = canvas.AddComponent<DeathScreen>();
            canvas.gameObject.SetActive(false);
            ds.deathPanel = canvas.gameObject;

            var msgText = CreateText("DeathMsg", canvas.transform, "", 42, new Vector2(0, 100));
            ds.deathMessageText = msgText.GetComponent<TMP_Text>();

            var retryBtn = CreateButton("RetryBtn", canvas.transform, "重试", new Vector2(0, -20));
            ds.retryButton = retryBtn;
            var menuBtn = CreateButton("MenuBtn", canvas.transform, "主菜单", new Vector2(0, -90));
            ds.quitButton = menuBtn;
        }

        private void CreateLevelCompleteScreen()
        {
            var canvas = CreateCanvas("LevelComplete", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var lcs = canvas.AddComponent<LevelCompleteScreen>();
            canvas.gameObject.SetActive(false);
            lcs.completePanel = canvas.gameObject;

            var titleText = CreateText("CompleteTitle", canvas.transform, "关卡完成!", 52, new Vector2(0, 150));
            lcs.levelNameText = CreateText("LevelName", canvas.transform, "", 36, new Vector2(0, 80)).GetComponent<TMP_Text>();
            lcs.timeText = CreateText("Time", canvas.transform, "", 30, new Vector2(0, 20)).GetComponent<TMP_Text>();
            lcs.deathsText = CreateText("Deaths", canvas.transform, "", 30, new Vector2(0, -20)).GetComponent<TMP_Text>();

            var nextBtn = CreateButton("NextBtn", canvas.transform, "下一关", new Vector2(0, -80));
            lcs.nextLevelButton = nextBtn;
            var replayBtn = CreateButton("ReplayBtn", canvas.transform, "重玩", new Vector2(0, -140));
            lcs.replayButton = replayBtn;
            var menuBtn = CreateButton("MenuBtn", canvas.transform, "主菜单", new Vector2(0, -200));
            lcs.menuButton = menuBtn;
        }

        private void CreatePauseMenu()
        {
            var canvas = CreateCanvas("PauseMenu", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var pm = canvas.AddComponent<PauseMenu>();
            canvas.gameObject.SetActive(false);
            pm.pausePanel = canvas.gameObject;

            var resumeBtn = CreateButton("ResumeBtn", canvas.transform, "继续", new Vector2(0, 50));
            pm.resumeButton = resumeBtn;
            var restartBtn = CreateButton("RestartBtn", canvas.transform, "重启关卡", new Vector2(0, -20));
            pm.restartButton = restartBtn;
            var settingsBtn = CreateButton("SettingsBtn", canvas.transform, "设置", new Vector2(0, -90));
            pm.settingsButton = settingsBtn;
            var quitBtn = CreateButton("QuitBtn", canvas.transform, "主菜单", new Vector2(0, -160));
            pm.quitButton = quitBtn;
        }

        private GameObject CreateSettingsPanel(Canvas parentCanvas)
        {
            var panel = CreateUIObject("SettingsPanel", parentCanvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var img = panel.AddComponent<Image>();
            img.color = new Color(0.1f, 0.1f, 0.15f, 0.95f);

            var sp = panel.AddComponent<SettingsPanel>();

            var masterLabel = CreateText("MasterLabel", panel.transform, "主音量", 24, new Vector2(-200, 300));
            var masterSlider = CreateSlider("MasterVolume", panel.transform, new Vector2(0, 260));
            sp.masterVolumeSlider = masterSlider;

            var musicLabel = CreateText("MusicLabel", panel.transform, "音乐音量", 24, new Vector2(-200, 200));
            var musicSlider = CreateSlider("MusicVolume", panel.transform, new Vector2(0, 160));
            sp.musicVolumeSlider = musicSlider;

            var sfxLabel = CreateText("SFXLabel", panel.transform, "音效音量", 24, new Vector2(-200, 100));
            var sfxSlider = CreateSlider("SFXVolume", panel.transform, new Vector2(0, 60));
            sp.sfxVolumeSlider = sfxSlider;

            var backBtn = CreateButton("BackBtn", panel.transform, "返回", new Vector2(0, -300));
            sp.backButton = backBtn;

            panel.SetActive(false);
            return panel;
        }

        private Slider CreateSlider(string name, Transform parent, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(400f, 20f);
            rect.anchoredPosition = anchoredPos;

            var bgObj = CreateUIObject("Background", obj.transform);
            var bgRect = bgObj.AddComponent<RectTransform>();
            bgRect.anchorMin = Vector2.zero;
            bgRect.anchorMax = Vector2.one;
            bgRect.offsetMin = Vector2.zero;
            bgRect.offsetMax = Vector2.zero;
            var bgImg = bgObj.AddComponent<Image>();
            bgImg.color = new Color(0.3f, 0.3f, 0.35f);

            var fillObj = CreateUIObject("Fill", obj.transform);
            var fillRect = fillObj.AddComponent<RectTransform>();
            fillRect.anchorMin = Vector2.zero;
            fillRect.anchorMax = new Vector2(1f, 1f);
            fillRect.offsetMin = Vector2.zero;
            fillRect.offsetMax = Vector2.zero;
            var fillImg = fillObj.AddComponent<Image>();
            fillImg.color = new Color(0.5f, 0.5f, 0.8f);

            var handleObj = CreateUIObject("Handle", obj.transform);
            var handleRect = handleObj.AddComponent<RectTransform>();
            handleRect.sizeDelta = new Vector2(20f, 30f);
            var handleImg = handleObj.AddComponent<Image>();
            handleImg.color = Color.white;

            var slider = obj.AddComponent<Slider>();
            slider.targetGraphic = handleImg;
            slider.fillRect = fillRect;
            slider.handleRect = handleRect;
            slider.minValue = 0.0001f;
            slider.maxValue = 1f;
            slider.value = 0.8f;
            slider.direction = Slider.Direction.LeftToRight;

            return slider;
        }

        private Canvas CreateCanvas(string name, RenderMode renderMode)
        {
            var obj = new GameObject(name);
            var canvas = obj.AddComponent<Canvas>();
            canvas.renderMode = renderMode;
            canvas.sortingOrder = 0;
            return canvas;
        }

        private GameObject CreateUIObject(string name, Transform parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            return obj;
        }

        private Button CreateButton(string name, Transform parent, string text, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(300f, 60f);
            rect.anchoredPosition = anchoredPos;

            var img = obj.AddComponent<Image>();
            img.color = new Color(0.2f, 0.2f, 0.3f, 0.9f);

            var btn = obj.AddComponent<Button>();
            btn.targetGraphic = img;

            var colors = btn.colors;
            colors.highlightedColor = new Color(0.4f, 0.4f, 0.6f);
            colors.pressedColor = new Color(0.15f, 0.15f, 0.2f);
            btn.colors = colors;

            var childObj = CreateUIObject("Text", obj.transform);
            var childRect = childObj.AddComponent<RectTransform>();
            childRect.anchorMin = Vector2.zero;
            childRect.anchorMax = Vector2.one;
            childRect.offsetMin = Vector2.zero;
            childRect.offsetMax = Vector2.zero;

            var tmp = childObj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 28;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return btn;
        }

        private GameObject CreateText(string name, Transform parent, string text, int fontSize, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(800f, 60f);
            rect.anchoredPosition = anchoredPos;

            var tmp = obj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return obj;
        }

        private Sprite CreatePixelSprite()
        {
            var tex = new Texture2D(1, 1);
            tex.SetPixel(0, 0, Color.white);
            tex.Apply();
            var sprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 100f);
            return sprite;
        }
    }
}
